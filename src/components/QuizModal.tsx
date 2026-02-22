import { useState, useEffect } from 'react'
import type { CSSProperties } from 'react'

/* ── Types ──────────────────────────────────────────────────── */

type RealQuestion = {
  kind: 'quiz'
  question: string
  options: string[]
  correct: number
}

type SelfQuestion = {
  kind: 'self'
  question: string
  options: string[]
  weights: [number, number, number, number] // score per option A–D
}

type Question = RealQuestion | SelfQuestion

type QuizData = {
  mode: 'quiz' | 'self'
  questions: Question[]
}

type Props = {
  taskText: string
  onComplete: (score: number, passed: boolean) => void
}

const LETTERS = ['A', 'B', 'C', 'D']

/* ── Question generation ────────────────────────────────────── */

async function generateQuestions(taskText: string): Promise<QuizData> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY

  if (apiKey) {
    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You generate educational quiz questions. Respond with valid JSON only — no markdown.',
            },
            {
              role: 'user',
              content: `Generate 3 multiple choice questions that test real understanding of: "${taskText}"

Return ONLY this JSON format:
[{"question": "...", "options": ["...", "...", "...", "..."], "correct": 0}]

Requirements:
- Questions must test actual knowledge (concepts, how things work, why decisions are made)
- One distractor option should be a common misconception
- "correct" is the 0-based index of the only right answer
- Keep options under 8 words each
- Do NOT ask self-assessment questions ("how confident are you...")`,
            },
          ],
          temperature: 0.7,
          max_tokens: 800,
        }),
      })

      const data = await res.json()
      const raw: string = data.choices[0].message.content.trim()
      const clean = raw.replace(/^```json?\n?/, '').replace(/\n?```$/, '')
      const parsed = JSON.parse(clean)

      if (Array.isArray(parsed) && parsed.length > 0) {
        return {
          mode: 'quiz',
          questions: parsed.map((q: { question: string; options: string[]; correct: number }) => ({
            kind: 'quiz' as const,
            question: q.question,
            options: q.options,
            correct: q.correct,
          })),
        }
      }
    } catch {
      // fall through to self-assessment
    }
  }

  // No API key — honest confidence self-assessment (no fake "correct" answer)
  return {
    mode: 'self',
    questions: [
      {
        kind: 'self',
        question: `How well do you understand the core concepts behind "${taskText}"?`,
        options: [
          'Very well — I could teach it',
          'Mostly — I know the key parts',
          'Somewhat — gaps remain',
          'Not really — need to review',
        ],
        weights: [100, 70, 35, 0],
      },
      {
        kind: 'self',
        question: 'Could you reproduce or apply this work from scratch?',
        options: [
          'Yes, confidently',
          'Yes, with some reference',
          'Probably not yet',
          'No — not ready',
        ],
        weights: [100, 65, 30, 0],
      },
      {
        kind: 'self',
        question: 'Did this task reveal anything you still need to learn?',
        options: [
          'Nothing — fully clear',
          'Minor gaps, not urgent',
          'Some things worth revisiting',
          'Yes — significant gaps',
        ],
        weights: [100, 75, 40, 10],
      },
    ],
  }
}

/* ── Score calculation ──────────────────────────────────────── */

function calcScore(data: QuizData, answers: number[]): number {
  if (data.mode === 'quiz') {
    const correct = answers.filter((a, i) => {
      const q = data.questions[i]
      return q.kind === 'quiz' && a === q.correct
    }).length
    return Math.round((correct / data.questions.length) * 100)
  }
  // Self-assessment: average the weights
  const total = answers.reduce((sum, a, i) => {
    const q = data.questions[i]
    return sum + (q.kind === 'self' ? q.weights[a] : 0)
  }, 0)
  return Math.round(total / data.questions.length)
}

/* ── Component ──────────────────────────────────────────────── */

