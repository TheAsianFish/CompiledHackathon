type MetricCardProps = {
  label: string
  value: string
  delta: string
  trend: 'up' | 'down' | 'neutral'
  icon: React.ReactNode
  iconBg: string
  sparkData?: number[]
  sparkColor?: string
}

export default function MetricCard({
  label,
  value,
  delta,
  trend,
  icon,
  iconBg,
  sparkData = [40, 55, 45, 60, 52, 70, 65, 80, 72, 88],
  sparkColor = '#7c3aed',
}: MetricCardProps) {
  return (
    <div className="metric-card">
      <div className="metric-card-header">
        <div className="metric-icon" style={{ background: iconBg }}>
          {icon}
        </div>
        <span className={`metric-badge ${trend}`}>
          {trend === 'up' && <ArrowUpIcon />}
          {trend === 'down' && <ArrowDownIcon />}
          {delta}
        </span>
      </div>

      <div className="metric-card-body">
        <span className="metric-value">{value}</span>
        <span className="metric-label">{label}</span>
      </div>

      <Sparkline data={sparkData} color={sparkColor} />
    </div>
  )
}

/* ── Sparkline ──────────────────────────────────────────────── */

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const w = 180
  const h = 32
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1

  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w
    const y = h - ((v - min) / range) * (h - 4)
    return `${x},${y}`
  })

  const path = `M ${points.join(' L ')}`
  const areaPath = `M 0,${h} L ${points.join(' L ')} L ${w},${h} Z`

  return (
    <svg
      className="metric-sparkline"
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      style={{ width: '100%' }}
    >
      <defs>
        <linearGradient id={`grad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.15" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#grad-${color.replace('#', '')})`} />
      <path d={path} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/* ── Icons ──────────────────────────────────────────────────── */

function ArrowUpIcon() {
  return (
    <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
      <polyline points="18 15 12 9 6 15" />
    </svg>
  )
}

function ArrowDownIcon() {
  return (
    <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}
