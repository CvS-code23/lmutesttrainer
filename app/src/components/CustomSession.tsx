import { useState, useRef } from 'react'
import { type Question, type SessionResult } from '../types'
import { scoreQuestion } from '../utils/scoring'
import { savePausedSession, clearPausedSession } from '../utils/pausedSession'
import { QuestionCard } from './QuestionCard'
import { SubjectBadge } from './SubjectBadge'

interface CustomSessionProps {
  questions: Question[]
  onFinish: (result: Omit<SessionResult, 'id' | 'timestamp'>) => void
  onBack: () => void
  // Optional: restore a paused session
  initialIndex?: number
  initialResults?: SessionResult['results']
  initialPausedDuration?: number
}

const DIFF_LABEL: Record<string, string> = { easy: 'Leicht', medium: 'Mittel', hard: 'Schwer' }
const DIFF_COLOR: Record<string, string> = {
  easy: 'bg-green-50 text-green-700',
  medium: 'bg-yellow-50 text-yellow-700',
  hard: 'bg-red-50 text-red-700',
}

export function CustomSession({
  questions,
  onFinish,
  onBack,
  initialIndex = 0,
  initialResults = [],
  initialPausedDuration = 0,
}: CustomSessionProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [userAnswers, setUserAnswers] = useState<boolean[]>([false, false, false, false, false])
  const [showResult, setShowResult] = useState(false)
  const [results, setResults] = useState<SessionResult['results']>(initialResults)
  const [startTime] = useState(Date.now())
  const pausedDuration = initialPausedDuration
  const questionStartRef = useRef(Date.now())

  const currentQuestion = questions[currentIndex]
  const lastScore = results[results.length - 1]?.score

  function elapsedSeconds() {
    return pausedDuration + Math.round((Date.now() - startTime) / 1000)
  }

  function handleToggle(i: number) {
    setUserAnswers((prev) => {
      const next = [...prev]
      next[i] = !next[i]
      return next
    })
  }

  function handleSubmit() {
    const timeSeconds = Math.round((Date.now() - questionStartRef.current) / 1000)
    setShowResult(true)
    const result = scoreQuestion(currentQuestion, userAnswers, timeSeconds)
    setResults((prev) => [...prev, result])
  }

  function handleNext() {
    questionStartRef.current = Date.now()
    if (currentIndex + 1 >= questions.length) {
      const allResults = [...results]
      clearPausedSession()
      onFinish({
        mode: 'custom',
        results: allResults,
        totalScore: allResults.reduce((s, r) => s + r.score, 0),
        maxTotalScore: allResults.length * 5,
        durationSeconds: elapsedSeconds(),
      })
      return
    }
    setCurrentIndex((i) => i + 1)
    setUserAnswers([false, false, false, false, false])
    setShowResult(false)
  }

  function handlePause() {
    // Save current state — question at currentIndex is not yet answered,
    // so we only save up to currentIndex (results already contains answered ones)
    savePausedSession({
      questionIds: questions.map((q) => q.id),
      currentIndex,
      results,
      pausedDuration: elapsedSeconds(),
      savedAt: Date.now(),
    })
    onBack()
  }

  function handleAbort() {
    clearPausedSession()
    if (results.length === 0) { onBack(); return }
    const allResults = [...results]
    onFinish({
      mode: 'custom',
      results: allResults,
      totalScore: allResults.reduce((s, r) => s + r.score, 0),
      maxTotalScore: allResults.length * 5,
      durationSeconds: elapsedSeconds(),
    })
  }

  const progressPct = (currentIndex / questions.length) * 100

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Nav */}
      <nav className="bg-lmu-blue text-white px-4 py-3 shadow sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <button
            onClick={handleAbort}
            className="hover:bg-white hover:bg-opacity-20 rounded-lg px-3 py-1.5 text-sm transition"
          >
            ✕ Beenden
          </button>
          <div className="text-center">
            <div className="font-semibold text-sm">Eigene Session</div>
            <div className="text-blue-200 text-xs">
              {currentIndex + 1} / {questions.length}
            </div>
          </div>
          <button
            onClick={handlePause}
            className="hover:bg-white hover:bg-opacity-20 rounded-lg px-3 py-1.5 text-sm transition flex items-center gap-1"
          >
            ⏸ Pause
          </button>
        </div>
        {/* Progress bar */}
        <div className="max-w-2xl mx-auto mt-2">
          <div className="bg-white bg-opacity-20 rounded-full h-1.5">
            <div
              className="bg-lmu-gold rounded-full h-1.5 transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </nav>

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6 flex flex-col gap-4">
        {/* Subject + difficulty tags */}
        <div className="flex items-center gap-2 flex-wrap">
          <SubjectBadge subject={currentQuestion.subject} />
          {currentQuestion.difficulty && (
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${DIFF_COLOR[currentQuestion.difficulty] ?? 'bg-gray-100 text-gray-500'}`}>
              {DIFF_LABEL[currentQuestion.difficulty] ?? currentQuestion.difficulty}
            </span>
          )}
        </div>

        <QuestionCard
          question={currentQuestion}
          userAnswers={userAnswers}
          onToggle={handleToggle}
          showResult={showResult}
          questionNumber={currentIndex + 1}
          totalQuestions={questions.length}
        />

        {/* Action buttons */}
        <div className="flex gap-3">
          {!showResult ? (
            <button
              onClick={handleSubmit}
              className="flex-1 bg-lmu-blue text-white py-3 rounded-xl font-semibold hover:bg-lmu-light transition"
            >
              Antwort prüfen
            </button>
          ) : (
            <>
              <div className="flex-1 bg-white rounded-xl p-3 flex items-center justify-between shadow-sm border">
                <span className="text-sm text-gray-500">Punkte für diese Frage:</span>
                <span
                  className={`text-xl font-bold ${
                    lastScore === 5
                      ? 'text-green-600'
                      : (lastScore ?? 0) >= 3
                      ? 'text-yellow-600'
                      : 'text-red-500'
                  }`}
                >
                  {lastScore ?? 0} / 5
                </span>
              </div>
              <button
                onClick={handleNext}
                className="flex-1 bg-lmu-blue text-white py-3 rounded-xl font-semibold hover:bg-lmu-light transition"
              >
                {currentIndex + 1 >= questions.length ? 'Ergebnis anzeigen' : 'Nächste Frage →'}
              </button>
            </>
          )}
        </div>

        {!showResult && (
          <p className="text-center text-xs text-gray-400">
            Wähle alle zutreffenden Antworten aus (0–5 können korrekt sein).
          </p>
        )}
      </main>
    </div>
  )
}
