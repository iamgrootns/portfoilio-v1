export default async (req) => {
  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 });
  const key = process.env.RUNPOD_API_KEY;
  if (!key) return new Response(JSON.stringify({ error: "Server not configured" }), { status: 503 });
  const map = {
    lang: process.env.RUNPOD_LANG_ENDPOINT,
    transcribe: process.env.RUNPOD_TRANSCRIBE_ENDPOINT || process.env.RUNPOD_LANG_ENDPOINT,
    voice: process.env.RUNPOD_VOICE_ENDPOINT,
    image: process.env.RUNPOD_IMAGE_ENDPOINT,
    audio: process.env.RUNPOD_AUDIO_ENDPOINT,
    video: process.env.RUNPOD_VIDEO_ENDPOINT,
    ocr: process.env.RUNPOD_OCR_ENDPOINT,
    read: process.env.RUNPOD_OCR_ENDPOINT,
  };
  let body;
  try { body = await req.json(); } catch { return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400 }); }
  const alias = (body.alias || body.task || "").toLowerCase();
  const endpointId = map[alias];
  if (!endpointId) return new Response(JSON.stringify({ error: `Unknown alias: ${alias}` }), { status: 400 });
  const input = { ...body };
  delete input.alias; delete input.task;
  // Normalize file field names for RunPod handlers
  // Frontend sends file_base64/file1_base64/file2_base64 uniformly; RunPod lang expects audio_base64
  if (alias === "lang" && input.file_base64 && !input.audio_base64) input.audio_base64 = input.file_base64;
  if (alias === "transcribe" && input.file_base64 && !input.audio_base64) input.audio_base64 = input.file_base64;
  if (alias === "voice") {
    // Voice handler expects two files; keep both naming styles
    if (input.file1_base64 && !input.audio1_base64) input.audio1_base64 = input.file1_base64;
    if (input.file2_base64 && !input.audio2_base64) input.audio2_base64 = input.file2_base64;
  }
  const runRes = await fetch(`https://api.runpod.ai/v2/${endpointId}/run`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ input }),
  });
  const runJson = await runRes.json().catch(() => ({}));
  if (!runRes.ok || !runJson.id) return new Response(JSON.stringify({ error: runJson.error || "Run failed", detail: runJson }), { status: 502 });
  const jobId = runJson.id;
  const deadline = Date.now() + 58_000;
  while (Date.now() < deadline) {
    await new Promise(r => setTimeout(r, 3000));
    const sRes = await fetch(`https://api.runpod.ai/v2/${endpointId}/status/${jobId}`, { headers: { Authorization: `Bearer ${key}` } });
    const sJson = await sRes.json().catch(() => ({}));
    const st = sJson.status;
    if (st === "COMPLETED") {
      const out = sJson.output || {};
      out.execution_ms = sJson.executionTime;
      out.cloud = true;
      return new Response(JSON.stringify(out), { headers: { "Content-Type": "application/json" } });
    }
    if (st === "FAILED" || st === "CANCELLED" || st === "TIMED_OUT") {
      return new Response(JSON.stringify({ error: sJson.error || `Job ${st}`, detail: sJson }), { status: 502 });
    }
  }
  return new Response(JSON.stringify({ error: "RunPod job timed out (still IN_QUEUE/IN_PROGRESS). Try again — worker is still booting.", jobId }), { status: 504 });
};
export const config = { path: "/api/runpod" };
