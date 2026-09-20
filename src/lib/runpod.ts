type Pending = { pending?: boolean; jobId?: string; status?: string }

async function post(payload: Record<string, unknown>): Promise<Response> {
  return fetch("/api/runpod", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
}

// Netlify returns its own HTML page when a connection times out, so a body is
// not guaranteed to be JSON.
async function readJson(res: Response): Promise<Record<string, unknown>> {
  return res.json().catch(() => ({}))
}

export async function callRunpod<T>(alias: string, payload: Record<string, unknown>): Promise<T> {
  // How long to keep waiting on a job that is already running. face loads
  // InsightFace buffalo_l and voiceclone loads two TTS stacks, so a cold start
  // alone can be ~70s before any real work begins.
  const budgets: Record<string, number> = {
    video: 180_000,
    face: 180_000,
    voiceclone: 240_000,
  }
  const budgetMs = budgets[alias] ?? 90_000
  const start = Date.now()

  let res = await post({ alias, ...payload })
  let body = await readJson(res)

  // 202 means the job is running and the server handed back its id. Poll by
  // that id — re-posting the payload would submit a second job instead.
  while (res.status === 202 && (body as Pending).jobId && Date.now() - start < budgetMs) {
    await new Promise((r) => setTimeout(r, 2500))
    res = await post({ alias, jobId: (body as Pending).jobId })
    body = await readJson(res)
  }

  if (res.status === 202) {
    throw new Error('Still running after a long wait — the worker may be stuck. Try again.')
  }
  if (!res.ok) {
    const err = body.error || body.detail
    if (err) throw new Error(String(err))
    if (res.status === 502 || res.status === 504) {
      throw new Error('The worker is still waking up — give it a few seconds and try again.')
    }
    throw new Error(`RunPod ${res.status}`)
  }
  return body as T
}

export function fileToB64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => {
      const s = String(r.result || "")
      const comma = s.indexOf(",")
      resolve(comma >= 0 ? s.slice(comma + 1) : s)
    }
    r.onerror = () => reject(r.error)
    r.readAsDataURL(file)
  })
}
