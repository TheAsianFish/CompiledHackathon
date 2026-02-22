import { useState, useRef, useEffect } from 'react'
import { useChat, classifyTaskType } from '../hooks/useChat'
import type { Task } from './TaskList'
import type { TaskType } from '../hooks/useChat'
import ChatMessage from './ChatMessage'
import { useAdaptive } from '../context/AdaptiveContext'

type Props = {
  activeTask: Task | null
  allTasks: Task[]
}

/* ── Suggestions per task type ──────────────────────────────── */

function getSuggestions(task: Task | null): { label: string; text: string }[] {
  if (!task) return []
  const type: TaskType = classifyTaskType(task)
  const name = task.text

  const byType: Record<TaskType, { label: string; text: string }[]> = {
    code: [
      { label: '</> Write the code',   text: `Write the implementation for "${name}"` },
      { label: '🧪 Write tests',        text: `Write unit tests for "${name}"` },
      { label: '💡 Explain approach',   text: `Explain the best approach for "${name}"` },
      { label: '⚠️ Common mistakes',    text: `What are common mistakes when doing "${name}"?` },
    ],
    study: [
      { label: '📖 Explain concepts',   text: `Explain the key concepts for "${name}"` },
      { label: '📚 Quiz me',            text: `Quiz me on "${name}"` },
      { label: '💡 Give examples',      text: `Give me real-world examples for "${name}"` },
      { label: '🗺️ Learning path',      text: `What's the best way to learn "${name}" step by step?` },
    ],
    review: [
      { label: '✅ Checklist',          text: `Give me a review checklist for "${name}"` },
      { label: '🔍 What to look for',   text: `What should I look for when doing "${name}"?` },
      { label: '⚠️ Red flags',          text: `What are common red flags when doing "${name}"?` },
      { label: '📋 Best practices',     text: `What are best practices for "${name}"?` },
    ],
    design: [
      { label: '⚖️ Compare options',    text: `Compare different approaches for "${name}"` },
      { label: '🗂️ Structure it',       text: `Help me structure a plan for "${name}"` },
      { label: '💡 Key considerations', text: `What are the key things to consider for "${name}"?` },
      { label: '📊 Trade-offs',         text: `What are the trade-offs for "${name}"?` },
    ],
    general: [
      { label: '💡 Help me start',      text: `How do I get started on "${name}"?` },
      { label: '📋 Break it down',      text: `Break down "${name}" into smaller steps` },
      { label: '⚖️ Approaches',         text: `What are the different ways to approach "${name}"?` },
      { label: '✅ Done criteria',      text: `What does "done" look like for "${name}"?` },
    ],
  }

  return byType[type]
}

const TYPE_LABEL: Record<TaskType, string> = {
  code:    '{ } Code',
  study:   '📚 Study',
  review:  '🔍 Review',
  design:  '🗂️ Design',
  general: '📋 Task',
}

/* ── Component ──────────────────────────────────────────────── */

export default function ChatInterface({ activeTask, allTasks }: Props) {
  const { focusState } = useAdaptive()
  const { messages, loading, send, apiStatus } = useChat(activeTask, allTasks, focusState)
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const handleSend = () => {
    const text = input.trim()
    if (!text || loading) return
    send(text, true) // freeform = true for typed messages — plain text response, no JSON required
    setInput('')
    inputRef.current?.focus()
  }

  const taskType = activeTask ? classifyTaskType(activeTask) : null
  const suggestions = getSuggestions(activeTask)

  return (
    <div className="chat-shell">
      {/* Task context header */}
      <div className={`chat-task-header task-type-${taskType ?? 'general'}`}>
        {activeTask ? (
          <>
            <span className="chat-task-type-badge">{taskType ? TYPE_LABEL[taskType] : ''}</span>
            <span className="chat-task-name">{activeTask.text}</span>
            <span className={`chat-task-priority priority-dot-${activeTask.priority}`}>
              {activeTask.priority}
            </span>
            {apiStatus === 'no_key' && (
              <span className="api-status-badge api-status-nokey" title="Add VITE_OPENAI_API_KEY to .env.local">⚠️ Demo</span>
            )}
            {apiStatus === 'rate_limit' && (
              <span className="api-status-badge api-status-error" title="OpenAI rate limit hit — retrying automatically">⏳ Slow down</span>
            )}
            {apiStatus === 'error' && (
              <span className="api-status-badge api-status-error" title="API call failed — check console">✕ Error</span>
            )}
            {apiStatus === 'ok' && (
              <span className="api-status-badge api-status-ok">● Live</span>
            )}
          </>
        ) : (
          <span className="chat-no-task-hint">← Click a task to focus the AI on it</span>
        )}
      </div>

      <div className="chat-messages">
        {messages.map((msg) => (
          <ChatMessage key={msg.id} msg={msg} />
        ))}

        {loading && (
          <div className="msg-ai">
            <div className="msg-ai-header">
              <div className="ai-avatar">F</div>
              <span className="intent-badge" style={{ color: '#6b7280', background: '#f3f4f6' }}>Thinking…</span>
            </div>
            <div className="msg-ai-body">
              <div className="chat-typing"><span /><span /><span /></div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Task-specific suggestion chips */}
      {activeTask && suggestions.length > 0 && (
        <div className="chat-quick-suggestions">
          {suggestions.map((s) => (
            <button
              key={s.label}
              className="quick-chip"
              onClick={() => { if (!loading) send(s.text) }}
              disabled={loading}
            >
              {s.label}
            </button>
          ))}
        </div>
      )}

      <div className="chat-input-area">
        <input
          ref={inputRef}
          className="chat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
          placeholder={activeTask ? `Ask about "${activeTask.text}"…` : 'Select a task first…'}
          disabled={loading || !activeTask}
        />
        <button
          className="chat-send-btn"
          onClick={handleSend}
          disabled={!input.trim() || loading || !activeTask}
        >
          <SendIcon />
        </button>
      </div>
    </div>
  )
}

function SendIcon() {
  return (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  )
}
