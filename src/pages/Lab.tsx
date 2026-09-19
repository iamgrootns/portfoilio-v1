import { Outlet } from 'react-router-dom'
import Nav from '../components/Nav'

export default function Lab() {
  return (
    <div className="shell">
      <Nav />
      <main className="stage">
        <Outlet />
      </main>
    </div>
  )
}
