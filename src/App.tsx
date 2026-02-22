import { useState, useCallback, useEffect } from 'react'
import { AdaptiveContext } from './context/AdaptiveContext'
import { useAdaptiveState } from './hooks/useAdaptiveState'
import type { Task } from './components/TaskList'
import TopBar from './components/TopBar'
import FocusGuard from './components/FocusGuard'
import ChatInterface from './components/ChatInterface'
import StateBanner from './components/StateBanner'
import StatePanel from './components/StatePanel'
import TaskList from './components/TaskList'
import { Widget } from './components/Widget'
import './App.css'

const SEED_TASKS: Task[] = [
  { id: '1', text: 'Review pull request #42',         priority: 'high',   done: false, studyMode: false },
  { id: '2', text: 'Write tests for auth module',     priority: 'high',   done: false, studyMode: false },
  { id: '3', text: 'Study React hooks and useEffect', priority: 'medium', done: false, studyMode: true  },
  { id: '4', text: 'Learn TypeScript generics',       priority: 'medium', done: false, studyMode: true  },
  { id: '5', text: 'Respond to design feedback',      priority: 'low',    done: false, studyMode: false },
]

function load<T>(key: string, fallback: T): T {
  try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : fallback } catch { return fallback }
}

export default function App() {
  const { focusState, signals, exitFocus } = useAdaptiveState()
  const [tasks,       setTasks]       = useState<Task[]>(() => load('flowdesk:tasks', SEED_TASKS))
  const [quizScores,  setQuizScores]  = useState<number[]>(() => load('flowdesk:quizScores', []))
  const [activeTaskId, setActiveTaskId] = useState<string | null>(() =>
    load('flowdesk:activeTask', SEED_TASKS[0]?.id ?? null)
  )
  const [chatOpen, setChatOpen] = useState<boolean>(() => load('flowdesk:chatOpen', false))

  useEffect(() => { localStorage.setItem('flowdesk:tasks',      JSON.stringify(tasks))       }, [tasks])
  useEffect(() => { localStorage.setItem('flowdesk:quizScores', JSON.stringify(quizScores))  }, [quizScores])
  useEffect(() => { if (activeTaskId) localStorage.setItem('flowdesk:activeTask', activeTaskId) }, [activeTaskId])
  useEffect(() => { localStorage.setItem('flowdesk:chatOpen',   JSON.stringify(chatOpen))    }, [chatOpen])

  const recordQuizScore = useCallback((score: number) => {
    setQuizScores((prev) => [...prev, score])
  }, [])

  const comprehensionScore =
    quizScores.length > 0
      ? Math.round(quizScores.slice(-5).reduce((a, b) => a + b, 0) / Math.min(quizScores.length, 5))
      : null

  const activeTask = tasks.find((t) => t.id === activeTaskId && !t.done) ?? null

  // Auto-advance to next task when current completes
  useEffect(() => {
    if (!activeTask) {
      const next = tasks.find((t) => !t.done)
      if (next) setActiveTaskId(next.id)
    }
  }, [activeTask, tasks])

  const urgentSort = focusState === 'distracted' || focusState === 'burnout'

  return (
    <AdaptiveContext.Provider value={{ focusState, signals, comprehensionScore, recordQuizScore, exitFocus }}>
      <div className="app-layout" data-state={focusState}>
        <div className="app-body">
          <TopBar chatOpen={chatOpen} onToggleChat={() => setChatOpen((o) => !o)} />
          <FocusGuard onLockIn={() => {}} />
          <StateBanner />

          <div className={`workspace ${chatOpen ? 'chat-open' : ''}`}>
            {/* ── Task Dashboard ─────────────────────────── */}
            <main className="task-dashboard">
              <div className="dashboard-grid">
                <div className="tasks-col">
                  <Widget
                    title="Your Tasks"
                    subtitle={
                      urgentSort
                        ? 'Sorted by priority — focus on what matters most'
                        : 'Click a task to focus the AI on it · Toggle 📚 for study mode'
                    }
                    icon={<TasksIcon />}
                    iconBg="var(--accent-light)"
                  >
                    <TaskList
                      tasks={tasks}
                      setTasks={setTasks}
                      activeTaskId={activeTaskId}
                      onSelectTask={(id) => { setActiveTaskId(id); setChatOpen(true) }}
                    />
                  </Widget>
                </div>

                <div className="panel-col">
                  <StatePanel />
                </div>
              </div>
            </main>

            {/* ── Chat Panel (slide-in) ───────────────────── */}
            <aside className={`chat-drawer ${chatOpen ? 'open' : ''}`}>
              <div className="chat-drawer-inner">
                <ChatInterface activeTask={activeTask} allTasks={tasks} />
              </div>
            </aside>
          </div>
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
