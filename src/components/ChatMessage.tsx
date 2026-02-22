import { useState } from 'react'
import type { ChatMsg, QuizQuestion } from '../hooks/useChat'

/* ── Intent config ──────────────────────────────────────────── */

const INTENT_META = {
  code:    { label: '</> Code',        color: '#059669', bg: '#ecfdf5' },
  explain: { label: '💡 Explanation',   color: '#2563eb', bg: '#eff6ff' },
  compare: { label: '⚖️  Comparison',   color: '#7c3aed', bg: '#f5f3ff' },
  quiz:    { label: '📚 Quiz',          color: '#d97706', bg: '#fffbeb' },
  general: { label: '💬 Response',      color: '#6b7280', bg: '#f9fafb' },
}

/* ── Root component ─────────────────────────────────────────── */

export default function ChatMessage({ msg }: { msg: ChatMsg }) {
  if (msg.role === 'user') {
    return (
      <div className="msg-user">
        <div className="msg-user-bubble">{msg.text}</div>
      </div>
    )
  }

  const meta = INTENT_META[msg.intent ?? 'general']

  return (
    <div className="msg-ai">
      <div className="msg-ai-header">
        <div className="ai-avatar">F</div>
        <span className="intent-badge" style={{ color: meta.color, background: meta.bg }}>
          {meta.label}
        </span>
      </div>

      <div className="msg-ai-body">
        {msg.text && <p className="msg-ai-text">{msg.text}</p>}

        {msg.intent === 'code'    && msg.code       && <CodeBlock {...msg.code} />}
        {msg.intent === 'explain' && msg.concepts   && <ConceptCards concepts={msg.concepts} />}
        {msg.intent === 'compare' && msg.comparison && <ComparisonTable {...msg.comparison} />}
        {msg.intent === 'quiz'    && msg.quiz       && <InlineQuiz questions={msg.quiz} />}
      </div>
    </div>
  )
}

/* ── Code Block ─────────────────────────────────────────────── */

function CodeBlock({ snippet, language }: { snippet: string; language: string }) {
  const [copied, setCopied] = useState(false)

  const copy = () => {
    navigator.clipboard.writeText(snippet)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="code-block">
      <div className="code-block-header">
        <span className="code-lang">{language}</span>
        <button className="code-copy-btn" onClick={copy}>
          {copied ? '✓ Copied' : 'Copy'}
        </button>
      </div>
      <pre className="code-pre"><code>{snippet}</code></pre>
    </div>
  )
}

/* ── Concept Cards ──────────────────────────────────────────── */

function ConceptCards({ concepts }: { concepts: { term: string; definition: string }[] }) {
  return (
    <div className="concept-cards">
      {concepts.map((c, i) => (
        <div key={i} className="concept-card">
          <div className="concept-term">{c.term}</div>
          <div className="concept-def">{c.definition}</div>
        </div>
      ))}
    </div>
  )
}

/* ── Comparison Table ───────────────────────────────────────── */

function ComparisonTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="compare-wrap">
      <table className="compare-table">
        <thead>
          <tr>
            {headers.map((h) => <th key={h}>{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => <td key={j}>{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* ── Inline Quiz ────────────────────────────────────────────── */

function InlineQuiz({ questions }: { questions: QuizQuestion[] }) {
  const [selected, setSelected] = useState<(number | null)[]>(questions.map(() => null))
  const [submitted, setSubmitted] = useState(false)

  const pick = (qi: number, oi: number) => {
    if (submitted) return
    setSelected((prev) => prev.map((v, i) => (i === qi ? oi : v)))
  }

  const score = submitted
    ? selected.filter((s, i) => s === questions[i].correct).length
    : null

  const allAnswered = selected.every((s) => s !== null)

  return (
    <div className="inline-quiz">
      {questions.map((q, qi) => (
        <div key={qi} className="iq-item">
          <p className="iq-question">{qi + 1}. {q.question}</p>
          <div className="iq-options">
            {q.options.map((opt, oi) => {
              let cls = 'iq-option'
              if (submitted) {
                if (oi === q.correct)           cls += ' iq-correct'
                else if (selected[qi] === oi)   cls += ' iq-wrong'
                else                            cls += ' iq-dim'
              } else if (selected[qi] === oi) {
                cls += ' iq-selected'
              }
              return (
                <button key={oi} className={cls} onClick={() => pick(qi, oi)}>
                  <span className="iq-letter">{['A', 'B', 'C', 'D'][oi]}</span>
                  {opt}
                </button>
              )
            })}
          </div>
        </div>
      ))}

      {!submitted && (
        <button
          className="iq-submit"
          onClick={() => setSubmitted(true)}
          disabled={!allAnswered}
        >
          Submit Answers
        </button>
      )}

      {score !== null && (
        <div className={`iq-result ${score === questions.length ? 'iq-perfect' : score >= questions.length * 0.6 ? 'iq-good' : 'iq-poor'}`}>
          {score === questions.length ? '🎉' : score >= questions.length * 0.6 ? '👍' : '📖'}
          {' '}<strong>{score} / {questions.length}</strong> correct
          {score < questions.length * 0.6 && ' — consider reviewing this topic'}
        </div>
      )}
    </div>
  )
}
