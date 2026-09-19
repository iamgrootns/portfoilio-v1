import { NavLink } from 'react-router-dom'
import { profile } from '../data/profile'
import { stations } from '../data/stations'
import { useEngine } from '../lib/engine'

export default function Nav() {
  const { online, checked } = useEngine()

  return (
    <div className="pill-wrap">
      <nav className="pill">
        <NavLink className="pill-logo" to="/" end>
          <span>{profile.initials}</span>
        </NavLink>
        <div className="pill-div" />
        {stations.map((s) => (
          <NavLink key={s.id} className="desk" to={s.path}>
            {s.title}
          </NavLink>
        ))}
        <NavLink to="/about">About</NavLink>
        <NavLink to="/notes">Notes</NavLink>
        <div className="pill-div" />
        <span className={`engine ${checked ? (online ? 'on' : 'off') : ''}`}>
          <i />
          {checked ? (online ? 'Live' : 'Off') : '…'}
        </span>
      </nav>
    </div>
  )
}
