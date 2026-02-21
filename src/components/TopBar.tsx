export default function TopBar() {
  return (
    <header className="topbar">
      <div className="topbar-search">
        <span className="topbar-search-icon">
          <SearchIcon />
        </span>
        <input type="text" placeholder="Search users, events, interfaces…" />
      </div>

      <div className="topbar-spacer" />

      <div className="topbar-actions">
        <div className="live-badge">
          <span className="live-dot" />
          Live
        </div>

        <div className="topbar-divider" />

        <button className="topbar-btn" title="Notifications">
          <BellIcon />
          <span className="notif-dot" />
        </button>

        <button className="topbar-btn" title="Help">
          <HelpIcon />
        </button>
      </div>
    </header>
  )
}

/* ── Icons ──────────────────────────────────────────────────── */

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

function HelpIcon() {
  return (
    <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <line x1="12" y1="17" x2="12.01" y2="17" strokeLinecap="round" strokeWidth={3} />
    </svg>
  )
}
