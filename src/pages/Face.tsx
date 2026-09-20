import { useState } from 'react'
import DropZone from '../components/DropZone'
import Station from '../components/Station'
import { stations } from '../data/stations'
import { fetchAsFile, type FaceResult } from '../lib/api'
import { useElapsed } from '../lib/engine'
import { callRunpod, fileToB64 } from '../lib/runpod'

const meta = stations[2]

export default function Face() {
  const [photo, setPhoto] = useState<File | null>(null)
  const [video, setVideo] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<FaceResult | null>(null)
  const elapsed = useElapsed(busy)

  async function loadSample() {
    setError('')
    try {
      const [still, clip] = await Promise.all([
        fetchAsFile('/samples/face/still.jpg', 'still.jpg'),
        fetchAsFile('/samples/face/clip.mp4', 'clip.mp4'),
      ])
      setPhoto(still)
      setVideo(clip)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load sample')
    }
  }

  async function run() {
    if (!photo || !video) return
    setBusy(true)
    setError('')
    setResult(null)
    try {
      const [photo_base64, video_base64] = await Promise.all([
        fileToB64(photo),
        fileToB64(video),
      ])
      setResult(
        await callRunpod<FaceResult>('face', {
          photo_base64,
          video_base64,
          photo_filename: photo.name,
          video_filename: video.name,
        }),
      )
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
          label="Still"
          hint="a clear face"
          accept="image/*"
          file={photo}
          onFile={setPhoto}
          preview="image"
        />
        <DropZone
          label="Video"
          hint="first 30 seconds are scanned"
          accept="video/*"
          file={video}
          onFile={setVideo}
          preview="video"
        />
      </div>
      <div className="row">
        <button className="btn" disabled={!photo || !video || busy} onClick={run}>
          Find face
        </button>
        <button className="btn ghost" disabled={busy} onClick={loadSample}>
          Load sample
        </button>
        {busy ? <span className="waiting">Working · {elapsed}s</span> : null}
      </div>
      {error ? <div className="banner error">{error}</div> : null}
      {result ? (
        <div className="panel">
          <h2>
            {result.found
              ? `${result.total_matches} hit${result.total_matches === 1 ? '' : 's'}`
              : 'No match in this clip'}
          </h2>
          <p className="kicker" style={{ marginBottom: '0.9rem' }}>
            {result.frames_scanned ?? 0} frames · threshold {result.threshold}
          </p>
          {result.matches?.length ? (
            <ul className="hits">
              {result.matches.map((h, i) => (
                <li key={`${h.frame_number}-${i}`}>
                  <span className="t">{h.timestamp}</span>
                  <span>frame {h.frame_number}</span>
                  <span>{(h.similarity * 100).toFixed(1)}%</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </Station>
  )
}
