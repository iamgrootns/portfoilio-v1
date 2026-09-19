import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Nav from '../components/Nav'
import StationFilm from '../components/StationFilm'
import { profile } from '../data/profile'
import { stations } from '../data/stations'

export default function Cover() {
  const [role, setRole] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setRole((r) => (r + 1) % profile.roles.length), 2000)
    return () => clearInterval(id)
  }, [])

  return (
    <>
      <Nav />
      <section className="hero">
        <video className="hero-video" autoPlay muted loop playsInline>
          <source src="/media/hero.mp4" type="video/mp4" />
        </video>
        <div className="hero-dim" />
        <div className="hero-fade" />
        <div className="hero-inner">
          <p className="hero-eye">{profile.volume}</p>
          <h1 className="hero-name">{profile.name}</h1>
          <p className="hero-role">
            <em>{profile.roles[role]}</em>
          </p>
          <p className="hero-bio">{profile.line}</p>
          <div className="hero-actions">
            <Link className="btn" to="/lab/listen">
              Open the lab
            </Link>
            <Link className="btn ghost" to="/notes">
              How it is built
            </Link>
          </div>
        </div>
        <div className="scroll-cue">
          Scroll
          <div className="scroll-line">
            <i />
          </div>
        </div>
      </section>

      <StationFilm />

      <section className="work" id="work">
        {stations.map((s) => (
          <Link className="work-row" key={s.id} to={s.path}>
            <span className="work-num">{s.num}</span>
            <div>
              <div className="work-title">{s.title}</div>
              <div className="work-meta">
                {s.kicker} · {s.model}
              </div>
            </div>
            <div className="work-vid">
              <video autoPlay muted loop playsInline>
                <source src={s.media} type="video/mp4" />
              </video>
            </div>
          </Link>
        ))}
      </section>
    </>
  )
}
