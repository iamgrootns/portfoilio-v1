import { useState } from 'react'
import DropZone from '../components/DropZone'
import Station from '../components/Station'
import { stations } from '../data/stations'
import {
  fetchAsFile,
  pageNumberOf,
  pageTextOf,
  postForm,
  type EntityBag,
  type OcrPage,
  type ReadResult,
} from '../lib/api'
import { useElapsed } from '../lib/engine'

const meta = stations[4]

const ENTITY_ORDER: Array<[keyof EntityBag, string]> = [
  ['PAN', 'PAN'],
  ['Aadhaar', 'Aadhaar'],
  ['phoneNumbers', 'Phone'],
  ['Email', 'Email'],
  ['IFSC', 'IFSC'],
  ['VoterID', 'Voter ID'],
  ['DrivingLicense', 'DL'],
  ['URL', 'URL'],
  ['Dates_EN', 'Dates'],
  ['Dates_HI', 'Dates (HI)'],
]

export default function Read() {
  const [file, setFile] = useState<File | null>(null)
  const [language, setLanguage] = useState('mixenglish+hindi')
  const [busy, setBusy] = useState<'ocr' | 'entities' | null>(null)
  const [error, setError] = useState('')
  const [result, setResult] = useState<ReadResult | null>(null)
  const elapsed = useElapsed(Boolean(busy))

  async function loadSample() {
    setError('')
    try {
      setFile(await fetchAsFile('/samples/read/page.jpg', 'page.jpg'))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load sample')
    }
  }

  async function run(kind: 'ocr' | 'entities') {
    if (!file) return
    setBusy(kind)
    setError('')
    setResult(null)
    try {
      const form = new FormData()
      if (kind === 'ocr') {
        form.append('files', file)
        form.append('prefered_language', language)
        setResult(await postForm<ReadResult>('/ocr/upload_and_process/', form))
      } else {
        form.append('files', file)
        form.append('prefered_language', language.startsWith('mix') ? 'hi' : language)
        setResult(await postForm<ReadResult>('/pdf/highlight_entities', form))
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Request failed')
    } finally {
      setBusy(null)
    }
  }

  const first = result?.results?.[0]
  const pages: OcrPage[] = (first?.Ocr || first?.ocr || []) as OcrPage[]
  const entities = first?.nameNumberLocation

  return (
    <Station meta={meta}>
      <div className="split">
        <DropZone
          label="Page"
          hint="pdf, jpg, png"
          accept="image/*,.pdf"
          file={file}
          onFile={setFile}
          preview="image"
        />
        <div>
          <div className="field-label">OCR language</div>
          <select className="select" value={language} onChange={(e) => setLanguage(e.target.value)}>
            <option value="mixenglish+hindi">English + Hindi</option>
            <option value="english">English</option>
            <option value="hindi">Hindi</option>
            <option value="punjabieng">Punjabi + English</option>
            <option value="gujuratieng">Gujarati + English</option>
          </select>
        </div>
      </div>
      <div className="row">
        <button className="btn" disabled={!file || Boolean(busy)} onClick={() => run('ocr')}>
          Extract text
        </button>
        <button className="btn ghost" disabled={!file || Boolean(busy)} onClick={() => run('entities')}>
          Text + entities
        </button>
        <button className="btn ghost" disabled={Boolean(busy)} onClick={loadSample}>
          Load sample
        </button>
        {busy ? <span className="waiting">Working · {elapsed}s</span> : null}
      </div>
      {error ? <div className="banner error">{error}</div> : null}

      {result ? (
        <div className="panel">
          <h2>{first?.Filename || first?.filename || 'Document'}</h2>
          {entities ? (
            <dl className="entities" style={{ marginBottom: '1.4rem' }}>
              {ENTITY_ORDER.map(([key, label]) => {
                const values = entities[key]
                if (!values?.length) return null
                return (
                  <span key={key} style={{ display: 'contents' }}>
                    <dt>{label}</dt>
                    <dd>
                      {values.map((v) => (
                        <span className="chip" key={v}>
                          {v}
                        </span>
                      ))}
                    </dd>
                  </span>
                )
              })}
            </dl>
          ) : null}
          {pages.map((p, i) => {
            const n = pageNumberOf(p, i + 1)
            const text = pageTextOf(p)
            return (
              <div key={n} style={{ marginBottom: '1rem' }}>
                <div className="field-label">Page {n}</div>
                <p className="transcript">{text || '—'}</p>
              </div>
            )
          })}
        </div>
      ) : null}
    </Station>
  )
}
