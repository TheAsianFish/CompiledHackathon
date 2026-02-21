import { createContext, useContext } from 'react'
import type { FocusState, AdaptiveSignals } from '../hooks/useAdaptiveState'

export type { FocusState, AdaptiveSignals }

interface AdaptiveCtx {
  focusState: FocusState
  signals: AdaptiveSignals
}

export const AdaptiveContext = createContext<AdaptiveCtx>({
  focusState: 'shallow',
  signals: { idleSeconds: 0, keystrokesPerMin: 0, tabSwitches: 0, sessionMinutes: 0 },
})

export const useAdaptive = () => useContext(AdaptiveContext)
