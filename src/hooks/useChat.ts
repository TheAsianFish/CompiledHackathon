import { useState, useCallback, useEffect, useRef } from 'react'
import type { Task } from '../components/TaskList'

/* ── Types ──────────────────────────────────────────────────── */

export type Intent = 'code' | 'explain' | 'compare' | 'quiz' | 'general'
export type TaskType = 'code' | 'study' | 'review' | 'design' | 'general'
export type ApiStatus = 'unknown' | 'ok' | 'no_key' | 'error'

export type QuizQuestion = {
  question: string
  options: string[]
  correct: number
}

export type ChatMsg = {
  id: string
  role: 'user' | 'assistant'
  intent: Intent
  text: string
  code?: { snippet: string; language: string }
  concepts?: { term: string; definition: string }[]
  comparison?: { headers: string[]; rows: string[][] }
  quiz?: QuizQuestion[]
  timestamp: Date
}

type AIPayload = Omit<ChatMsg, 'id' | 'role' | 'timestamp'>

/* ── Task type classification ───────────────────────────────── */

export function classifyTaskType(task: Task): TaskType {
  if (task.studyMode) return 'study'
  const t = task.text.toLowerCase()
  if (/\b(write|code|implement|build|test|debug|fix|refactor|script|function|api|deploy|pr|pull request)\b/.test(t)) return 'code'
  if (/\b(review|read|check|audit|analyze|inspect|evaluate|feedback)\b/.test(t)) return 'review'
  if (/\b(design|plan|architect|structure|organize|map|outline|strategy|research)\b/.test(t)) return 'design'
  return 'general'
}

/* ── Task-locked system prompt ──────────────────────────────── */

function buildSystemPrompt(activeTask: Task, allTasks: Task[], focusState: string): string {
  const taskType = classifyTaskType(activeTask)
  const otherPending = allTasks
    .filter((t) => !t.done && t.id !== activeTask.id)
    .map((t) => `- [${t.priority.toUpperCase()}] ${t.text}`)
    .join('\n')

  const typeInstructions: Record<TaskType, string> = {
    code: `This is a CODE task. Prioritize working code. Always include a "code" block with real, runnable TypeScript/JavaScript. Explain the approach briefly in "text". Use intent="code".`,
    study: `This is a STUDY task. Explain concepts clearly using "concepts" cards (3-5 items). Use simple language. End "text" with "Want me to quiz you on this?". Use intent="explain" for explanations and intent="quiz" when testing.`,
    review: `This is a REVIEW task. Use structured bullet points in your "text". Be concise and direct. Help the user know exactly what to look for. Use intent="explain" or intent="general".`,
    design: `This is a DESIGN/PLANNING task. Use "comparison" tables when comparing options. Structure your response as clear sections. Use intent="compare" for trade-offs, intent="explain" for concepts.`,
    general: `Help the user complete this task efficiently. Pick the most appropriate intent.`,
  }

  // Style & strictness adapt to focus state
  const stateRules: Record<string, string> = {
    focus: `STRICT MODE (Deep Focus): 
- ONLY discuss the active task. If the user asks anything unrelated, respond: {"intent":"general","text":"I'm locked to your task in Deep Focus. Switch tasks to change context."}
- Keep responses SHORT and direct. Code over explanation. No filler words.
- Respond like a senior engineer in a pairing session — terse, precise, actionable.`,
    shallow: `STANDARD MODE:
- Help the user complete the active task. Normal detail level.
- If they drift off-topic, redirect gently: "Getting back to your task — ..."
- Be friendly but efficient.`,
    distracted: `RE-ENGAGE MODE (user is idle/distracted):
- Keep responses SHORT — max 2-3 sentences in "text".
- Start with a motivating nudge like "Let's knock this out —" or "Quick win:" 
- Bias toward the simplest next step, not deep explanation.
- Make it feel easy to start. Lower the activation energy.`,
    burnout: `GENTLE MODE (long session detected):
- Be warm and encouraging. Acknowledge the effort.
- Suggest breaking the task into a tiny next step.
- If the task allows, suggest saving progress and taking a break.
- Keep responses calm and low-pressure.`,
  }

  return `You are FlowDesk AI — a task-focused assistant. You are locked to ONE task at a time. The dashboard UI adapts around the user's cognitive state — so do your responses.

## ACTIVE TASK
"${activeTask.text}"
Priority: ${activeTask.priority.toUpperCase()} | Type: ${taskType}${activeTask.studyMode ? ' | Study Mode: ON' : ''}

## Task Instructions
${typeInstructions[taskType]}

## Behavioral State: ${focusState.toUpperCase()}
${stateRules[focusState] || stateRules.shallow}

## Other tasks (background only — do NOT switch)
${otherPending || '(none)'}

## Response Format
Respond ONLY with valid JSON. No markdown fences. No text outside the JSON.

{
  "intent": "code" | "explain" | "compare" | "quiz" | "general",
  "text": "your response",
  "code": { "snippet": "...", "language": "typescript" },
  "concepts": [{ "term": "...", "definition": "one clear sentence" }],
  "comparison": { "headers": ["A", "B"], "rows": [["...", "..."]] },
  "quiz": [{ "question": "...", "options": ["a","b","c","d"], "correct": 0 }]
}

Only include the fields that match the chosen intent.`
}

