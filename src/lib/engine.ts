import { useEffect, useState } from 'react'
import { getJson, type Health } from './api'

export function useEngine() {
  const [health, setHealth] = useState<Health | null>(null)
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    let alive = true
    const ping = async () => {
      try {
        const h = await getJson<Health>('/health')
        if (alive) setHealth(h)
      } catch {
        if (alive) setHealth(null)
      } finally {
        if (alive) setChecked(true)
      }
    }
    ping()
    const id = setInterval(ping, 12000)
    return () => {
      alive = false
      clearInterval(id)
    }
  }, [])

  return { online: Boolean(health?.ok), health, checked }
}

export function useElapsed(active: boolean) {
  const [seconds, setSeconds] = useState(0)
  useEffect(() => {
    if (!active) {
      setSeconds(0)
      return
    }
    const t0 = Date.now()
    const id = setInterval(() => setSeconds(Math.floor((Date.now() - t0) / 1000)), 250)
    return () => clearInterval(id)
  }, [active])
  return seconds
}
