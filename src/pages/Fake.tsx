import { useEffect, useMemo, useState } from 'react'
import DropZone from '../components/DropZone'
import Station from '../components/Station'
import { stations } from '../data/stations'
import { fetchAsFile, type FakeCheck, type FakeResult } from '../lib/api'
import { callRunpod, fileToB64 } from '../lib/runpod'
import { useElapsed } from '../lib/engine'

const meta = stations.find((s) => s.id === 'fake') ?? stations[0]

type Modality = 'image' | 'audio' | 'video'

const IMAGE_EXT = ['.jpg', '.jpeg', '.png', '.webp', '.bmp', '.tiff', '.gif']
const AUDIO_EXT = ['.mp3', '.wav', '.flac', '.ogg', '.m4a', '.aac', '.wma']
const VIDEO_EXT = ['.mp4', '.avi', '.mov', '.mkv', '.wmv', '.flv', '.webm', '.m4v']

function extOf(name: string) {
  const i = name.lastIndexOf('.')
  return i >= 0 ? name.slice(i).toLowerCase() : ''
}

function inferModality(file: File): Modality | null {
  const type = (file.type || '').toLowerCase()
  const ext = extOf(file.name)
  if (type.startsWith('image/') || IMAGE_EXT.includes(ext)) return 'image'
  if (type.startsWith('audio/') || AUDIO_EXT.includes(ext)) return 'audio'
  if (type.startsWith('video/') || VIDEO_EXT.includes(ext)) return 'video'
  return null
}

