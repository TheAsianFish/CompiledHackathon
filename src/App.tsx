import { useState } from 'react'
import { AdaptiveContext } from './context/AdaptiveContext'
import { useAdaptiveState } from './hooks/useAdaptiveState'
import Sidebar from './components/Sidebar'
import TopBar from './components/TopBar'
import StateBanner from './components/StateBanner'
import StatePanel from './components/StatePanel'
import TaskList from './components/TaskList'
import { Widget } from './components/Widget'
import './App.css'

export default function App() {
  const { focusState, signals } = useAdaptiveState()
  const [activeNav, setActiveNav] = useState('focus')

  const pageTitle = {
    focus:      'Deep Focus Mode',
    shallow:    'Work Mode',
    distracted: 'Get Back on Track',
    burnout:    'Time for a Break',
  }[focusState]

  const pageSubtitle = {
    focus:      'Sidebar collapsed, distractions minimized — you\'re typing actively.',
    shallow:    'Moderate activity detected. Pick a task to shift into deep focus.',
    distracted: `Idle for ${signals.idleSeconds}s — your task queue is sorted by priority.`,
    burnout:    `${signals.sessionMinutes}-minute session — stepping away briefly boosts output.`,
  }[focusState]

  return (
    <AdaptiveContext.Provider value={{ focusState, signals }}>
      <div className="app-layout" data-state={focusState}>
        <Sidebar active={activeNav} onNavigate={setActiveNav} />

        <div className="app-body">
          <TopBar />
          <StateBanner />

          <main className="app-content">
            <div className="page-header">
              <div className="page-header-left">
                <h1 className="page-title">{pageTitle}</h1>
                <p className="page-subtitle">{pageSubtitle}</p>
              </div>
            </div>

            <div className="adaptive-layout">
              {/* Main column: task list */}
              <div className="tasks-column">
                <Widget
                  title="Your Tasks"
                  subtitle={
                    focusState === 'distracted' || focusState === 'burnout'
                      ? 'Sorted by priority — focus on what matters most'
                      : 'What are you working on today?'
                  }
                  icon={<TasksIcon />}
                  iconBg="var(--accent-light)"
                >
                  <TaskList />
                </Widget>
              </div>

              {/* Side column: state panel */}
              <div className="panel-column">
                <StatePanel />
              </div>
            </div>
          </main>
        </div>
      </div>
    </AdaptiveContext.Provider>
  )
}

function TasksIcon() {
  return (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="var(--accent)" strokeWidth={2}>
      <polyline points="9 11 12 14 22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  )
}
