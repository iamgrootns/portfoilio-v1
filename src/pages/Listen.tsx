import { useState } from 'react'
import DropZone from '../components/DropZone'
import Station from '../components/Station'
import { stations } from '../data/stations'
import { type SpeechResult } from '../lib/api'
import { callRunpod, fileToB64 } from '../lib/runpod'
import { useElapsed } from '../lib/engine'

const meta = stations[0]

export default function Listen() {
  const [file, setFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<SpeechResult | null>(null)
  const elapsed = useElapsed(busy)

  async function detect() {
    if (!file) return
    setBusy(true)
    setError('')
    setResult(null)
    try {
      const file_base64 = await fileToB64(file)
      setResult(await callRunpod<SpeechResult>('lang', { file_base64, filename: file.name }))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Request failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Station meta={meta}>
      <DropZone
        label="Audio"
        hint="wav, mp3, m4a, ogg — a few seconds is enough"
        accept="audio/*,.mp3,.wav,.m4a,.ogg,.flac"
        file={file}
        onFile={setFile}
      />

      <div className="row">
        <button className="btn" disabled={!file || busy} onClick={detect}>
          Detect language
        </button>
        {busy ? <span className="waiting">Listening · {elapsed}s</span> : null}
      </div>

      {error ? <div className="banner error">{error}</div> : null}

      {result ? (
        <div className="panel">
          <div className="big-num">{result.language}</div>
          <div className="row" style={{ marginTop: '0.6rem' }}>
            <span className="chip">{result.language_code}</span>
            <span className="chip">cloud</span>
            {result.execution_ms != null ? (
              <span className="chip">{(result.execution_ms / 1000).toFixed(1)}s worker</span>
            ) : null}
          </div>
        </div>
      ) : null}
    </Station>
  )
}
