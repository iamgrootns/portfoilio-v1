// Netlify cuts an idle connection at ~30s, so this function must never hold
// one open waiting on RunPod. Anything slower than that (face-match is ~70s
// cold) used to die here: the caller got Netlify's HTML timeout page, and
// because the client retried by POSTing the whole payload again, each retry
// submitted a *new* RunPod job instead of reattaching to the pending one.
//
// So submit and poll are separate round trips. A submit waits only briefly,
// long enough that quick jobs still come back in one call, then hands the
// caller a jobId to poll with.
const SUBMIT_WAIT_MS = 12_000;
const POLL_EVERY_MS = 2_000;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function json(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// One status read, mapped onto this function's response contract.
async function readJob(endpointId, jobId, key) {
  const res = await fetch(`https://api.runpod.ai/v2/${endpointId}/status/${jobId}`, {
    headers: { Authorization: `Bearer ${key}` },
  });
  const body = await res.json().catch(() => ({}));

  if (body.status === "COMPLETED") {
    const out = body.output || {};
    out.execution_ms = body.executionTime;
    out.cloud = true;
    return { done: true, response: json(out) };
  }
  if (body.status === "FAILED" || body.status === "CANCELLED" || body.status === "TIMED_OUT") {
    return {
      done: true,
      response: json({ error: body.error || `Job ${body.status}`, detail: body }, 502),
    };
  }
  return { done: false, status: body.status };
}

export default async (req) => {
  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 });

  const key = process.env.RUNPOD_API_KEY;
  if (!key) return json({ error: "Server not configured" }, 503);

  const map = {
    lang: process.env.RUNPOD_LANG_ENDPOINT,
    // No fallback to lang: the transcribe worker has never been deployed, and
    // quietly answering with language-only JSON is worse than a clear 400.
    transcribe: process.env.RUNPOD_TRANSCRIBE_ENDPOINT,
    voice: process.env.RUNPOD_VOICE_ENDPOINT,
    image: process.env.RUNPOD_IMAGE_ENDPOINT,
    audio: process.env.RUNPOD_AUDIO_ENDPOINT,
    video: process.env.RUNPOD_VIDEO_ENDPOINT,
    ocr: process.env.RUNPOD_OCR_ENDPOINT,
    read: process.env.RUNPOD_OCR_ENDPOINT,
    face: process.env.RUNPOD_FACE_ENDPOINT,
    voiceclone: process.env.RUNPOD_VOICECLONE_ENDPOINT,
  };

  let body;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const alias = (body.alias || body.task || "").toLowerCase();
  const endpointId = map[alias];
  if (!endpointId) return json({ error: `Unknown alias: ${alias}` }, 400);

  // Poll mode — the caller already has a job running, so just report on it.
  if (body.jobId) {
    const { done, response, status } = await readJob(endpointId, body.jobId, key);
    return done ? response : json({ pending: true, jobId: body.jobId, status }, 202);
  }

  // Submit mode.
  const input = { ...body };
  delete input.alias;
  delete input.task;
  if (alias === "lang" && input.file_base64 && !input.audio_base64) input.audio_base64 = input.file_base64;
  if (alias === "transcribe" && input.file_base64 && !input.audio_base64) input.audio_base64 = input.file_base64;
  if (alias === "voice") {
    if (input.file1_base64 && !input.audio1_base64) input.audio1_base64 = input.file1_base64;
    if (input.file2_base64 && !input.audio2_base64) input.audio2_base64 = input.file2_base64;
  }

  const runRes = await fetch(`https://api.runpod.ai/v2/${endpointId}/run`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ input }),
  });
  const runJson = await runRes.json().catch(() => ({}));
  if (!runRes.ok || !runJson.id) {
    return json({ error: runJson.error || "Run failed", detail: runJson }, 502);
  }

  const jobId = runJson.id;
  const deadline = Date.now() + SUBMIT_WAIT_MS;
  let last;
  while (Date.now() < deadline) {
    await sleep(POLL_EVERY_MS);
    const { done, response, status } = await readJob(endpointId, jobId, key);
    if (done) return response;
    last = status;
  }

  // Still going. Returning the id is what lets the client keep waiting without
  // ever re-submitting the job.
  return json({ pending: true, jobId, status: last }, 202);
};

export const config = { path: "/api/runpod" };
