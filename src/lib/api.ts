async function readError(res: Response): Promise<string> {
  try {
    const body = await res.json()
    if (typeof body.detail === 'string') return body.detail
    if (Array.isArray(body.detail)) {
      return body.detail.map((d: { msg?: string }) => d.msg || JSON.stringify(d)).join('; ')
    }
    if (body.error) return String(body.error)
    return JSON.stringify(body)
  } catch {
    return res.statusText || `HTTP ${res.status}`
  }
}

function engineDown(): Error {
  return new Error('Engine is not running.')
}

export async function getJson<T>(path: string): Promise<T> {
  let res: Response
  try {
    res = await fetch(path)
  } catch {
    throw engineDown()
  }
  if (res.status === 502 || res.status === 503 || res.status === 504) throw engineDown()
  if (!res.ok) throw new Error(await readError(res))
  return res.json()
}

export async function postForm<T>(path: string, form: FormData): Promise<T> {
  let res: Response
  try {
    res = await fetch(path, { method: 'POST', body: form })
  } catch {
    throw engineDown()
  }
  if (res.status === 502 || res.status === 503 || res.status === 504) throw engineDown()
  if (!res.ok) throw new Error(await readError(res))
  return res.json()
}

export async function fetchAsFile(url: string, filename: string): Promise<File> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Could not load sample ${filename}`)
  const blob = await res.blob()
  return new File([blob], filename, { type: blob.type || 'application/octet-stream' })
}

export type Health = {
  ok: boolean
  system?: string
  cuda?: boolean
  face_model?: boolean
  speech_engine?: string
  gallery_indexed?: number
  office_cache?: boolean
}

export type GalleryItem = {
  id: string
  filename: string
  path: string
  url: string
  ocr_text?: string
  similarity?: number
}

export type SpeechResult = {
  language: string
  language_code: string
  duration_seconds?: number
  transcript: string
  translation: string
  model?: string
  execution_ms?: number
  cloud?: boolean
}

export type VoiceScore = {
  similarity: number
  floor: number
  above_floor: boolean
}

export type VoiceResult = {
  is_same_person: boolean
  similarity: number
  match_percentage: number
  threshold: number
  match_level?: 'strong' | 'could_be' | 'none' | string
  both_agree?: boolean
  model?: string
  execution_ms?: number
  cloud?: boolean
  resemblyzer?: VoiceScore
  nemo?: VoiceScore
  ecapa?: VoiceScore
  checks?: { id: string; label: string; state: string; score?: number; detail?: string }[]
}

export type FaceHit = {  frame_number: number
  timestamp: string
  similarity: number
  confidence: number
  bbox: { x: number; y: number; width: number; height: number }
}

export type FaceResult = {
  found: boolean
  threshold: number
  frames_scanned?: number
  duration_seconds?: number
  total_matches: number
  matches: FaceHit[]
}

export type CloneResult = {
  audio_base64: string
  sample_rate: number
  target_lang: string
  model: string
}

export type FakeFrame = {
  frame_number: number
  timestamp: string
  probability: number
  prediction: string
}

export type FakeCheck = {
  id: string
  label: string
  state: string
  score?: number | null
  detail?: string
}

export type FakeVote = {
  model: string
  label?: string
  confidence?: number
  fake_score?: number
  real_score?: number
}

export type FakeResult = {
  verdict: string
  confidence: number
  probability: number
  modality: string
  model?: string
  execution_ms?: number
  cloud?: boolean
  reasons?: string[]
  frames?: FakeFrame[]
  checks?: FakeCheck[]
  votes?: FakeVote[]
  dsp?: FakeCheck[]
  metadata?: string[]
  filename?: string
  width?: number
  height?: number
  duration_seconds?: number
  sample_rate?: number
  fps?: number
  frames_scanned?: number
  fake_frame_count?: number
  overlay_jpeg_b64?: string | null
  provenance?: {
    claim_generator?: string | null
    software_agent?: string | null
    digital_source_type?: string | null
    c2pa_summary?: Record<string, unknown>
    jumbf_summary?: Record<string, unknown>
  }
}

export type ReverseResult = {
  found: boolean
  query?: string
  threshold: number
  total_matches: number
  matches: GalleryItem[]
}

export type OcrPage = {
  PageNumber?: number
  pageNumber?: number
  ProcessedText?: string
  text?: string
  Text?: string
}

export function pageNumberOf(p: OcrPage, fallback: number): number {
  return p.PageNumber ?? p.pageNumber ?? fallback
}

export function pageTextOf(p: OcrPage): string {
  return p.ProcessedText || p.text || p.Text || ''
}

export type EntityBag = {
  phoneNumbers?: string[]
  MobileNumber?: string[]
  PAN?: string[]
  Aadhaar?: string[]
  Email?: string[]
  URL?: string[]
  VoterID?: string[]
  DrivingLicense?: string[]
  IFSC?: string[]
  Dates_EN?: string[]
  Dates_HI?: string[]
}

export type ReadResult = {
  results: Array<{
    Filename?: string
    filename?: string
    Ocr?: OcrPage[]
    ocr?: Array<{ pageNumber: number; text: string }>
    nameNumberLocation?: EntityBag
  }>
}