export default function QuizModal({ taskText, onComplete }: Props) {
  const [data, setData] = useState<QuizData | null>(null)
  const [loading, setLoading] = useState(true)
  const [current, setCurrent] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [answers, setAnswers] = useState<number[]>([])
  const [finalScore, setFinalScore] = useState<number | null>(null)

  useEffect(() => {
    generateQuestions(taskText)
      .then(setData)
      .finally(() => setLoading(false))
  }, [taskText])

  if (!data && !loading) return null
  const q = data?.questions[current]
  const isSelf = data?.mode === 'self'

  const pick = (i: number) => {
    if (selected !== null) return
    setSelected(i)
  }

  const advance = () => {
    if (selected === null || !data) return
    const updated = [...answers, selected]
    if (current + 1 >= data.questions.length) {
      setAnswers(updated)
      setFinalScore(calcScore(data, updated))
    } else {
      setAnswers(updated)
      setCurrent((c) => c + 1)
      setSelected(null)
    }
  }

  return (
    <div className="quiz-overlay">
      <div className="quiz-card">

        {loading && (
          <div className="quiz-loading">
            <div className="quiz-spinner" />
            <p>Generating questions…</p>
          </div>
        )}

        {!loading && finalScore === null && q && data && (
          <>
            <div className="quiz-header">
              <span className={`quiz-tag ${isSelf ? 'quiz-tag-self' : ''}`}>
                {isSelf ? '🪞 Self-Assessment' : '📚 Knowledge Check'}
              </span>
              <span className="quiz-progress-label">{current + 1} / {data.questions.length}</span>
            </div>

            <div className="quiz-progress-track">
              <div
                className="quiz-progress-fill"
                style={{ width: `${(current / data.questions.length) * 100}%` }}
              />
            </div>

            <p className="quiz-context">"{taskText}"</p>
            <p className="quiz-question">{q.question}</p>

            {isSelf && (
              <p className="quiz-self-note">No right or wrong — answer honestly.</p>
            )}

            <div className="quiz-options">
              {q.options.map((opt, i) => {
                let cls = 'quiz-option'
                if (selected !== null && !isSelf) {
                  const rq = q as RealQuestion
                  if (i === rq.correct)         cls += ' opt-correct'
                  else if (i === selected)       cls += ' opt-wrong'
                  else                           cls += ' opt-dim'
                } else if (selected !== null && isSelf) {
                  if (i === selected)            cls += ' opt-selected-self'
                  else                           cls += ' opt-dim'
                }
                return (
                  <button key={i} className={cls} onClick={() => pick(i)}>
                    <span className="opt-letter">{LETTERS[i]}</span>
                    <span className="opt-text">{opt}</span>
                  </button>
                )
              })}
            </div>

            {selected !== null && (
              <button className="quiz-next-btn" onClick={advance}>
                {current + 1 >= data.questions.length ? 'See Results →' : 'Next →'}
              </button>
            )}
          </>
        )}

        {finalScore !== null && data && (
          <ResultScreen
            score={finalScore}
            mode={data.mode}
            onContinue={() => onComplete(finalScore, finalScore >= 60)}
          />
        )}

      </div>
    </div>
  )
}

/* ── Result Screen ──────────────────────────────────────────── */

function ResultScreen({
  score,
  mode,
  onContinue,
}: {
  score: number
  mode: 'quiz' | 'self'
  onContinue: () => void
}) {
  const passed = score >= 60
  const color = score >= 80 ? '#10b981' : score >= 60 ? '#3b82f6' : '#ef4444'
  const emoji = score >= 80 ? '🎉' : score >= 60 ? '👍' : '📖'

  const title =
    mode === 'quiz'
      ? score >= 80 ? 'Solid knowledge!'
        : score >= 60 ? 'Good understanding'
        : 'Needs more review'
      : score >= 80 ? 'High confidence!'
        : score >= 60 ? 'Decent grasp'
        : 'Worth revisiting'

  const desc =
    mode === 'quiz'
      ? score >= 80 ? 'You clearly understand the material. Task marked complete.'
        : score >= 60 ? 'Good grasp — a quick review of the missed concepts would help.'
        : 'This needs more reinforcement. Task returned to your queue as high priority.'
      : score >= 80 ? 'You feel confident about this. Task marked complete.'
        : score >= 60 ? 'You have the basics down. Consider a deeper review when you have time.'
        : 'You\'re flagging gaps — the task stays in your queue so you can revisit it.'

  const label = mode === 'quiz' ? 'Correct answers' : 'Confidence score'

  return (
    <div className="quiz-result">
      <div className="result-ring" style={{ '--ring-color': color } as CSSProperties}>
        <span className="result-score-num" style={{ color }}>{score}%</span>
      </div>
      <div className="result-score-label">{label}</div>
      <div className="result-emoji">{emoji}</div>
      <div className="result-title" style={{ color }}>{title}</div>
      <p className="result-desc">{desc}</p>
      {!passed && (
        <div className="result-flag">⚠️ Task returned to queue · Priority set to High</div>
      )}
      <button className="quiz-close-btn" style={{ background: color }} onClick={onContinue}>
        Continue
      </button>
    </div>
  )
}
