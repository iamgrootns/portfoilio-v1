async function callOnce(alias: string, payload: Record<string, unknown>): Promise<Response> {
  return fetch("/api/runpod", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ alias, ...payload }),
  });
}

export async function callRunpod<T>(alias: string, payload: Record<string, unknown>): Promise<T> {
  // A cold RunPod worker can still be booting when the edge connection
  // idles out (~30s). Each retry is a fresh connection, so retrying keeps
  // landing on the now-warmer worker until this budget runs out.
  // face loads InsightFace buffalo_l and voiceclone loads two TTS stacks, so
  // both can spend ~70s+ on a cold start before the first frame of real work.
  const budgets: Record<string, number> = {
    video: 120_000,
    face: 180_000,
    voiceclone: 180_000,
  };
  const budgetMs = budgets[alias] ?? 60_000;
  const start = Date.now();
  let res = await callOnce(alias, payload);
  while (!res.ok && (res.status === 502 || res.status === 504) && Date.now() - start < budgetMs) {
    await new Promise((r) => setTimeout(r, 1500));
    res = await callOnce(alias, payload);
  }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (body.error || body.detail) throw new Error(body.error || body.detail);
    if (res.status === 502 || res.status === 504) {
      throw new Error("The worker is still waking up — give it a few seconds and try again.");
    }
    throw new Error(`RunPod ${res.status}`);
  }
  return body as T;
}

export function fileToB64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => {
      const s = String(r.result || "");
      const comma = s.indexOf(",");
      resolve(comma >= 0 ? s.slice(comma + 1) : s);
    };
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}
