import { useAdaptive } from '../context/AdaptiveContext'

export default function StateBanner() {
  const { focusState, signals } = useAdaptive()

  if (focusState === 'distracted') {
    return (
      <div className="state-banner banner-distracted">
        <span className="banner-emoji">⚠️</span>
        <span className="banner-message">
          You've been idle for <strong>{signals.idleSeconds}s</strong> — your top priority task is waiting.
        </span>
        <button className="banner-action">Start top task</button>
      </div>
    )
  }

  if (focusState === 'burnout') {
    return (
      <div className="state-banner banner-burnout">
        <span className="banner-emoji">☕</span>
        <span className="banner-message">
          You've been working for <strong>{signals.sessionMinutes} minutes</strong> — a short break will sharpen your focus.
        </span>
        <button className="banner-action">Take a 5-min break</button>
      </div>
    )
  }

  if (focusState === 'focus') {
    return (
      <div className="state-banner banner-focus">
        <span className="banner-emoji">🎯</span>
        <span className="banner-message">
          Deep focus detected — <strong>interface simplified</strong>. Sidebar collapsed, distractions minimized.
        </span>
      </div>
    )
  }

  return null
}
