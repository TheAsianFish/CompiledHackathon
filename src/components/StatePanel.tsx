import type { CSSProperties } from 'react'
import { useAdaptive } from '../context/AdaptiveContext'
import type { FocusState } from '../context/AdaptiveContext'

const CONFIG: Record<FocusState, { label: string; desc: string; color: string; bg: string; emoji: string }> = {
  focus:      { emoji: '🎯', label: 'Deep Focus',   desc: "You're in the zone. Typing fast, not idle. Keep it up.",                        color: '#4f46e5', bg: '#eef2ff' },
  shallow:    { emoji: '💭', label: 'Shallow Work',  desc: 'Active but not deep-focused. Pick a high-priority task to shift gears.',        color: '#2563eb', bg: '#eff6ff' },
  distracted: { emoji: '⚡', label: 'Distracted',    desc: "You've gone idle. Your task queue is sorted by priority to help you refocus.",   color: '#d97706', bg: '#fffbeb' },
  burnout:    { emoji: '😴', label: 'Rest Mode',     desc: 'Long session detected. Stepping away briefly improves output quality.',          color: '#dc2626', bg: '#fef2f2' },
}

export default function StatePanel() {
  const { focusState, signals, comprehensionScore } = useAdaptive()
  const cfg = CONFIG[focusState]

  const signalRows = [
    { label: 'Idle time',    value: `${signals.idleSeconds}s` },
    { label: 'Typing rate',  value: `${signals.keystrokesPerMin} kpm` },
    { label: 'Tab switches', value: `${signals.tabSwitches}` },
    { label: 'Session',      value: `${signals.sessionMinutes}m` },
  ]

  const thresholdRows = [
    { label: 'Focus',      value: '≥ 10 kpm, idle < 40s' },
    { label: 'Distracted', value: 'idle ≥ 90s' },
    { label: 'Rest Mode',  value: '25 min session' },
  ]

  const comprColor =
    comprehensionScore === null ? cfg.color :
    comprehensionScore >= 80   ? '#10b981' :
    comprehensionScore >= 60   ? '#3b82f6' : '#ef4444'

  const comprLabel =
    comprehensionScore === null ? null :
    comprehensionScore >= 80   ? 'Strong retention' :
    comprehensionScore >= 60   ? 'Decent understanding' : 'Needs reinforcement'

  return (
    <div className="state-panel" style={{ '--state-color': cfg.color, '--state-bg': cfg.bg } as CSSProperties}>

      <div className="state-panel-head">
        <span className="state-emoji">{cfg.emoji}</span>
        <div className="state-panel-label">{cfg.label}</div>
      </div>
      <p className="state-panel-desc">{cfg.desc}</p>

      {comprehensionScore !== null && (
        <div className="comprehension-block" style={{ '--compr-color': comprColor } as CSSProperties}>
          <div className="comprehension-header">
            <span className="comprehension-title">📊 Comprehension</span>
            <span className="comprehension-score" style={{ color: comprColor }}>{comprehensionScore}%</span>
          </div>
          <div className="comprehension-bar-track">
            <div className="comprehension-bar-fill" style={{ width: `${comprehensionScore}%`, background: comprColor }} />
          </div>
          <p className="comprehension-label">{comprLabel} · rolling avg of last 5 quizzes</p>
        </div>
      )}

      {/* Live Signals — purple values */}
      <div className="state-section-title signals-title">Live Signals</div>
      <div className="state-metrics">
        {signalRows.map((r) => (
          <div key={r.label} className="state-metric-row">
            <span className="state-metric-label">{r.label}</span>
            <span className="state-metric-value signals-value">{r.value}</span>
          </div>
        ))}
      </div>

      {/* Thresholds — teal values */}
      <div className="state-section-title thresholds-title">Thresholds</div>
      <div className="state-metrics">
        {thresholdRows.map((r) => (
          <div key={r.label} className="state-metric-row">
            <span className="state-metric-label">{r.label}</span>
            <span className="state-metric-value thresholds-value">{r.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
