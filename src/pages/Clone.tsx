import { useEffect, useState } from 'react'
import DropZone from '../components/DropZone'
import Station from '../components/Station'
import { stations } from '../data/stations'
import { type CloneResult } from '../lib/api'
import { callRunpod, fileToB64 } from '../lib/runpod'
import { useElapsed } from '../lib/engine'

const meta = stations.find((s) => s.id === 'clone') ?? stations[0]

const LANGS = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Spanish' },
  { code: 'fr', label: 'French' },
  { code: 'zh', label: 'Chinese' },
  { code: 'ja', label: 'Japanese' },
  { code: 'ko', label: 'Korean' },
]

const MAX_CHARS = 300

export default function Clone() {
  const [reference, setReference] = useState<File | null>(null)
  const [text, setText] = useState('')
  const [lang, setLang] = useState('en')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<CloneResult | null>(null)
  const [audioUrl, setAudioUrl] = useState('')
  const elapsed = useElapsed(busy)

  useEffect(() => {
    if (!result?.audio_base64) {
      setAudioUrl('')
      return
    }
    const bytes = Uint8Array.from(atob(result.audio_base64), (c) => c.charCodeAt(0))
    const url = URL.createObjectURL(new Blob([bytes], { type: 'audio/wav' }))
    setAudioUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [result])

  async function run(useSample: boolean) {
    setBusy(true)
    setError('')
    setResult(null)
    try {
      if (useSample) {
        setResult(await callRunpod<CloneResult>('voiceclone', { sample: true }))
      } else {
        if (!reference || !text.trim()) return
        setResult(
          await callRunpod<CloneResult>('voiceclone', {
            text: text.trim(),
            target_lang: lang,
            reference_audio_base64: await fileToB64(reference),
            reference_audio_filename: reference.name,
          }),
        )
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Request failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Station meta={meta}>
      <div className="split">
        <DropZone
          label="Reference voice"
          hint="5–15 seconds of clean speech"
          accept="audio/*"
          file={reference}
          onFile={setReference}
        />
        <div className="field">
          <div className="field-label">Text to speak</div>
          <textarea
            className="textarea"
            rows={5}
            maxLength={MAX_CHARS}
            placeholder="Type what the cloned voice should say."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <div className="row" style={{ marginTop: '0.6rem' }}>
            <select
              className="select"
              style={{ width: 'auto', minWidth: '9rem' }}
              value={lang}
              onChange={(e) => setLang(e.target.value)}
            >
              {LANGS.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.label}
                </option>
              ))}
            </select>
            <span className="kicker">
              {text.length}/{MAX_CHARS}
            </span>
          </div>
        </div>
      </div>
      <div className="row">
        <button
          className="btn"
          disabled={!reference || !text.trim() || busy}
          onClick={() => run(false)}
        >
          Clone voice
        </button>
        <button className="btn ghost" disabled={busy} onClick={() => run(true)}>
          Try the sample
        </button>
        {busy ? <span className="waiting">Working · {elapsed}s</span> : null}
      </div>
      {busy ? (
        <div className="banner">
          First run wakes the worker and loads both models — this one can take a minute.
        </div>
      ) : null}
      {error ? <div className="banner error">{error}</div> : null}
      {result && audioUrl ? (
        <div className="panel">
          <h2>Cloned voice</h2>
          <p className="kicker" style={{ marginBottom: '0.9rem' }}>
            {result.target_lang} · {result.sample_rate} Hz · {result.model}
          </p>
          <audio controls src={audioUrl} style={{ width: '100%' }} />
          <div className="row" style={{ marginTop: '0.8rem' }}>
            <a className="btn ghost" href={audioUrl} download="cloned-voice.wav">
              Download wav
            </a>
          </div>
        </div>
      ) : null}
    </Station>
  )
}
