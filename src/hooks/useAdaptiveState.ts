import { useState, useEffect, useRef, useCallback } from 'react'

export type FocusState = 'focus' | 'shallow' | 'distracted' | 'burnout'

export type AdaptiveSignals = {
  idleSeconds: number
  keystrokesPerMin: number
  tabSwitches: number
  sessionMinutes: number
}

// Tuned for demo-friendliness: type for ~10s to enter focus, idle 30s to go distracted
const T = {
  FOCUS_MIN_KPM: 10,
  FOCUS_MAX_IDLE_S: 18,
  DISTRACTED_MIN_IDLE_S: 30,
  BURNOUT_MIN_SESSION_M: 25,
}

function classify(s: AdaptiveSignals): FocusState {
  if (s.sessionMinutes >= T.BURNOUT_MIN_SESSION_M) return 'burnout'
  if (s.idleSeconds >= T.DISTRACTED_MIN_IDLE_S) return 'distracted'
  if (s.keystrokesPerMin >= T.FOCUS_MIN_KPM && s.idleSeconds <= T.FOCUS_MAX_IDLE_S) return 'focus'
  return 'shallow'
}

export function useAdaptiveState() {
  const [signals, setSignals] = useState<AdaptiveSignals>({
    idleSeconds: 0,
    keystrokesPerMin: 0,
    tabSwitches: 0,
    sessionMinutes: 0,
  })
  const [focusState, setFocusState] = useState<FocusState>('shallow')

  const lastActivityMs = useRef(0)
  const keyTimestamps = useRef<number[]>([])
  const sessionStartMs = useRef(0)
  const tabSwitchCount = useRef(0)
  const initialized = useRef(false)

  const onActivity = useCallback(() => {
    lastActivityMs.current = Date.now()
  }, [])

  const onKeyDown = useCallback(() => {
    const now = Date.now()
    lastActivityMs.current = now
    keyTimestamps.current.push(now)
  }, [])

  const onVisibility = useCallback(() => {
    if (document.hidden) tabSwitchCount.current += 1
  }, [])

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true
      lastActivityMs.current = Date.now()
      sessionStartMs.current = Date.now()
    }

    window.addEventListener('mousemove', onActivity, { passive: true })
    window.addEventListener('mousedown', onActivity, { passive: true })
    window.addEventListener('keydown', onKeyDown, { passive: true })
    document.addEventListener('visibilitychange', onVisibility)

    const tick = setInterval(() => {
      const now = Date.now()
      const cutoff = now - 60_000
      keyTimestamps.current = keyTimestamps.current.filter((t) => t > cutoff)

      const next: AdaptiveSignals = {
        idleSeconds: Math.round((now - lastActivityMs.current) / 1000),
        keystrokesPerMin: keyTimestamps.current.length,
        tabSwitches: tabSwitchCount.current,
        sessionMinutes: Math.floor((now - sessionStartMs.current) / 60_000),
      }

      setSignals(next)
      setFocusState(classify(next))
    }, 1000)

    return () => {
      window.removeEventListener('mousemove', onActivity)
      window.removeEventListener('mousedown', onActivity)
      window.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('visibilitychange', onVisibility)
      clearInterval(tick)
    }
  }, [onActivity, onKeyDown, onVisibility])

  return { focusState, signals }
}
