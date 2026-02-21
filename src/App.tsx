import { useState } from 'react'
import Sidebar from './components/Sidebar'
import TopBar from './components/TopBar'
import MetricCard from './components/MetricCard'
import {
  Widget,
  BarChart,
  LineChart,
  DonutChart,
  ActivityFeed,
  UserStateGrid,
} from './components/Widget'
import './App.css'

/* ── Placeholder data ───────────────────────────────────────── */

const METRICS = [
  {
    label: 'Active Users',
    value: '2,847',
    delta: '+12%',
    trend: 'up' as const,
    icon: <UsersIcon />,
    iconBg: 'var(--blue-light)',
    sparkColor: '#3b82f6',
    sparkData: [30, 45, 38, 55, 48, 62, 58, 70, 66, 80],
  },
  {
    label: 'Engagement Score',
    value: '87.4',
    delta: '+3.2',
    trend: 'up' as const,
    icon: <ActivityIcon />,
    iconBg: 'var(--purple-light)',
    sparkColor: '#7c3aed',
    sparkData: [60, 65, 62, 70, 68, 75, 72, 82, 80, 87],
  },
  {
    label: 'Avg. Session',
    value: '4m 32s',
    delta: '−0:14',
    trend: 'down' as const,
    icon: <ClockIcon />,
    iconBg: 'var(--yellow-light)',
    sparkColor: '#f59e0b',
    sparkData: [80, 75, 78, 70, 72, 68, 65, 62, 60, 58],
  },
  {
    label: 'Adaptation Events',
    value: '1,203',
    delta: '+41%',
    trend: 'up' as const,
    icon: <SparkleIcon />,
    iconBg: 'var(--green-light)',
    sparkColor: '#10b981',
    sparkData: [20, 30, 28, 40, 45, 55, 60, 75, 80, 95],
  },
]

const BAR_DATA = [62, 78, 55, 90, 72, 84, 66, 91, 77, 88, 70, 95]

const LINE_DATASETS = [
  {
    label: 'Engaged',
    color: '#7c3aed',
    data: [40, 52, 48, 60, 55, 70, 65, 80, 75, 88, 82, 91],
  },
  {
    label: 'Idle',
    color: '#3b82f6',
    data: [30, 28, 33, 25, 30, 22, 27, 20, 24, 18, 22, 16],
  },
]

const DONUT_SEGMENTS = [
  { label: 'Focused',    value: 48, color: '#7c3aed' },
  { label: 'Browsing',   value: 30, color: '#3b82f6' },
  { label: 'Idle',       value: 14, color: '#f59e0b' },
  { label: 'Confused',   value: 8,  color: '#ef4444' },
]

const FEED_EVENTS = [
  {
    text: <><strong>UI layout simplified</strong> for user @alex — low engagement detected</>,
    time: '2 seconds ago',
    color: '#7c3aed',
  },
  {
    text: <><strong>Font size increased</strong> — user @sarah re-read paragraph 3× in 60s</>,
    time: '18 seconds ago',
    color: '#3b82f6',
  },
  {
    text: <><strong>Dense mode activated</strong> — user @kumar flagged as expert (98th pct)</>,
    time: '1 minute ago',
    color: '#10b981',
  },
  {
    text: <><strong>Attention warning</strong> — user @jess idle for 2m 40s, nudge sent</>,
    time: '3 minutes ago',
    color: '#f59e0b',
  },
  {
    text: <><strong>Interface variant B selected</strong> — A/B test group #4 (n=312)</>,
    time: '5 minutes ago',
    color: '#6b7280',
  },
]

const USER_STATE_METRICS = [
  { label: 'Attention',    value: '82%', fill: 82, fillColor: '#7c3aed' },
  { label: 'Comprehension', value: '91%', fill: 91, fillColor: '#10b981' },
  { label: 'Frustration',  value: '14%', fill: 14, fillColor: '#ef4444' },
  { label: 'Idle Rate',    value: '22%', fill: 22, fillColor: '#f59e0b' },
]

