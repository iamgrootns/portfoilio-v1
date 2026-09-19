import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { stations } from '../data/stations'

const FILM = '/media/lab-film.mp4'
const SCENE_ANCHORS = [0.1, 0.3, 0.5, 0.7, 0.9]
const TRACK_VH = 560
const SCROLLABLE_VH = 460
const LERP = 0.28
const SEEK_EPSILON = 0.008

// Order matches lab-film.mp4: 5s waves, 5s guy, 5s debris, 5s helmet, 5s moon.
const CHAPTERS = [
  { ...stations[0], num: '01', headline: 'The machine hears.' },
  { ...stations[1], num: '02', headline: 'Same voice, or not.' },
  { ...stations[2], num: '03', headline: 'Find them in the frames.' },
  { ...stations[3], num: '04', headline: 'Read what the page hid.' },
  { ...stations[4], num: '05', headline: 'Real or generated.' },
]

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))

export default function StationFilm() {
  const trackRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const cardRefs = useRef<Array<HTMLDivElement | null>>([])
  const barRef = useRef<HTMLDivElement>(null)
  const currentRef = useRef(0)
  const targetRef = useRef(0)
  const rafRef = useRef(0)
  const activeRef = useRef(0)
  const [active, setActive] = useState(0)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const disposed = { value: false }
    let blobUrl = ''

    const read = () => {
      const track = trackRef.current
      if (!track) return
      const vh = window.innerHeight
      const rect = track.getBoundingClientRect()
      const scrollable = Math.max(rect.height - vh, 1)
      const progress = clamp01(-rect.top / scrollable)
      targetRef.current = progress
      if (barRef.current) barRef.current.style.transform = `scaleX(${progress.toFixed(4)})`

      const centre = vh / 2
      let best = 0
      let bestDist = Infinity
      cardRefs.current.forEach((card, i) => {
        if (!card) return
        const r = card.getBoundingClientRect()
        const dist = (r.top + r.height / 2 - centre) / vh
        const abs = Math.abs(dist)
        if (abs < bestDist) {
          bestDist = abs
          best = i
        }
        if (!reduceMotion) {
          card.style.opacity = String(clamp01(1 - abs * 2.4))
          card.style.transform = `translateY(${(dist * -28).toFixed(1)}px)`
        }
      })
      if (best !== activeRef.current) {
        activeRef.current = best
        setActive(best)
      }
    }

    const tick = () => {
      read()
      const video = videoRef.current
      if (video && Number.isFinite(video.duration) && video.duration > 0) {
        currentRef.current += (targetRef.current - currentRef.current) * LERP
        const time = Math.min(0.999, Math.max(0, currentRef.current)) * video.duration
        if (Math.abs(video.currentTime - time) > SEEK_EPSILON && !video.seeking) {
          try {
            video.currentTime = time
          } catch {
            /* not seekable yet */
          }
        }
      }
      rafRef.current = requestAnimationFrame(tick)
    }

    read()
    if (!reduceMotion) rafRef.current = requestAnimationFrame(tick)

    const onScroll = () => {
      if (reduceMotion) read()
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)

    const io = new IntersectionObserver(
      ([entry]) => {
        if (reduceMotion || disposed.value) return
        if (entry.isIntersecting && !rafRef.current) {
          rafRef.current = requestAnimationFrame(tick)
        } else if (!entry.isIntersecting && rafRef.current) {
          cancelAnimationFrame(rafRef.current)
          rafRef.current = 0
        }
      },
      { rootMargin: '10% 0px' },
    )
    if (trackRef.current) io.observe(trackRef.current)

    const paintFirstFrame = () => {
      const video = videoRef.current
      if (!video || !Number.isFinite(video.duration) || video.duration <= 0) return
      const time = Math.min(0.999, Math.max(0, targetRef.current)) * video.duration
      try {
        // Nudge off 0 so the browser paints the first clip, not a leftover poster.
        video.currentTime = time < 0.04 ? 0.04 : time
      } catch {
        /* not seekable yet */
      }
      setReady(true)
    }

    const videoEl = videoRef.current
    videoEl?.addEventListener('loadeddata', paintFirstFrame)

    if (reduceMotion) {
      if (videoEl) videoEl.src = FILM
    } else {
      fetch(FILM)
        .then((res) => (res.ok ? res.blob() : Promise.reject(new Error(String(res.status)))))
        .then((blob) => {
          if (disposed.value) return
          blobUrl = URL.createObjectURL(blob)
          const video = videoRef.current
          if (video) {
            video.src = blobUrl
            video.load()
          }
        })
        .catch(() => {
          if (disposed.value) return
          if (videoRef.current) videoRef.current.src = FILM
        })
    }

    return () => {
      disposed.value = true
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      io.disconnect()
      videoEl?.removeEventListener('loadeddata', paintFirstFrame)
      if (blobUrl) URL.revokeObjectURL(blobUrl)
    }
  }, [])

  const jumpTo = (index: number) => {
    const track = trackRef.current
    if (!track) return
    const rect = track.getBoundingClientRect()
    const scrollable = rect.height - window.innerHeight
    window.scrollTo({
      top: window.scrollY + rect.top + SCENE_ANCHORS[index] * scrollable,
      behavior: 'smooth',
    })
  }

  return (
    <div
      ref={trackRef}
      id="film"
      className="film-track"
      style={{ height: `${TRACK_VH}vh` }}
      aria-label="Five stations, one film"
    >
      <div className="film-pin">
        <video
          ref={videoRef}
          className={`film-video${ready ? ' is-on' : ''}`}
          muted
          playsInline
          preload="auto"
          tabIndex={-1}
          aria-hidden="true"
        />
        <div className="film-dim" />
        <div className="film-fade-top" />
        <div className="film-fade-left" />
        <div className="film-fade-bot" />

        <nav className="film-rail" aria-label="Stations in the film">
          {CHAPTERS.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => jumpTo(i)}
              aria-label={`Go to ${s.title}`}
              aria-current={active === i ? 'step' : undefined}
            >
              <span className={active === i ? 'on' : ''}>{s.title}</span>
              <i className={active === i ? 'on' : ''} />
            </button>
          ))}
        </nav>

        <div className="film-progress">
          <span>{ready ? 'Scroll the film' : 'Loading film…'}</span>
          <div className="film-bar">
            <i ref={barRef} />
          </div>
          <em>
            {String(active + 1).padStart(2, '0')} / {String(CHAPTERS.length).padStart(2, '0')}
          </em>
        </div>
      </div>

      <div className="film-copy" aria-live="off">
        {CHAPTERS.map((s, i) => (
          <div
            key={s.id}
            ref={(node) => {
              cardRefs.current[i] = node
            }}
            className="film-card"
            style={{
              top: `${SCENE_ANCHORS[i] * SCROLLABLE_VH}vh`,
            }}
          >
            <p className="kicker">
              <span>{s.num}</span>
              {s.kicker}
            </p>
            <h2>{s.headline}</h2>
            <p>{s.deck}</p>
            <Link className="btn ghost film-check" to={s.path} tabIndex={active === i ? 0 : -1}>
              Check out {s.title}
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}
