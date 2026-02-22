import { useState, useEffect, useRef, useCallback } from 'react'

export type FocusState = 'focus' | 'shallow' | 'distracted' | 'burnout'

export type AdaptiveSignals = {
  idleSeconds: number
  keystrokesPerMin: number
  tabSwitches: number
  sessionMinutes: number
}

// Focus: typing actively and not idle long (allows reading AI responses before dropping out)
// Shallow: active but not in a typing flow
// Distracted: genuinely idle — no mouse or keyboard for 90s
const T = {
  FOCUS_MIN_KPM: 10,
  FOCUS_MAX_IDLE_S: 40,
  DISTRACTED_MIN_IDLE_S: 90,
  BURNOUT_MIN_SESSION_M: 25,
}

function classify(s: AdaptiveSignals): FocusState {
  if (s.sessionMinutes >= T.BURNOUT_MIN_SESSION_M) return 'burnout'
  if (s.idleSeconds >= T.DISTRACTED_MIN_IDLE_S) return 'distracted'
  if (s.keystrokesPerMin >= T.FOCUS_MIN_KPM && s.idleSeconds <= T.FOCUS_MAX_IDLE_S) return 'focus'
  return 'shallow'
}

const MANUAL_EXIT_DURATION_MS = 30 * 1000 // override lasts 30s — enough to prevent instant re-entry

export function useAdaptiveState() {
  const [signals, setSignals] = useState<AdaptiveSignals>({
    idleSeconds: 0,
    keystrokesPerMin: 0,
    tabSwitches: 0,
    sessionMinutes: 0,
  })
  const [focusState, setFocusState] = useState<FocusState>('shallow')
  const manualExitMs = useRef(0)

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
      const natural = classify(next)
      const manuallyExited =
        manualExitMs.current > 0 &&
        Date.now() - manualExitMs.current < MANUAL_EXIT_DURATION_MS
      setFocusState(natural === 'focus' && manuallyExited ? 'shallow' : natural)
    }, 1000)

    return () => {
      window.removeEventListener('mousemove', onActivity)
      window.removeEventListener('mousedown', onActivity)
      window.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('visibilitychange', onVisibility)
      clearInterval(tick)
    }
  }, [onActivity, onKeyDown, onVisibility])

  const exitFocus = useCallback(() => {
    manualExitMs.current = Date.now()
    setFocusState('shallow')
  }, [])

  return { focusState, signals, exitFocus }
}