function bytesLabel(n: number) {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`
  return `${(n / (1024 * 1024)).toFixed(1)} MB`
}

function mark(state: string) {
  const s = state.toLowerCase()
  if (s === 'fake' || s === 'manipulated') return 'MARK'
  if (s === 'real' || s === 'clean') return 'CLEAR'
  return 'SOFT'
}

function toneOf(state: string) {
  const s = state.toLowerCase()
  if (s === 'fake' || s === 'manipulated') return 'no'
  if (s === 'real' || s === 'clean') return 'yes'
  return 'unknown'
}

function fallbackChecks(result: FakeResult): FakeCheck[] {
  if (result.checks?.length) return result.checks
  const out: FakeCheck[] = []
  for (const r of result.reasons || []) {
    const low = r.toLowerCase()
    const fake = /flag|fake|ai-generated|concern|suspicious|manipul/.test(low)
    out.push({
      id: r.slice(0, 24),
      label: r.length > 42 ? `${r.slice(0, 40)}…` : r,
      state: fake ? 'fake' : 'real',
      detail: r,
    })
  }
  return out
}

type Facts = {
  name: string
  bytes: number
  kind: Modality | null
  width?: number
  height?: number
  duration?: number
}

export default function Fake() {
  const [file, setFile] = useState<File | null>(null)
  const [facts, setFacts] = useState<Facts | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<FakeResult | null>(null)
  const elapsed = useElapsed(busy)
  const modality = useMemo(() => (file ? inferModality(file) : null), [file])

  useEffect(() => {
    if (!file) {
      setFacts(null)
      return
    }
    const kind = inferModality(file)
    const base: Facts = { name: file.name, bytes: file.size, kind }
    if (kind === 'image') {
      const url = URL.createObjectURL(file)
      const img = new Image()
      img.onload = () => {
        setFacts({ ...base, width: img.naturalWidth, height: img.naturalHeight })
        URL.revokeObjectURL(url)
      }
      img.onerror = () => {
        setFacts(base)
        URL.revokeObjectURL(url)
      }
      img.src = url
      return
    }
    if (kind === 'video') {
      const url = URL.createObjectURL(file)
      const el = document.createElement('video')
      el.preload = 'metadata'
      el.onloadedmetadata = () => {
        setFacts({
          ...base,
          duration: Number.isFinite(el.duration) ? el.duration : undefined,
          width: el.videoWidth,
          height: el.videoHeight,
        })
        URL.revokeObjectURL(url)
      }
      el.onerror = () => {
        setFacts(base)
        URL.revokeObjectURL(url)
      }
      el.src = url
      return
    }
    if (kind === 'audio') {
      const url = URL.createObjectURL(file)
      const el = document.createElement('audio')
      el.preload = 'metadata'
      el.onloadedmetadata = () => {
        setFacts({
          ...base,
          duration: Number.isFinite(el.duration) ? el.duration : undefined,
        })
        URL.revokeObjectURL(url)
      }
      el.onerror = () => {
        setFacts(base)
        URL.revokeObjectURL(url)
      }
      el.src = url
      return
    }
    setFacts(base)
  }, [file])

  function takeFile(next: File | null) {
    setFile(next)
    setResult(null)
    if (next && !inferModality(next)) {
      setError('Use an image, an audio clip, or a video.')
    } else {
      setError('')
    }
  }

  async function loadSample() {
    setError('')
    setResult(null)
    try {
      setFile(await fetchAsFile('/samples/look/query.jpg', 'query.jpg'))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load sample')
    }
  }

  async function run() {
    if (!file) return
    const kind = inferModality(file)
    if (!kind) {
      setError('Use an image, an audio clip, or a video.')
      return
    }
    setBusy(true)
    setError('')
    setResult(null)
    try {
      const file_base64 = await fileToB64(file)
      setResult(await callRunpod<FakeResult>(kind, { file_base64, filename: file.name }))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Request failed')
    } finally {
      setBusy(false)
    }
  }

  function copyReport() {
    if (!result) return
    void navigator.clipboard.writeText(JSON.stringify(result, null, 2))
  }

  const v = (result?.verdict || '').toLowerCase()
  const isFake = v === 'fake'
  const isReal = v === 'real'
  const tone = isFake ? 'no' : isReal ? 'yes' : 'unknown'
  const title = isFake ? 'AI-Generated' : isReal ? 'Real' : 'Suspicious'
  const sub = isFake ? 'Synthetic media' : isReal ? 'Genuine capture' : 'No definitive conclusion'
  const confLabel = isFake ? 'AI probability' : isReal ? 'real confidence' : 'confidence'
  const pct = result ? Math.round(result.confidence * 100) : 0
  const preview = modality === 'video' ? 'video' : modality === 'image' ? 'image' : 'none'
  const hint = file
    ? modality
      ? `Detected ${modality}`
      : 'unknown type'
    : 'image, voice clip, or video — routed to the matching engine'
  const checks = result ? fallbackChecks(result) : []
  const frames = result?.frames || []
  const fakeFrames = frames.filter((f) => (f.prediction || '').toLowerCase() === 'fake')
  const overlay = result?.overlay_jpeg_b64 ? `data:image/jpeg;base64,${result.overlay_jpeg_b64}` : ''

  const w = result?.width ?? facts?.width
  const h = result?.height ?? facts?.height
  const dur = result?.duration_seconds ?? facts?.duration

  return (
    <Station meta={meta}>
      <DropZone
        label="Media"
        hint={hint}
        accept="image/*,audio/*,video/*,.mp3,.wav,.m4a,.ogg,.flac,.mp4,.mov,.mkv,.webm"
        file={file}
        onFile={takeFile}
        preview={preview}
      />

      <div className="row">
        <button className="btn" disabled={!file || !modality || busy} onClick={run}>
          Analyze
        </button>
        <button className="btn ghost" disabled={busy} onClick={loadSample}>
          Load sample
        </button>
        {busy ? <span className="waiting">Working · {elapsed}s</span> : null}
      </div>

      {error ? <div className="banner error">{error}</div> : null}

      {result ? (
        <div className="panel report">
          <p className="kicker">
            <span>FILE</span>
            {modality || result.modality}
          </p>
          <div className={`stamp ${tone}`}>{title}</div>
          <div className={`verdict ${tone}`}>{sub}</div>
          {result.provenance?.claim_generator || result.provenance?.software_agent ? (
            <p className="kicker" style={{ marginTop: '0.85rem' }}>
              <span>GENERATOR</span>
              {result.provenance.claim_generator || result.provenance.software_agent}
            </p>
          ) : null}

          <dl className="facts">
            <div>
              <dt>Name</dt>
              <dd>{facts?.name || result.filename || '—'}</dd>
            </div>
            <div>
              <dt>Size</dt>
              <dd>{facts ? bytesLabel(facts.bytes) : '—'}</dd>
            </div>
            <div>
              <dt>Kind</dt>
              <dd>{result.modality}</dd>
            </div>
            {w && h ? (
              <div>
                <dt>Frame</dt>
                <dd>
                  {w} × {h}
                </dd>
              </div>
            ) : null}
            {dur != null ? (
              <div>
                <dt>Length</dt>
                <dd>{dur.toFixed(1)}s</dd>
              </div>
            ) : null}
            {result.sample_rate ? (
              <div>
                <dt>Rate</dt>
                <dd>{result.sample_rate} Hz</dd>
              </div>
            ) : null}
            {result.fps ? (
              <div>
                <dt>Scan</dt>
                <dd>
                  {result.frames_scanned ?? frames.length} @ {Math.round(result.fps)} fps
                </dd>
              </div>
            ) : null}
            <div>
              <dt>Engine</dt>
              <dd>{result.cloud ? 'cloud' : 'local'}</dd>
            </div>
            {result.execution_ms != null ? (
              <div>
                <dt>Worker</dt>
                <dd>{(result.execution_ms / 1000).toFixed(1)}s</dd>
              </div>
            ) : null}
          </dl>

          <div className="meter-wrap" style={{ marginTop: '1.2rem' }}>
            <div className={`meter ${tone}`}>
              <i style={{ width: `${Math.max(2, pct)}%` }} />
            </div>
            <span className="kicker">
              {pct}% {confLabel}
              {result.fake_frame_count != null ? ` · ${result.fake_frame_count} fake frames` : ''}
            </span>
          </div>

          {overlay ? (
            <figure className="heat">
              <img src={overlay} alt="Edited-region heat on the still" />
              <figcaption>Edited-region heat</figcaption>
            </figure>
          ) : null}

          {checks.length ? (
            <div className="check-block">
              <div className="field-label">Checks</div>
              <ul className="check-list">
                {checks.map((c) => (
                  <li key={c.id + c.label} className={toneOf(c.state)}>
                    <span className="mark">{mark(c.state)}</span>
                    <span>
                      {c.label}
                      {c.detail ? <em>{c.detail}</em> : null}
                    </span>
                    <span className="score">
                      {typeof c.score === 'number' ? `${Math.round(c.score * 100)}%` : ''}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {result.votes?.length ? (
            <div className="check-block">
              <div className="field-label">Model votes</div>
              <ul className="check-list">
                {result.votes.map((vt) => (
                  <li key={vt.model} className={toneOf(vt.label || '')}>
                    <span className="mark">{mark(vt.label || '')}</span>
                    <span>{vt.model}</span>
                    <span className="score">
                      {typeof vt.confidence === 'number' ? `${Math.round(vt.confidence * 100)}%` : ''}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {result.provenance &&
          (result.provenance.claim_generator ||
            result.provenance.software_agent ||
            result.provenance.digital_source_type ||
            (result.provenance.jumbf_summary && Object.keys(result.provenance.jumbf_summary).length)) ? (
            <div className="check-block">
              <div className="field-label">C2PA / JUMBF</div>
              <dl className="facts">
                {result.provenance.claim_generator ? (
                  <div>
                    <dt>Claim generator</dt>
                    <dd>{result.provenance.claim_generator}</dd>
                  </div>
                ) : null}
                {result.provenance.software_agent ? (
                  <div>
                    <dt>Software agent</dt>
                    <dd>{result.provenance.software_agent}</dd>
                  </div>
                ) : null}
                {result.provenance.digital_source_type ? (
                  <div>
                    <dt>Digital source</dt>
                    <dd>{String(result.provenance.digital_source_type).split('/').pop()}</dd>
                  </div>
                ) : null}
                {Object.entries(result.provenance.jumbf_summary || {})
                  .filter(([, v]) => v != null && v !== '')
                  .slice(0, 6)
                  .map(([k, v]) => (
                    <div key={k}>
                      <dt>{k.replace('JUMBF:', '')}</dt>
                      <dd>{String(v)}</dd>
                    </div>
                  ))}
              </dl>
            </div>
          ) : null}

          {result.reasons?.length ? (
            <div className="check-block">
              <div className="field-label">Read</div>
              <ul className="hits">
                {result.reasons.map((r) => (
                  <li key={r}>
                    <span className="t">→</span>
                    <span>{r}</span>
                    <span />
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {frames.length ? (
            <div className="check-block">
              <div className="field-label">
                Timeline · {fakeFrames.length}/{frames.length} fake
              </div>
              <div className="ticks" aria-hidden="true">
                {frames.map((f, i) => (
                  <i
                    key={`${f.frame_number}-${i}`}
                    className={(f.prediction || '').toLowerCase() === 'fake' ? 'hot' : ''}
                    style={{ height: `${Math.max(10, Math.round((f.probability || 0) * 100))}%` }}
                    title={`${f.timestamp} · ${(f.probability * 100).toFixed(0)}%`}
                  />
                ))}
              </div>
              <ul className="hits">
                {(fakeFrames.length ? fakeFrames : frames.slice(0, 8)).map((f, i) => (
                  <li key={`row-${f.frame_number}-${i}`}>
                    <span className="t">{f.timestamp}</span>
                    <span>frame {f.frame_number}</span>
                    <span>{(f.probability * 100).toFixed(1)}% AI</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : result.modality === 'video' ? (
            <p className="transcript muted">No frames came back from the scan.</p>
          ) : null}

          <div className="row">
            <button className="btn ghost" type="button" onClick={copyReport}>
              Copy JSON
            </button>
          </div>
        </div>
      ) : null}
    </Station>
  )
}
