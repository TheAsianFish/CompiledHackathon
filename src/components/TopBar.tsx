import { useAdaptive } from '../context/AdaptiveContext'
import type { FocusState } from '../context/AdaptiveContext'

const STATE_BADGE: Record<FocusState, { label: string; className: string }> = {
  focus:      { label: '🎯 Deep Focus',   className: 'badge-focus' },
  shallow:    { label: '💭 Shallow Work', className: 'badge-shallow' },
  distracted: { label: '⚠️ Distracted',   className: 'badge-distracted' },
  burnout:    { label: '😴 Rest Mode',    className: 'badge-burnout' },
}

export default function TopBar() {
  const { focusState, signals } = useAdaptive()
  const badge = STATE_BADGE[focusState]

  return (
    <header className="topbar">
      <div className="topbar-search">
        <span className="topbar-search-icon">
          <SearchIcon />
        </span>
        <input type="text" placeholder="Search tasks…" />
      </div>

      <div className="topbar-spacer" />

      <div className="topbar-actions">
        <div className={`state-badge ${badge.className}`}>
          {badge.label}
        </div>

        <div className="topbar-divider" />

        <div className="session-timer">
          {signals.sessionMinutes}m session
        </div>

        <button className="topbar-btn" title="Notifications">
          <BellIcon />
        </button>
      </div>
    </header>
  )
}

function SearchIcon() {
  return (
    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}

function BellIcon() {
  return (
    <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  )
}
