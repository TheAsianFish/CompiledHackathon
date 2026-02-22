import { createContext, useContext } from 'react'
import type { FocusState, AdaptiveSignals } from '../hooks/useAdaptiveState'

export type { FocusState, AdaptiveSignals }

interface AdaptiveCtx {
  focusState: FocusState
  signals: AdaptiveSignals
  /** Rolling average of last 5 quiz scores (0–100), null if no quizzes taken yet */
  comprehensionScore: number | null
  /** Call this after every quiz to update the rolling comprehension average */
  recordQuizScore: (score: number) => void
  /** Manually exit Deep Focus mode for up to 5 minutes */
  exitFocus: () => void
}

export const AdaptiveContext = createContext<AdaptiveCtx>({
  focusState: 'shallow',
  signals: { idleSeconds: 0, keystrokesPerMin: 0, tabSwitches: 0, sessionMinutes: 0 },
  comprehensionScore: null,
  recordQuizScore: () => {},
  exitFocus: () => {},
})

export const useAdaptive = () => useContext(AdaptiveContext)
