import type { CSSProperties } from 'react'
import { useAdaptive } from '../context/AdaptiveContext'
import type { FocusState } from '../context/AdaptiveContext'

const CONFIG: Record<FocusState, { label: string; desc: string; color: string; bg: string; emoji: string }> = {
  focus: {
    emoji: '🎯',
    label: 'Deep Focus',
    desc: "You're in the zone. Typing fast, not idle. Keep it up.",
    color: '#4f46e5',
    bg: '#eef2ff',
  },
  shallow: {
    emoji: '💭',
    label: 'Shallow Work',
    desc: "Active but not deep-focused. Pick a high-priority task to shift gears.",
    color: '#2563eb',
    bg: '#eff6ff',
  },
  distracted: {
    emoji: '⚡',
    label: 'Distracted',
    desc: "You've gone idle. Your task queue is sorted by priority to help you refocus.",
    color: '#d97706',
    bg: '#fffbeb',
  },
  burnout: {
    emoji: '😴',
    label: 'Rest Mode',
    desc: 'Long session detected. Stepping away for a few minutes improves output quality.',
    color: '#dc2626',
    bg: '#fef2f2',
  },
}

export default function StatePanel() {
  const { focusState, signals } = useAdaptive()
  const cfg = CONFIG[focusState]

  const rows = [
    { label: 'Idle time',     value: `${signals.idleSeconds}s` },
    { label: 'Typing rate',   value: `${signals.keystrokesPerMin} kpm` },
    { label: 'Tab switches',  value: `${signals.tabSwitches}` },
    { label: 'Session',       value: `${signals.sessionMinutes}m` },
  ]

  const thresholdRows = [
    { label: 'Focus triggers at',      value: '≥ 10 kpm, idle < 18s' },
    { label: 'Distracted triggers at', value: 'idle ≥ 30s' },
    { label: 'Break suggested at',     value: '25 min session' },
  ]

  return (
    <div
      className="state-panel"
      style={{ '--state-color': cfg.color, '--state-bg': cfg.bg } as CSSProperties}
    >
      <div className="state-panel-head">
        <span className="state-emoji">{cfg.emoji}</span>
        <div>
          <div className="state-panel-label">{cfg.label}</div>
        </div>
      </div>

      <p className="state-panel-desc">{cfg.desc}</p>

      <div className="state-section-title">Live signals</div>
      <div className="state-metrics">
        {rows.map((r) => (
          <div key={r.label} className="state-metric-row">
            <span className="state-metric-label">{r.label}</span>
            <span className="state-metric-value">{r.value}</span>
          </div>
        ))}
      </div>

      <div className="state-section-title" style={{ marginTop: 14 }}>Thresholds</div>
      <div className="state-metrics">
        {thresholdRows.map((r) => (
          <div key={r.label} className="state-metric-row">
            <span className="state-metric-label">{r.label}</span>
            <span className="state-metric-value" style={{ fontSize: 11 }}>{r.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