/* ── App ────────────────────────────────────────────────────── */

export default function App() {
  const [activeNav, setActiveNav] = useState('dashboard')

  return (
    <div className="app-layout">
      <Sidebar active={activeNav} onNavigate={setActiveNav} />

      <div className="app-body">
        <TopBar />

        <main className="app-content">
          {/* Page header */}
          <div className="page-header">
            <div className="page-header-left">
              <h1 className="page-title">Dashboard</h1>
              <p className="page-subtitle">
                Real-time overview of adaptive interface metrics
              </p>
            </div>
            <div className="page-header-actions">
              <button className="btn btn-ghost">
                <FilterIcon /> Filter
              </button>
              <button className="btn btn-primary">
                <PlusIcon /> New Interface
              </button>
            </div>
          </div>

          {/* KPI row */}
          <div className="metrics-row">
            {METRICS.map((m) => (
              <MetricCard key={m.label} {...m} />
            ))}
          </div>

          {/* Widgets */}
          <div className="widgets-grid">

            {/* Engagement over time — spans 2 cols */}
            <Widget
              title="Engagement Over Time"
              subtitle="Engaged vs. idle sessions — last 12h"
              span={2}
              icon={<LineChartIcon />}
              iconBg="var(--purple-light)"
            >
              <LineChart datasets={LINE_DATASETS} height={200} />
              <div style={{ display: 'flex', gap: 16, paddingTop: 4 }}>
                {LINE_DATASETS.map((ds) => (
                  <div key={ds.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 3, background: ds.color }} />
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{ds.label}</span>
                  </div>
                ))}
              </div>
            </Widget>

            {/* Live user state */}
            <Widget
              title="Live User State"
              subtitle="Aggregate snapshot · refreshes every 5s"
              icon={<HeartPulseIcon />}
              iconBg="var(--green-light)"
            >
              <UserStateGrid metrics={USER_STATE_METRICS} />
            </Widget>

            {/* Adaptation events bar */}
            <Widget
              title="Adaptation Events"
              subtitle="Triggered UI changes per hour"
              icon={<ZapIcon />}
              iconBg="var(--yellow-light)"
            >
              <BarChart data={BAR_DATA} colors={['#7c3aed', '#8b5cf6', '#a78bfa']} height={170} />
            </Widget>

            {/* User state distribution donut */}
            <Widget
              title="User State Distribution"
              subtitle="Current session — 847 active users"
              icon={<PieIcon />}
              iconBg="var(--blue-light)"
            >
              <DonutChart segments={DONUT_SEGMENTS} size={110} />
            </Widget>

            {/* Activity feed */}
            <Widget
              title="Adaptive Events Log"
              subtitle="Most recent interface mutations"
              icon={<ClipboardIcon />}
              iconBg="var(--red-light)"
            >
              <ActivityFeed events={FEED_EVENTS} />
            </Widget>

          </div>
        </main>
      </div>
    </div>
  )
}

/* ── Inline Icons ───────────────────────────────────────────── */

function UsersIcon() {
  return (
    <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="#3b82f6" strokeWidth={2}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

function ActivityIcon() {
  return (
    <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="#7c3aed" strokeWidth={2}>
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="#f59e0b" strokeWidth={2}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}

function SparkleIcon() {
  return (
    <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="#10b981" strokeWidth={2}>
      <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
    </svg>
  )
}

function FilterIcon() {
  return (
    <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}

function LineChartIcon() {
  return (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#7c3aed" strokeWidth={2}>
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  )
}

function HeartPulseIcon() {
  return (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#10b981" strokeWidth={2}>
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  )
}

function ZapIcon() {
  return (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#f59e0b" strokeWidth={2}>
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  )
}

function PieIcon() {
  return (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#3b82f6" strokeWidth={2}>
      <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
      <path d="M22 12A10 10 0 0 0 12 2v10z" />
    </svg>
  )
}

function ClipboardIcon() {
  return (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#ef4444" strokeWidth={2}>
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
    </svg>
  )
}
