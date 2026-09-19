import { AnimatePresence } from 'framer-motion'
import { useCallback, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import Loader from './components/Loader'
import Cover from './pages/Cover'
import Face from './pages/Face'
import Fake from './pages/Fake'
import Lab from './pages/Lab'
import Listen from './pages/Listen'
import About from './pages/About'
import Notes from './pages/Notes'
import Read from './pages/Read'
import Voice from './pages/Voice'

export default function App() {
  const [loading, setLoading] = useState(() => {
    try {
      return sessionStorage.getItem('pkp-booted') !== '1'
    } catch {
      return true
    }
  })
  const done = useCallback(() => {
    try {
      sessionStorage.setItem('pkp-booted', '1')
    } catch {
      /* private mode */
    }
    setLoading(false)
  }, [])

  return (
    <>
      <AnimatePresence>{loading ? <Loader key="boot" onDone={done} /> : null}</AnimatePresence>
      <Routes>
        <Route path="/" element={<Cover />} />
        <Route path="/lab" element={<Lab />}>
          <Route index element={<Navigate to="listen" replace />} />
          <Route path="listen" element={<Listen />} />
          <Route path="fake" element={<Fake />} />
          <Route path="voice" element={<Voice />} />
          <Route path="face" element={<Face />} />
          <Route path="read" element={<Read />} />
        </Route>
        <Route path="/about" element={<Lab />}>
          <Route index element={<About />} />
        </Route>
        <Route path="/notes" element={<Lab />}>
          <Route index element={<Notes />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}
