import { useState, useEffect, useRef, useCallback } from 'react'
import { useAdaptive } from '../context/AdaptiveContext'

// Keyboard Lock API — Chrome/Edge only, not in standard TS types yet
interface KeyboardLock { lock(keys: string[]): Promise<void>; unlock(): void }
declare global { interface Navigator { keyboard?: KeyboardLock } }

type Props = { onLockIn: () => void }

export default function FocusGuard({ onLockIn }: Props) {
  const { focusState, exitFocus } = useAdaptive()
  const [showWelcome, setShowWelcome] = useState(false)
  const [showExitPrompt, setShowExitPrompt] = useState(false)
  const [awaySeconds, setAwaySeconds] = useState(0)
  const leftAt = useRef<number | null>(null)
  const titleInterval = useRef<ReturnType<typeof setInterval> | null>(null)
  const originalTitle = useRef(document.title)
  const prevFocusState = useRef(focusState)
  // Tracks fullscreen changes we initiated so we don't prompt for them
  const programmaticFs = useRef(false)

  const enterFullscreen = useCallback(async () => {
    if (!document.fullscreenElement) {
      programmaticFs.current = true
      await document.documentElement.requestFullscreen().catch(() => {})
      // Lock ESC key so it doesn't exit fullscreen (Chrome/Edge only)
      await navigator.keyboard?.lock(['Escape']).catch(() => {})
    }
  }, [])

  const exitFullscreen = useCallback(async () => {
    navigator.keyboard?.unlock()
    if (document.fullscreenElement) {
      programmaticFs.current = true
      await document.exitFullscreen().catch(() => {})
    }
  }, [])

  // ── Tab-away detection ──────────────────────────────────────
  const startTitleFlash = useCallback(() => {
    let tick = 0
    titleInterval.current = setInterval(() => {
      document.title = tick % 2 === 0 ? '⚠️ Come back — FlowDesk' : '🔔 Your tasks are waiting!'
      tick++
    }, 1000)
  }, [])

  const stopTitleFlash = useCallback(() => {
    if (titleInterval.current) { clearInterval(titleInterval.current); titleInterval.current = null }
    document.title = originalTitle.current
  }, [])

  useEffect(() => {
    const handle = () => {
      if (document.hidden) {
        leftAt.current = Date.now()
        startTitleFlash()
      } else {
        stopTitleFlash()
        if (leftAt.current) {
          const gone = Math.round((Date.now() - leftAt.current) / 1000)
          if (gone >= 3) { setAwaySeconds(gone); setShowWelcome(true) }
          leftAt.current = null
        }
      }
    }
    document.addEventListener('visibilitychange', handle)
    return () => { document.removeEventListener('visibilitychange', handle); stopTitleFlash() }
  }, [startTitleFlash, stopTitleFlash])

  // ── Auto fullscreen when entering / leaving focus ───────────
  useEffect(() => {
    const prev = prevFocusState.current
    prevFocusState.current = focusState

    if (focusState === 'focus' && prev !== 'focus') {
      enterFullscreen()
    }
    if (focusState !== 'focus' && prev === 'focus') {
      // Leaving focus naturally (not via End Focus button) — just exit fullscreen quietly
      exitFullscreen()
    }
  }, [focusState, enterFullscreen, exitFullscreen])

  // ── Intercept ESC key directly (Keyboard Lock fallback + prompt) ──
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && focusState === 'focus') {
        e.preventDefault()
        e.stopImmediatePropagation()
        setShowExitPrompt(true)
      }
    }
    // capture: true so we get it before browser fullscreen handler
    window.addEventListener('keydown', handleKeyDown, { capture: true })
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true })
  }, [focusState])

  // ── Fullscreen change (safety net if ESC still slips through) ──
  useEffect(() => {
    const handleFsChange = () => {
      if (programmaticFs.current) {
        programmaticFs.current = false
        return
      }
      // Fullscreen exited unexpectedly while in focus — re-lock and prompt
      if (!document.fullscreenElement && focusState === 'focus') {
        enterFullscreen()
        setShowExitPrompt(true)
      }
    }
    document.addEventListener('fullscreenchange', handleFsChange)
    return () => document.removeEventListener('fullscreenchange', handleFsChange)
  }, [focusState, enterFullscreen])

  // ── Listen for "End Focus" button click from TopBar ─────────
  useEffect(() => {
    const handleEndFocusRequest = () => {
      if (focusState === 'focus') setShowExitPrompt(true)
    }
    window.addEventListener('flowdesk:requestExitFocus', handleEndFocusRequest)
    return () => window.removeEventListener('flowdesk:requestExitFocus', handleEndFocusRequest)
  }, [focusState])

  // ── Handlers ────────────────────────────────────────────────
  const dismissWelcome = () => { setShowWelcome(false); setAwaySeconds(0); onLockIn() }

  const stayFocused = async () => {
    setShowExitPrompt(false)
    // Re-lock ESC in case it was released
    await navigator.keyboard?.lock(['Escape']).catch(() => {})
  }

  const leaveFocus = async () => {
    setShowExitPrompt(false)
    await exitFullscreen()
    exitFocus()
  }

  const mins = Math.floor(awaySeconds / 60)
  const secs = awaySeconds % 60
  const timeStr = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`

  return (
    <>
      {showWelcome && (
        <div className="focus-guard-overlay">
          <div className="focus-guard-card">
            <div className="focus-guard-icon">👋</div>
            <h2 className="focus-guard-title">Welcome back</h2>
            <p className="focus-guard-away">You were away for <strong>{timeStr}</strong></p>
            <p className="focus-guard-message">Your tasks are still here. Ready to pick up where you left off?</p>
            <button className="focus-guard-btn" onClick={dismissWelcome}>Lock Back In</button>
          </div>
        </div>
      )}

      {showExitPrompt && (
        <div className="focus-guard-overlay">
          <div className="focus-guard-card">
            <div className="focus-guard-icon">🔒</div>
            <h2 className="focus-guard-title">Leave Deep Focus?</h2>
            <p className="focus-guard-message">
              Leaving means distractions are one click away. Are you sure you want to exit?
            </p>
            <div className="focus-guard-actions">
              <button className="focus-guard-btn" onClick={stayFocused}>Stay focused</button>
              <button className="focus-guard-btn-secondary" onClick={leaveFocus}>Yes, exit focus</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