/* ── OpenAI call ────────────────────────────────────────────── */

async function callOpenAI(
  userText: string,
  history: ChatMsg[],
  activeTask: Task,
  allTasks: Task[],
  focusState: string,
): Promise<AIPayload> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY
  if (!apiKey) throw new Error('no_key')

  const messages = [
    { role: 'system' as const, content: buildSystemPrompt(activeTask, allTasks, focusState) },
    ...history.slice(-8).map((m) => ({ role: m.role as 'user' | 'assistant', content: m.text })),
    { role: 'user' as const, content: userText },
  ]

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model: 'gpt-4o-mini', messages, temperature: 0.6, max_tokens: 1600 }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(`api_error:${res.status}:${JSON.stringify(err)}`)
  }

  const data = await res.json()
  const raw: string = data.choices[0].message.content.trim()
  const clean = raw.replace(/^```json?\n?/, '').replace(/\n?```$/, '')
  return JSON.parse(clean) as AIPayload
}

/* ── Fallback (no API key or error) ─────────────────────────── */

function detectIntent(text: string): Intent {
  const t = text.toLowerCase()
  if (/\b(code|function|implement|write|snippet|script|example)\b/.test(t)) return 'code'
  if (/\b(explain|what is|how does|tell me|teach|describe|define)\b/.test(t)) return 'explain'
  if (/\b(compare|vs|versus|difference|pros|cons|which)\b/.test(t)) return 'compare'
  if (/\b(quiz|test me|flashcard|practice|assess)\b/.test(t)) return 'quiz'
  return 'general'
}

function fallback(userText: string, activeTask: Task): AIPayload {
  const intent = detectIntent(userText)
  const taskType = classifyTaskType(activeTask)

  if (intent === 'code' || taskType === 'code') {
    return {
      intent: 'code',
      text: `Here's a starting point for "${activeTask.text}". Connect your API key for task-specific code generation.`,
      code: {
        language: 'typescript',
        snippet: `// ${activeTask.text}\n// TODO: implement\nexport function solution(input: unknown): unknown {\n  // 1. Validate input\n  // 2. Core logic here\n  // 3. Return result\n  return input\n}`,
      },
    }
  }

  if (intent === 'explain' || taskType === 'study') {
    return {
      intent: 'explain',
      text: `Let me break down key concepts for "${activeTask.text}". Connect your API key for real explanations tailored to this task.`,
      concepts: [
        { term: 'Core Goal', definition: `The primary objective of this task: ${activeTask.text}.` },
        { term: 'Key Steps', definition: 'Break the task into smaller, sequential steps before starting.' },
        { term: 'Success Criteria', definition: 'Define what "done" looks like before you begin.' },
        { term: 'Common Blockers', definition: 'Identify potential obstacles early so you can plan around them.' },
      ],
    }
  }

  if (intent === 'compare') {
    return {
      intent: 'compare',
      text: `Here's a general approach comparison for "${activeTask.text}".`,
      comparison: {
        headers: ['Quick Approach', 'Thorough Approach'],
        rows: [
          ['Faster to execute', 'More robust result'],
          ['May need revisions', 'Less rework needed'],
          ['Good for low priority', 'Better for high priority'],
        ],
      },
    }
  }

  if (intent === 'quiz') {
    return {
      intent: 'quiz',
      text: `Let's check your readiness for "${activeTask.text}". Connect your API key for real task-specific questions.`,
      quiz: [
        {
          question: `What is the first thing you should clarify before starting "${activeTask.text}"?`,
          options: ['The expected output/outcome', 'How long it will take', 'Who assigned it', 'What tools to use'],
          correct: 0,
        },
        {
          question: 'What makes a task "done" vs "done enough"?',
          options: ['Meeting the defined acceptance criteria', 'Running out of time', 'Getting approval from anyone', 'Moving to the next task'],
          correct: 0,
        },
        {
          question: 'When should you ask for help on a task?',
          options: ['After 20-30 min of being stuck', 'Only when fully finished', 'Never — figure it out alone', 'Immediately when assigned'],
          correct: 0,
        },
      ],
    }
  }

  return {
    intent: 'general',
    text: `I'm focused on helping you with "${activeTask.text}". What specifically do you need — an explanation, some code, a comparison, or a quiz?\n\nNote: Connect your OpenAI API key for full AI-powered responses.`,
  }
}

