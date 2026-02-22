import { useAdaptive } from '../context/AdaptiveContext'
import type { FocusState } from '../context/AdaptiveContext'

const STATE_BADGE: Record<FocusState, { label: string; className: string }> = {
  focus:      { label: '🎯 Deep Focus',   className: 'badge-focus' },
  shallow:    { label: '💭 Shallow Work', className: 'badge-shallow' },
  distracted: { label: '⚠️ Distracted',   className: 'badge-distracted' },
  burnout:    { label: '😴 Rest Mode',    className: 'badge-burnout' },
}

type Props = {
  chatOpen: boolean
  onToggleChat: () => void
}

export default function TopBar({ chatOpen, onToggleChat }: Props) {
  const { focusState, signals } = useAdaptive()
  const badge = STATE_BADGE[focusState]

  return (
    <header className="topbar">
      <div className="topbar-brand">FlowDesk AI</div>

      <div className="topbar-spacer" />

      <div className="topbar-actions">
        {focusState === 'focus' && (
          <button
            className="topbar-exit-focus-btn"
            onClick={() => window.dispatchEvent(new CustomEvent('flowdesk:requestExitFocus'))}
          >
            End Focus
          </button>
        )}

        <div className={`state-badge ${badge.className}`}>{badge.label}</div>

        <div className="topbar-divider" />

        <div className="session-timer">{signals.sessionMinutes}m session</div>

        <div className="topbar-divider" />

        <button
          className={`topbar-chat-btn ${chatOpen ? 'active' : ''}`}
          onClick={onToggleChat}
          title={chatOpen ? 'Close AI chat' : 'Open AI chat'}
        >
          <ChatIcon />
          <span>{chatOpen ? 'Close Chat' : 'AI Chat'}</span>
        </button>
      </div>
    </header>
  )
}

function ChatIcon() {
  return (
    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  )
}
