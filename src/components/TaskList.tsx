import { useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import { useAdaptive } from '../context/AdaptiveContext'
import QuizModal from './QuizModal'

/* ── Types ──────────────────────────────────────────────────── */

export type Task = {
  id: string
  text: string
  priority: 'high' | 'medium' | 'low'
  done: boolean
  studyMode: boolean
}

const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 }

/* ── Component ──────────────────────────────────────────────── */

type Props = {
  tasks: Task[]
  setTasks: Dispatch<SetStateAction<Task[]>>
  activeTaskId?: string | null
  onSelectTask?: (id: string) => void
}

export default function TaskList({ tasks, setTasks, activeTaskId, onSelectTask }: Props) {
  const [inputText, setInputText] = useState('')
  const [inputPriority, setInputPriority] = useState<Task['priority']>('medium')
  const [quizTask, setQuizTask] = useState<Task | null>(null)

  const { focusState, recordQuizScore } = useAdaptive()
  const urgentSort = focusState === 'distracted' || focusState === 'burnout'

  const sorted = [...tasks].sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1
    if (urgentSort) return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
    return 0
  })

  const handleCheck = (task: Task) => {
    if (!task.done && task.studyMode) {
      setQuizTask(task)
    } else {
      setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, done: !t.done } : t)))
    }
  }

  const handleQuizComplete = (score: number, passed: boolean) => {
    if (!quizTask) return
    recordQuizScore(score)
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== quizTask.id) return t
        if (passed) return { ...t, done: true }
        return { ...t, priority: 'high' }
      }),
    )
    setQuizTask(null)
  }

  const toggleStudyMode = (id: string) =>
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, studyMode: !t.studyMode } : t)))

  const removeTask = (id: string) =>
    setTasks((prev) => prev.filter((t) => t.id !== id))

  const addTask = () => {
    if (!inputText.trim()) return
    setTasks((prev) => [
      ...prev,
      { id: crypto.randomUUID(), text: inputText.trim(), priority: inputPriority, done: false, studyMode: false },
    ])
    setInputText('')
  }

  const remaining = tasks.filter((t) => !t.done).length
  const firstIncomplete = sorted.find((t) => !t.done)

  return (
    <>
      {quizTask && (
        <QuizModal taskText={quizTask.text} onComplete={handleQuizComplete} />
      )}

      <div className="task-list">
        <div className="task-add-row">
          <input
            className="task-input"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addTask()}
            placeholder="Add a task… (Enter to save)"
          />
          <select
            className="task-priority-select"
            value={inputPriority}
            onChange={(e) => setInputPriority(e.target.value as Task['priority'])}
          >
            <option value="high">High</option>
            <option value="medium">Med</option>
            <option value="low">Low</option>
          </select>
          <button className="task-add-btn" onClick={addTask}>Add</button>
        </div>

        <div className="task-list-header">
          <span className="task-count-label">
            {remaining} task{remaining !== 1 ? 's' : ''} remaining
          </span>
          {urgentSort && <span className="task-sort-hint">↑ sorted by priority</span>}
        </div>

        <div className="task-items">
          {sorted.map((task) => {
            const isTopPick = urgentSort && task === firstIncomplete
            return (
              <div
                key={task.id}
                className={[
                  'task-item',
                  `priority-${task.priority}`,
                  task.done ? 'done' : '',
                  isTopPick ? 'task-highlighted' : '',
                  activeTaskId === task.id ? 'task-active' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => !task.done && onSelectTask?.(task.id)}
                style={{ cursor: task.done ? 'default' : 'pointer' }}
              >
                <button className="task-check" onClick={() => handleCheck(task)}>
                  {task.done ? <CheckedIcon /> : <UncheckedIcon />}
                </button>

                <span className="task-text">{task.text}</span>

                {isTopPick && <span className="task-focus-badge">Focus now</span>}

                <button
                  className={`task-study-btn ${task.studyMode ? 'active' : ''}`}
                  onClick={() => toggleStudyMode(task.id)}
                  title={task.studyMode ? 'Study mode on — quiz on completion' : 'Enable study mode'}
                >
                  <BookIcon />
                </button>

                <span className={`priority-pip priority-pip-${task.priority}`} />

                <button className="task-delete" onClick={() => removeTask(task.id)}>
                  <XIcon />
                </button>
              </div>
            )
          })}
        </div>

        <p className="study-mode-hint">
          <BookIcon /> Toggle study mode on a task — you'll be quizzed when you mark it done.
        </p>
      </div>
    </>
  )
}

/* ── Icons ──────────────────────────────────────────────────── */

function CheckedIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" fill="var(--accent)" />
      <polyline points="8 12 11 15 16 9" fill="none" stroke="white" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function UncheckedIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--border)" strokeWidth={2}>
      <circle cx="12" cy="12" r="10" />
    </svg>
  )
}

function BookIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  )
}

function XIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}
