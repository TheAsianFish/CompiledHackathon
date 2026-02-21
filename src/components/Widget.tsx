type WidgetProps = {
  title: string
  subtitle?: string
  icon?: React.ReactNode
  iconBg?: string
  span?: 1 | 2 | 3
  children: React.ReactNode
}

export function Widget({ title, subtitle, icon, iconBg, span = 1, children }: WidgetProps) {
  const spanClass = span === 2 ? 'widget-span-2' : span === 3 ? 'widget-span-3' : ''

  return (
    <div className={`widget ${spanClass}`}>
      <div className="widget-header">
        <div className="widget-header-left">
          {icon && (
            <div className="widget-icon" style={{ background: iconBg ?? 'var(--bg)' }}>
              {icon}
            </div>
          )}
          <div className="widget-title-group">
            <span className="widget-title">{title}</span>
            {subtitle && <span className="widget-subtitle">{subtitle}</span>}
          </div>
        </div>
        <button className="widget-menu-btn">
          <DotsIcon />
        </button>
      </div>
      {children}
    </div>
  )
}

/* ── Bar Chart Placeholder ──────────────────────────────────── */

type BarChartProps = {
  data: number[]
  colors?: string[]
  height?: number
}

export function BarChart({ data, colors, height = 160 }: BarChartProps) {
  const max = Math.max(...data)
  const palette = colors ?? ['#7c3aed', '#8b5cf6', '#a78bfa', '#c4b5fd']

  return (
    <div className="chart-placeholder" style={{ minHeight: height }}>
      <div className="chart-bars" style={{ height: height - 16 }}>
        {data.map((v, i) => (
          <div
            key={i}
            className="chart-bar"
            style={{
              height: `${(v / max) * 100}%`,
              background: palette[i % palette.length],
              opacity: 0.85,
            }}
          />
        ))}
      </div>
    </div>
  )
}

/* ── Line Chart Placeholder ─────────────────────────────────── */

type LineChartProps = {
  datasets: { data: number[]; color: string; label?: string }[]
  height?: number
}

export function LineChart({ datasets, height = 160 }: LineChartProps) {
  const allValues = datasets.flatMap((d) => d.data)
  const max = Math.max(...allValues)
  const min = Math.min(...allValues)
  const range = max - min || 1
  const w = 300
  const h = height - 20

  return (
    <div className="chart-placeholder line-chart" style={{ minHeight: height }}>
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
        <defs>
          {datasets.map((ds, di) => (
            <linearGradient key={di} id={`line-grad-${di}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={ds.color} stopOpacity="0.12" />
              <stop offset="100%" stopColor={ds.color} stopOpacity="0" />
            </linearGradient>
          ))}
        </defs>

        {/* Grid lines */}
        {[0.25, 0.5, 0.75].map((t) => (
          <line
            key={t}
            x1={0} y1={t * h}
            x2={w} y2={t * h}
            stroke="var(--border)"
            strokeWidth={1}
          />
        ))}

        {datasets.map((ds, di) => {
          const pts = ds.data.map((v, i) => {
            const x = (i / (ds.data.length - 1)) * w
            const y = h - ((v - min) / range) * (h - 6) - 3
            return `${x},${y}`
          })
          const path = `M ${pts.join(' L ')}`
          const area = `M 0,${h} L ${pts.join(' L ')} L ${w},${h} Z`
          return (
            <g key={di}>
              <path d={area} fill={`url(#line-grad-${di})`} />
              <path d={path} fill="none" stroke={ds.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </g>
          )
        })}
      </svg>
    </div>
  )
}

/* ── Donut Chart Placeholder ────────────────────────────────── */

type DonutChartProps = {
  segments: { label: string; value: number; color: string }[]
  size?: number
}

export function DonutChart({ segments, size = 100 }: DonutChartProps) {
  const total = segments.reduce((s, seg) => s + seg.value, 0)
  const r = 40
  const cx = 50
  const cy = 50
  const circumference = 2 * Math.PI * r

  const arcs = segments.map((seg, i) => {
    const fraction = seg.value / total
    const dash = fraction * circumference
    const prevOffset = segments
      .slice(0, i)
      .reduce((acc, s) => acc + (s.value / total) * circumference, 0)
    return { offset: prevOffset, dash, ...seg }
  })

  return (
    <div className="donut-wrap">
      <svg width={size} height={size} viewBox="0 0 100 100" style={{ flexShrink: 0 }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--border)" strokeWidth="12" />
        {arcs.map((arc, i) => (
          <circle
            key={i}
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke={arc.color}
            strokeWidth="12"
            strokeDasharray={`${arc.dash} ${circumference - arc.dash}`}
            strokeDashoffset={-arc.offset}
            transform={`rotate(-90 ${cx} ${cy})`}
            strokeLinecap="round"
          />
        ))}
        <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="middle" fontSize="14" fontWeight="700" fill="var(--text-primary)">
          {total}
        </text>
      </svg>
      <div className="donut-legend">
        {segments.map((seg) => (
          <div key={seg.label} className="legend-item">
            <div className="legend-dot" style={{ background: seg.color }} />
            <span className="legend-text">{seg.label}</span>
            <span className="legend-val">{Math.round((seg.value / total) * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Activity Feed ──────────────────────────────────────────── */

type FeedEvent = {
  text: React.ReactNode
  time: string
  color: string
}

export function ActivityFeed({ events }: { events: FeedEvent[] }) {
  return (
    <div className="feed-list">
      {events.map((ev, i) => (
        <div key={i} className="feed-item">
          <div className="feed-dot" style={{ background: ev.color }} />
          <div className="feed-content">
            <div className="feed-text">{ev.text}</div>
            <div className="feed-time">{ev.time}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

/* ── User State Grid ────────────────────────────────────────── */

type StateMetric = {
  label: string
  value: string
  fill: number
  fillColor: string
}

export function UserStateGrid({ metrics }: { metrics: StateMetric[] }) {
  return (
    <div className="state-grid">
      {metrics.map((m) => (
        <div key={m.label} className="state-item">
          <span className="state-label">{m.label}</span>
          <span className="state-value">{m.value}</span>
          <div className="state-bar-track">
            <div
              className="state-bar-fill"
              style={{ width: `${m.fill}%`, background: m.fillColor }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

/* ── Icons ──────────────────────────────────────────────────── */

function DotsIcon() {
  return (
    <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
      <circle cx="5"  cy="12" r="1.5" />
      <circle cx="12" cy="12" r="1.5" />
      <circle cx="19" cy="12" r="1.5" />
    </svg>
  )
}
