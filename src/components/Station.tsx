import type { ReactNode } from 'react'
import type { Station as StationMeta } from '../data/stations'
import { useEngine } from '../lib/engine'

export default function Station({
  meta,
  children,
}: {
  meta: StationMeta
  children: ReactNode
}) {
  const { online, checked } = useEngine()

  return (
    <article>
      {meta.media ? (
        <div className="station-hero" aria-hidden="true">
          <video autoPlay muted loop playsInline src={meta.media} />
          <div className="station-hero-dim" />
          <div className="station-hero-fade" />
        </div>
      ) : null}
      <header className="station-head">
        <p className="kicker">
          <span>{meta.num}</span>
          {meta.kicker}
        </p>
        <h1>{meta.title}</h1>
        <p className="station-deck">{meta.deck}</p>
        <p className="station-model">{meta.model}</p>
      </header>
      {checked && !online ? (
        <div className="banner">
          Engine is off. Start the API on port 8000 — the page will pick it up.
        </div>
      ) : null}
      {children}
    </article>
  )
}
