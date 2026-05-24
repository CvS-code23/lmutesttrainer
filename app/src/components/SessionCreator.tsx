import { useState, useMemo } from 'react'
import { questions as allQuestions } from '../data/questions'
import { type Question, type Subject } from '../types'
import { SUBJECT_META, pickRandom } from '../utils/scoring'

type DiffFilter = 'all' | 'easy' | 'medium' | 'hard'

interface SubjectConfig {
  count: number
  difficulty: DiffFilter
}

export type SessionConfig = Record<Subject, SubjectConfig>

interface SessionCreatorProps {
  onStart: (selectedQuestions: Question[]) => void
  onBack: () => void
}

const SUBJECTS = Object.values(SUBJECT_META)

const DIFF_LABEL: Record<DiffFilter, string> = {
  all: 'Alle',
  easy: 'Leicht',
  medium: 'Mittel',
  hard: 'Schwer',
}

const DIFF_ACTIVE: Record<DiffFilter, string> = {
  all: 'bg-lmu-blue text-white',
  easy: 'bg-green-500 text-white',
  medium: 'bg-yellow-500 text-white',
  hard: 'bg-red-500 text-white',
}

const DIFF_BADGE: Record<Exclude<DiffFilter, 'all'>, string> = {
  easy: 'bg-green-50 text-green-700',
  medium: 'bg-yellow-50 text-yellow-700',
  hard: 'bg-red-50 text-red-700',
}