/* ── Welcome message per task ───────────────────────────────── */

function buildWelcome(activeTask: Task | null): ChatMsg {
  const text = activeTask
    ? `I'm locked to your task: **${activeTask.text}**\n\nAsk me anything about it — I can write code, explain concepts, compare approaches, or quiz you. Use the task panel to switch tasks.`
    : `Select a task from the panel to get started. I'll focus entirely on helping you complete it.`

  return { id: 'welcome', role: 'assistant', intent: 'general', text, timestamp: new Date() }
}

/* ── Hook ───────────────────────────────────────────────────── */

export function useChat(activeTask: Task | null, allTasks: Task[], focusState: string) {
  const [messages, setMessages] = useState<ChatMsg[]>(() => [buildWelcome(activeTask)])
  const [loading, setLoading] = useState(false)
  const [apiStatus, setApiStatus] = useState<ApiStatus>('unknown')
  const prevTaskId = useRef<string | null>(activeTask?.id ?? null)

  // When active task changes, add a context-switch message
  useEffect(() => {
    if (activeTask?.id !== prevTaskId.current) {
      prevTaskId.current = activeTask?.id ?? null
      const switchMsg: ChatMsg = {
        id: crypto.randomUUID(),
        role: 'assistant',
        intent: 'general',
        text: activeTask
          ? `Switched context → **${activeTask.text}**\n\nWhat do you need — code, explanation, comparison, or a quiz?`
          : 'No task selected. Pick one from the panel.',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, switchMsg])
    }
  }, [activeTask])

  const send = useCallback(async (text: string) => {
    if (!text.trim()) return

    const userMsg: ChatMsg = {
      id: crypto.randomUUID(),
      role: 'user',
      intent: 'general',
      text,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMsg])
    setLoading(true)

    let payload: AIPayload
    const hasKey = !!import.meta.env.VITE_OPENAI_API_KEY

    if (!hasKey) {
      setApiStatus('no_key')
      payload = fallback(text, activeTask ?? { id: '', text: 'your task', priority: 'medium', done: false, studyMode: false })
    } else {
      try {
        payload = await callOpenAI(text, messages, activeTask ?? allTasks[0], allTasks, focusState)
        setApiStatus('ok')
      } catch (err) {
        const msg = err instanceof Error ? err.message : ''
        setApiStatus(msg === 'no_key' ? 'no_key' : 'error')
        console.error('[FlowDesk] AI call failed:', err)
        payload = fallback(text, activeTask ?? { id: '', text: 'your task', priority: 'medium', done: false, studyMode: false })
      }
    }

    setMessages((prev) => [
      ...prev,
      { ...payload, id: crypto.randomUUID(), role: 'assistant', timestamp: new Date() },
    ])
    setLoading(false)
  }, [messages, activeTask, allTasks, focusState])

  return { messages, loading, send, apiStatus }
}
