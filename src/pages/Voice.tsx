import { useState } from 'react'
import DropZone from '../components/DropZone'
import Station from '../components/Station'
import { stations } from '../data/stations'
import { postForm, type VoiceResult } from '../lib/api'
import { useElapsed } from '../lib/engine'

const meta = stations[1]

function toneOf(result: VoiceResult) {
  const level = (result.match_level || (result.is_same_person ? 'strong' : 'none')).toLowerCase()
  if (level === 'strong') return 'yes' as const
  if (level === 'could_be') return 'unknown' as const
  return 'no' as const
}

function headline(result: VoiceResult) {
  const level = (result.match_level || (result.is_same_person ? 'strong' : 'none')).toLowerCase()
  if (level === 'strong') return 'Same person'
  if (level === 'could_be') return 'Could be'
  return 'Different speakers'
}

function mark(ok: boolean | undefined) {
  if (ok === true) return 'HIT'
  if (ok === false) return 'MISS'
  return 'SOFT'
}

export default function Voice() {
  const [a, setA] = useState<File | null>(null)
  const [b, setB] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<VoiceResult | null>(null)
  const elapsed = useElapsed(busy)

  async function run() {
    if (!a || !b) return
    setBusy(true)
    setError('')
    setResult(null)
    try {
      const form = new FormData()
      form.append('file1', a)
      form.append('file2', b)
      setResult(await postForm<VoiceResult>('/voice/compare', form))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Request failed')
    } finally {
      setBusy(false)
    }
  }

  const pct = result ? Math.round(result.similarity * 100) : 0
  const tone = result ? toneOf(result) : 'unknown'

  return (
    <Station meta={meta}>
      <div className="split">
        <DropZone
          label="Clip A"
          hint="any spoken audio"
          accept="audio/*"
          file={a}
          onFile={setA}
        />
        <DropZone
          label="Clip B"
          hint="a second speaker, or the same"
          accept="audio/*"
          file={b}
          onFile={setB}
        />
      </div>
      <div className="row">
        <button className="btn" disabled={!a || !b || busy} onClick={run}>
          Compare
        </button>
        {busy ? <span className="waiting">Working · {elapsed}s</span> : null}
      </div>
      {error ? <div className="banner error">{error}</div> : null}
      {result ? (
        <div className="panel report">
          <div className="big-num">{result.match_percentage.toFixed(1)}%</div>
          <div className={`verdict ${tone}`}>{headline(result)}</div>
          <div className="meter-wrap" style={{ marginTop: '1.1rem' }}>
            <div className={`meter ${tone}`}>
              <i style={{ width: `${Math.max(2, pct)}%` }} />
            </div>
            <span className="kicker">
              ensemble average · strong ≥ {Math.round(result.threshold * 100)}%
              {result.both_agree === false ? ' · models disagree' : ''}
            </span>
          </div>
          <ul className="check-list" style={{ marginTop: '1.2rem' }}>
            <li className={result.resemblyzer?.above_floor ? 'yes' : 'no'}>
              <span className="mark">{mark(result.resemblyzer?.above_floor)}</span>
              <span>
                Resemblyzer
                <em>256-D · floor {result.resemblyzer ? Math.round(result.resemblyzer.floor * 100) : 55}%</em>
              </span>
              <span className="score">
                {result.resemblyzer ? `${(result.resemblyzer.similarity * 100).toFixed(1)}%` : '—'}
              </span>
            </li>
            <li className={(result.ecapa ?? result.nemo)?.above_floor ? 'yes' : 'no'}>
              <span className="mark">{mark((result.ecapa ?? result.nemo)?.above_floor)}</span>
              <span>
                ECAPA-TDNN
                <em>
                  floor {Math.round(((result.ecapa ?? result.nemo)?.floor ?? 0.6) * 100)}%
                </em>
              </span>
              <span className="score">
                {(result.ecapa ?? result.nemo)
                  ? `${(((result.ecapa ?? result.nemo)?.similarity ?? 0) * 100).toFixed(1)}%`
                  : '—'}
              </span>
            </li>
          </ul>
        </div>
      ) : null}
    </Station>
  )
}