export function SessionCreator({ onStart, onBack }: SessionCreatorProps) {
  const [configs, setConfigs] = useState<SessionConfig>(() => {
    const init = {} as SessionConfig
    for (const s of SUBJECTS) {
      init[s.id] = { count: 5, difficulty: 'all' }
    }
    return init
  })

  // Available question counts per subject × difficulty
  const availability = useMemo(() => {
    const result = {} as Record<Subject, Record<DiffFilter, number>>
    for (const s of SUBJECTS) {
      const sq = allQuestions.filter((q) => q.subject === s.id)
      result[s.id] = {
        all: sq.length,
        easy: sq.filter((q) => q.difficulty === 'easy').length,
        medium: sq.filter((q) => q.difficulty === 'medium').length,
        hard: sq.filter((q) => q.difficulty === 'hard').length,
      }
    }
    return result
  }, [])

  function setDifficulty(subject: Subject, diff: DiffFilter) {
    setConfigs((prev) => {
      const maxForDiff = availability[subject][diff]
      return {
        ...prev,
        [subject]: {
          difficulty: diff,
          count: Math.min(prev[subject].count, maxForDiff),
        },
      }
    })
  }

  function adjustCount(subject: Subject, delta: number) {
    setConfigs((prev) => {
      const max = availability[subject][prev[subject].difficulty]
      const next = Math.max(0, Math.min(max, prev[subject].count + delta))
      return { ...prev, [subject]: { ...prev[subject], count: next } }
    })
  }

  function setExact(subject: Subject, n: number) {
    setConfigs((prev) => {
      const max = availability[subject][prev[subject].difficulty]
      return { ...prev, [subject]: { ...prev[subject], count: Math.min(n, max) } }
    })
  }

  const totalQuestions = Object.values(configs).reduce((sum, c) => sum + c.count, 0)

  function handleStart() {
    if (totalQuestions === 0) return
    const selected: Question[] = []
    for (const s of SUBJECTS) {
      const { count, difficulty } = configs[s.id]
      if (count === 0) continue
      const pool = allQuestions.filter(
        (q) => q.subject === s.id && (difficulty === 'all' || q.difficulty === difficulty),
      )
      selected.push(...pickRandom(pool, count))
    }
    onStart(selected)
  }

  const activeSummary = SUBJECTS.filter((s) => configs[s.id].count > 0)
    .map((s) => {
      const c = configs[s.id]
      const diffStr = c.difficulty === 'all' ? '' : ` (${DIFF_LABEL[c.difficulty]})`
      return `${s.label}: ${c.count}${diffStr}`
    })
    .join(' · ')

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Nav */}
      <nav className="bg-lmu-blue text-white px-4 py-3 flex items-center gap-3 shadow sticky top-0 z-10">
        <button
          onClick={onBack}
          className="hover:bg-white hover:bg-opacity-20 p-1.5 rounded-lg transition"
        >
          ←
        </button>
        <span className="font-semibold">Session erstellen</span>
      </nav>

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-5 pb-36 space-y-3">
        <p className="text-sm text-gray-500">
          Stelle für jedes Themengebiet Schwierigkeit und Anzahl der Fragen ein. Setze ein Fach auf 0 um es zu überspringen.
        </p>

        {SUBJECTS.map((meta) => {
          const cfg = configs[meta.id]
          const avail = availability[meta.id]
          const maxForDiff = avail[cfg.difficulty]
          const isActive = cfg.count > 0

          return (
            <div
              key={meta.id}
              className={`bg-white rounded-2xl shadow-sm border overflow-hidden transition-all ${
                isActive ? 'border-gray-200' : 'opacity-60'
              }`}
            >
              {/* Subject header */}
              <div className={`px-4 py-3 flex items-center gap-2 border-b ${meta.bgColor}`}>
                <span className="text-base">{meta.language === 'en' ? '🇬🇧' : '🇩🇪'}</span>
                <span className={`font-bold text-sm ${meta.color}`}>{meta.label}</span>
                <div className="ml-auto flex items-center gap-2">
                  {cfg.difficulty !== 'all' && (
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${DIFF_BADGE[cfg.difficulty as Exclude<DiffFilter,'all'>]}`}>
                      {DIFF_LABEL[cfg.difficulty]}
                    </span>
                  )}
                  <span className="text-xs text-gray-400">{avail.all} total</span>
                </div>
              </div>

              <div className="px-4 py-4 space-y-3">
                {/* Difficulty tabs */}
                <div className="flex gap-1.5">
                  {(['all', 'easy', 'medium', 'hard'] as DiffFilter[]).map((d) => (
                    <button
                      key={d}
                      onClick={() => setDifficulty(meta.id, d)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        cfg.difficulty === d
                          ? DIFF_ACTIVE[d]
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      {DIFF_LABEL[d]}
                      <span className="ml-1 font-normal opacity-70">({avail[d]})</span>
                    </button>
                  ))}
                </div>

                {/* Count row */}
                <div className="flex items-center gap-3">
                  {/* − button */}
                  <button
                    onClick={() => adjustCount(meta.id, -1)}
                    disabled={cfg.count === 0}
                    className="w-9 h-9 rounded-full border-2 border-gray-200 bg-white hover:bg-gray-50 font-bold text-xl flex items-center justify-center transition disabled:opacity-25 disabled:cursor-not-allowed"
                  >
                    −
                  </button>

                  {/* Count display */}
                  <div className="flex-1 text-center">
                    <span className={`text-3xl font-bold ${isActive ? 'text-lmu-blue' : 'text-gray-400'}`}>
                      {cfg.count}
                    </span>
                    <span className="text-gray-400 text-sm"> / {maxForDiff}</span>
                  </div>

                  {/* + button */}
                  <button
                    onClick={() => adjustCount(meta.id, +1)}
                    disabled={cfg.count >= maxForDiff}
                    className="w-9 h-9 rounded-full border-2 border-gray-200 bg-white hover:bg-gray-50 font-bold text-xl flex items-center justify-center transition disabled:opacity-25 disabled:cursor-not-allowed"
                  >
                    +
                  </button>

                  {/* Quick-set chips */}
                  <div className="flex gap-1">
                    {[0, 5, 10, 'max'].map((n) => {
                      const val = n === 'max' ? maxForDiff : (n as number)
                      const active = cfg.count === val
                      return (
                        <button
                          key={n}
                          onClick={() => setExact(meta.id, val)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                            active
                              ? 'bg-lmu-blue text-white'
                              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                          }`}
                        >
                          {n === 'max' ? 'Max' : n}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </main>

      {/* Sticky start bar */}
      <div className="fixed bottom-0 left-0 right-0 z-20 px-4 pb-6 pt-3 bg-gradient-to-t from-gray-50 to-transparent pointer-events-none">
        <div className="max-w-2xl mx-auto pointer-events-auto">
          <div className="bg-lmu-blue text-white rounded-2xl px-5 py-4 shadow-xl flex items-center gap-4">
            <div className="flex-1 min-w-0">
              <div className="font-bold text-lg leading-none mb-1">
                {totalQuestions} {totalQuestions === 1 ? 'Frage' : 'Fragen'}
              </div>
              {activeSummary ? (
                <div className="text-blue-200 text-xs truncate">{activeSummary}</div>
              ) : (
                <div className="text-blue-300 text-xs">Keine Fragen ausgewählt</div>
              )}
            </div>
            <button
              onClick={handleStart}
              disabled={totalQuestions === 0}
              className="bg-lmu-gold text-lmu-blue font-bold px-6 py-2.5 rounded-xl hover:brightness-110 transition disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
            >
              Starten →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
