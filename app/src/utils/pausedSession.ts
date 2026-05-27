import { type QuestionResult } from '../types'

const KEY = 'lmu_paused_v1'

export interface PausedSessionData {
  questionIds: string[]      // ordered question IDs to restore from static data
  currentIndex: number       // which question is next
  results: QuestionResult[]  // completed results so far
  pausedDuration: number     // seconds accumulated before pausing
  savedAt: number            // ms timestamp (for display)
}

export function savePausedSession(data: PausedSessionData): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(data))
  } catch {
    // storage full — ignore
  }
}

export function loadPausedSession(): PausedSessionData | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    return JSON.parse(raw) as PausedSessionData
  } catch {
    return null
  }
}

export function clearPausedSession(): void {
  localStorage.removeItem(KEY)
}
