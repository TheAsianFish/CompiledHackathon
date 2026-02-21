import { useState } from 'react'
import { useAdaptive } from '../context/AdaptiveContext'

export type Task = {
  id: string
  text: string
  priority: 'high' | 'medium' | 'low'
  done: boolean
}

const SEED_TASKS: Task[] = [
  { id: '1', text: 'Review pull request #42',            priority: 'high',   done: false },
  { id: '2', text: 'Write tests for auth module',        priority: 'high',   done: false },
  { id: '3', text: 'Update project documentation',       priority: 'medium', done: false },
  { id: '4', text: 'Sync with team on sprint goals',     priority: 'medium', done: false },
  { id: '5', text: 'Respond to design feedback',         priority: 'low',    done: false },
]

const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 }

export default function TaskList() {
  const [tasks, setTasks] = useState<Task[]>(SEED_TASKS)
  const [inputText, setInputText] = useState('')
  const [inputPriority, setInputPriority] = useState<Task['priority']>('medium')
  const { focusState } = useAdaptive()

  const urgentSort = focusState === 'distracted' || focusState === 'burnout'

  const sorted = [...tasks].sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1
    if (urgentSort) return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
    return 0
  })

  const addTask = () => {
    if (!inputText.trim()) return
    setTasks((prev) => [
      ...prev,
      { id: crypto.randomUUID(), text: inputText.trim(), priority: inputPriority, done: false },
    ])
    setInputText('')
  }

  const toggleTask = (id: string) =>
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)))

  const removeTask = (id: string) =>
    setTasks((prev) => prev.filter((t) => t.id !== id))

  const remaining = tasks.filter((t) => !t.done).length
  const firstIncomplete = sorted.find((t) => !t.done)

  return (
    <div className="task-list">
      {/* Add row */}
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

      {/* Header */}
      <div className="task-list-header">
        <span className="task-count-label">
          {remaining} task{remaining !== 1 ? 's' : ''} remaining
        </span>
        {urgentSort && (
          <span className="task-sort-hint">↑ sorted by priority</span>
        )}
      </div>

      {/* Items */}
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
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <button className="task-check" onClick={() => toggleTask(task.id)}>
                {task.done ? <CheckedIcon /> : <UncheckedIcon />}
              </button>

              <span className="task-text">{task.text}</span>

              {isTopPick && <span className="task-focus-badge">Focus now</span>}

              <span className={`priority-pip priority-pip-${task.priority}`} />

              <button className="task-delete" onClick={() => removeTask(task.id)}>
                <XIcon />
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ── Icons ──────────────────────────────────────────────────── */

function CheckedIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" fill="var(--accent)" />
      <polyline
        points="8 12 11 15 16 9"
        fill="none"
        stroke="white"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
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

function XIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}
