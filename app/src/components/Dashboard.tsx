import { useState } from 'react'
import { loadHistory, clearHistory } from '../utils/history'
import { SUBJECT_META } from '../utils/scoring'
import type { Subject, SessionResult } from '../types'

interface DashboardProps {
  onBack: () => void
}

const MODE_INFO: Record<string, { icon: string; label: string }> = {
  practice: { icon: '📖', label: 'Üben' },
  test:     { icon: '⏱️', label: 'Test' },
  custom:   { icon: '🎛️', label: 'Custom' },
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(ts: number): string {
  const d = new Date(ts)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  const dDate = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const hh = d.getHours().toString().padStart(2, '0')
  const mm = d.getMinutes().toString().padStart(2, '0')
  if (dDate.getTime() === today.getTime())     return `Heute, ${hh}:${mm}`
  if (dDate.getTime() === yesterday.getTime()) return `Gestern, ${hh}:${mm}`
  return `${d.getDate().toString().padStart(2, '0')}.${(d.getMonth() + 1).toString().padStart(2, '0')}.${d.getFullYear()}, ${hh}:${mm}`
}

function formatDuration(sec: number): string {
  if (sec < 60) return `${sec}s`
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return s > 0 ? `${m}m ${s}s` : `${m} min`
}

function formatTime(sec: number): string {
  if (sec <= 0) return '–'
  if (sec < 60) return `${sec}s`
  return `${Math.floor(sec / 60)}m ${Math.round(sec % 60)}s`
}

function pctText(pct: number) {
  if (pct >= 50) return 'text-green-600'
  if (pct >= 35) return 'text-yellow-600'
  return 'text-red-500'
}

function pctBadge(pct: number) {
  if (pct >= 50) return 'text-green-700 bg-green-50'
  if (pct >= 35) return 'text-yellow-700 bg-yellow-50'
  return 'text-red-600 bg-red-50'
}

function barColor(pct: number) {
  if (pct >= 50) return 'bg-green-500'
  if (pct >= 35) return 'bg-yellow-400'
  return 'bg-red-400'
}

function ScoreBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="flex-1 bg-gray-100 rounded-full h-2">
      <div
        className={`${color} rounded-full h-2 transition-all duration-500`}
        style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
      />
    </div>
  )
}

// ── Session Detail ────────────────────────────────────────────────────────────

function SessionDetail({ session, onBack }: { session: SessionResult; onBack: () => void }) {
  const results = session.results
  const pct = session.maxTotalScore > 0 ? (session.totalScore / session.maxTotalScore) * 100 : 0
  const passed = pct >= 50
  const modeInfo = MODE_INFO[session.mode] ?? { icon: '📝', label: session.mode }

  // Score distribution
  const dist = ([5, 3, 1, 0] as const).map((s) => ({
    score: s,
    count: results.filter((r) => r.score === s).length,
  }))

  // Time stats (only where tracked)
  const timedResults = results.filter((r) => r.timeSeconds > 0)
  const avgTime =
    timedResults.length > 0
      ? Math.round(timedResults.reduce((s, r) => s + r.timeSeconds, 0) / timedResults.length)
      : 0
  const minTime = timedResults.length > 0 ? Math.min(...timedResults.map((r) => r.timeSeconds)) : 0
  const maxTime = timedResults.length > 0 ? Math.max(...timedResults.map((r) => r.timeSeconds)) : 0

  // By subject
  const bySubject = (Object.keys(SUBJECT_META) as Subject[])
    .map((id) => {
      const rs = results.filter((r) => r.question.subject === id)
      const s = rs.reduce((a, r) => a + r.score, 0)
      const m = rs.reduce((a, r) => a + r.maxScore, 0)
      return { id, count: rs.length, pct: m > 0 ? (s / m) * 100 : 0 }
    })
    .filter((s) => s.count > 0)

  // By difficulty
  const byDiff = (['easy', 'medium', 'hard'] as const)
    .map((d) => {
      const rs = results.filter((r) => r.question.difficulty === d)
      const s = rs.reduce((a, r) => a + r.score, 0)
      const m = rs.reduce((a, r) => a + r.maxScore, 0)
      const correct = rs.filter((r) => r.score === 5).length
      const wrong = rs.length - correct
      return { diff: d, count: rs.length, pct: m > 0 ? (s / m) * 100 : 0, correct, wrong }
    })
    .filter((d) => d.count > 0)

  const scoreChip: Record<number, string> = {
    5: 'bg-green-100 text-green-700',
    3: 'bg-yellow-100 text-yellow-700',
    1: 'bg-orange-100 text-orange-700',
    0: 'bg-red-100 text-red-500',
  }
  const distBar: Record<number, string> = {
    5: 'bg-green-500',
    3: 'bg-yellow-400',
    1: 'bg-orange-400',
    0: 'bg-red-400',
  }
  const distLabel: Record<number, string> = {
    5: 'text-green-700 bg-green-50',
    3: 'text-yellow-700 bg-yellow-50',
    1: 'text-orange-700 bg-orange-50',
    0: 'text-red-600 bg-red-50',
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <nav className="bg-lmu-blue text-white px-4 py-3 flex items-center gap-3 shadow sticky top-0 z-10">
        <button
          onClick={onBack}
          className="hover:bg-white hover:bg-opacity-20 p-1.5 rounded-lg transition flex-shrink-0"
        >
          ←
        </button>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm truncate">
            {modeInfo.icon} {modeInfo.label} · {formatDate(session.timestamp)}
          </div>
          <div className="text-blue-200 text-xs">{formatDuration(session.durationSeconds)}</div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="font-bold text-sm">
            {session.totalScore}/{session.maxTotalScore} Pkt
          </div>
          <div className={`text-xs font-semibold ${passed ? 'text-green-300' : 'text-red-300'}`}>
            {passed ? '✓ Bestanden' : '✗ Nicht bestanden'}
          </div>
        </div>
      </nav>

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-5 pb-10 space-y-3">
        {/* Row 1: Ergebnis + Zeit */}
        <div className="grid grid-cols-2 gap-3">
          {/* Ergebnis */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
              Ergebnis
            </p>
            <div className={`text-4xl font-bold tabular-nums leading-none mb-1 ${pctText(pct)}`}>
              {pct.toFixed(0)}%
            </div>
            <div className="text-xs text-gray-400 mb-3">
              {session.totalScore} / {session.maxTotalScore} Punkte
            </div>
            <div className="bg-gray-100 rounded-full h-2 mb-2">
              <div
                className={`${barColor(pct)} rounded-full h-2`}
                style={{ width: `${Math.min(100, pct)}%` }}
              />
            </div>
            <div className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${passed ? 'bg-green-400' : 'bg-red-400'}`} />
              <span className="text-xs text-gray-400">
                {passed ? 'Bestanden (≥ 50%)' : 'Nicht bestanden'}
              </span>
            </div>
          </div>

          {/* Zeit */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
              Zeit
            </p>
            <div className="space-y-2">
              <div>
                <div className="text-xs text-gray-400">Gesamtdauer</div>
                <div className="text-2xl font-bold text-lmu-blue tabular-nums leading-tight">
                  {formatDuration(session.durationSeconds)}
                </div>
              </div>
              {avgTime > 0 ? (
                <>
                  <div>
                    <div className="text-xs text-gray-400">Ø Zeit / Frage</div>
                    <div className="text-lg font-semibold text-gray-700 tabular-nums">
                      {formatTime(avgTime)}
                    </div>
                  </div>
                  <div className="flex gap-3 text-xs">
                    <span className="text-gray-400">
                      Min: <span className="text-green-600 font-medium">{formatTime(minTime)}</span>
                    </span>
                    <span className="text-gray-400">
                      Max: <span className="text-red-500 font-medium">{formatTime(maxTime)}</span>
                    </span>
                  </div>
                </>
              ) : (
                <p className="text-xs text-gray-400">Keine Zeitdaten</p>
              )}
            </div>
          </div>
        </div>

        {/* Punkteverteilung */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
            Punkteverteilung
          </p>
          <div className="space-y-2">
            {dist.map(({ score, count }) => {
              const barPct = results.length > 0 ? (count / results.length) * 100 : 0
              return (
                <div key={score} className="flex items-center gap-3">
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded w-11 text-center flex-shrink-0 ${distLabel[score]}`}
                  >
                    {score} Pkt
                  </span>
                  <div className="flex-1 bg-gray-100 rounded-full h-2">
                    <div
                      className={`${distBar[score]} rounded-full h-2`}
                      style={{ width: `${barPct}%` }}
                    />
                  </div>
                  <span className="w-6 text-right text-sm font-semibold text-gray-600 tabular-nums">
                    {count}
                  </span>
                  <span className="w-8 text-right text-xs text-gray-400 tabular-nums">
                    {barPct.toFixed(0)}%
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* By subject — only for multi-subject sessions */}
        {bySubject.length > 1 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
              Nach Themengebiet
            </p>
            <div className="space-y-2.5">
              {bySubject.map(({ id, count, pct: p }) => {
                const meta = SUBJECT_META[id]
                return (
                  <div key={id} className="flex items-center gap-3">
                    <div className="w-28 text-xs font-medium text-gray-600 truncate">
                      {meta.label.split(' ')[0]}
                    </div>
                    <ScoreBar pct={p} color={barColor(p)} />
                    <div className={`w-10 text-right text-sm font-bold tabular-nums ${pctText(p)}`}>
                      {p.toFixed(0)}%
                    </div>
                    <div className="w-5 text-right text-xs text-gray-400 tabular-nums">{count}</div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* By difficulty */}
        {byDiff.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
              Nach Schwierigkeit
            </p>
            <div className="space-y-3">
              {byDiff.map(({ diff, count, pct: p, correct, wrong }) => {
                const label = { easy: 'Leicht', medium: 'Mittel', hard: 'Schwer' }[diff]
                const dot = { easy: 'bg-green-400', medium: 'bg-yellow-400', hard: 'bg-red-400' }[diff]
                const correctPct = count > 0 ? Math.round((correct / count) * 100) : 0
                return (
                  <div key={diff}>
                    {/* Label + score bar */}
                    <div className="flex items-center gap-3 mb-1.5">
                      <div className="flex items-center gap-1.5 w-16 flex-shrink-0">
                        <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${dot}`} />
                        <span className="text-xs font-medium text-gray-600">{label}</span>
                      </div>
                      <ScoreBar pct={p} color={barColor(p)} />
                      <div className={`w-10 text-right text-sm font-bold tabular-nums ${pctText(p)}`}>
                        {p.toFixed(0)}%
                      </div>
                      <div className="w-5 text-right text-xs text-gray-400 tabular-nums">{count}</div>
                    </div>
                    {/* Richtig / Falsch tags */}
                    <div className="ml-[76px] flex gap-2">
                      <span className="inline-flex items-center gap-1 text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-medium">
                        ✓ {correct} richtig ({correctPct}%)
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded-full font-medium">
                        ✗ {wrong} falsch
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Question list */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-50">
            <h3 className="font-semibold text-gray-700 text-sm">
              Alle Fragen
              <span className="ml-1.5 font-normal text-gray-400">({results.length})</span>
            </h3>
          </div>
          <div className="divide-y divide-gray-50">
            {results.map((r, i) => {
              const meta = SUBJECT_META[r.question.subject]
              const diff = r.question.difficulty
              const diffShort = { easy: 'L', medium: 'M', hard: 'S' }[diff ?? 'medium'] ?? '?'
              const diffChip = {
                easy:   'bg-green-50 text-green-700',
                medium: 'bg-yellow-50 text-yellow-700',
                hard:   'bg-red-50 text-red-600',
              }[diff ?? 'medium'] ?? 'bg-gray-100 text-gray-500'

              return (
                <div key={i} className="px-4 py-2.5 flex items-center gap-2.5">
                  <span className="text-xs text-gray-300 w-5 tabular-nums flex-shrink-0">{i + 1}</span>
                  <span
                    className={`text-xs font-bold px-1.5 py-0.5 rounded flex-shrink-0 min-w-[34px] text-center ${scoreChip[r.score]}`}
                  >
                    {r.score}/5
                  </span>
                  <span
                    className={`hidden sm:inline text-xs font-medium px-1.5 py-0.5 rounded flex-shrink-0 ${meta.bgColor} ${meta.color}`}
                  >
                    {meta.label.split(' ')[0]}
                  </span>
                  <span className={`text-xs font-medium px-1.5 py-0.5 rounded flex-shrink-0 ${diffChip}`}>
                    {diffShort}
                  </span>
                  <div className="flex-1 min-w-0 text-xs text-gray-500 truncate leading-tight">
                    {r.question.text}
                  </div>
                  {r.timeSeconds > 0 && (
                    <span className="text-xs text-gray-400 flex-shrink-0 tabular-nums ml-1">
                      {formatTime(r.timeSeconds)}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </main>
    </div>
  )
}

// ── Dashboard (list view) ────────────────────────────────────────────────────

export function Dashboard({ onBack }: DashboardProps) {
  const [history, setHistory] = useState(() => loadHistory())
  const [selectedSession, setSelectedSession] = useState<SessionResult | null>(null)
  const [confirmClear, setConfirmClear] = useState(false)

  // Navigate into detail view
  if (selectedSession) {
    return <SessionDetail session={selectedSession} onBack={() => setSelectedSession(null)} />
  }

  // Overall quick stats
  const allResults = history.flatMap((s) => s.results)
  const totalQ = allResults.length
  const totalScore = allResults.reduce((s, r) => s + r.score, 0)
  const maxScore = allResults.reduce((s, r) => s + r.maxScore, 0)
  const pctOverall = maxScore > 0 ? (totalScore / maxScore) * 100 : 0

  function handleClear() {
    clearHistory()
    setHistory([])
    setConfirmClear(false)
  }

  const isEmpty = history.length === 0

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <nav className="bg-lmu-blue text-white px-4 py-3 flex items-center gap-3 shadow sticky top-0 z-10">
        <button
          onClick={onBack}
          className="hover:bg-white hover:bg-opacity-20 p-1.5 rounded-lg transition"
        >
          ←
        </button>
        <span className="font-semibold flex-1">Mein Dashboard</span>
        {history.length > 0 && (
          <button
            onClick={() => setConfirmClear(true)}
            className="text-xs text-blue-200 hover:text-white transition px-2 py-1"
          >
            Verlauf löschen
          </button>
        )}
      </nav>

      {/* Confirm dialog */}
      {confirmClear && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 px-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="font-bold text-gray-800 mb-2">Verlauf löschen?</h3>
            <p className="text-sm text-gray-500 mb-5">
              Alle {history.length} gespeicherten Sessions werden unwiderruflich gelöscht.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmClear(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
              >
                Abbrechen
              </button>
              <button
                onClick={handleClear}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition"
              >
                Löschen
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-5 pb-10 space-y-4">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="text-6xl mb-4">📊</div>
            <h2 className="text-xl font-bold text-gray-700 mb-2">Noch keine Daten</h2>
            <p className="text-gray-400 text-sm max-w-xs">
              Starte eine Session — deine Statistiken erscheinen dann hier.
            </p>
          </div>
        ) : (
          <>
            {/* Overall stats strip */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
              <div className="grid grid-cols-3 divide-x divide-gray-100 text-center">
                <div className="pr-4">
                  <div className="text-2xl font-bold text-lmu-blue tabular-nums">
                    {history.length}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">Sessions</div>
                </div>
                <div className="px-4">
                  <div className="text-2xl font-bold text-lmu-blue tabular-nums">{totalQ}</div>
                  <div className="text-xs text-gray-400 mt-0.5">Fragen gesamt</div>
                </div>
                <div className="pl-4">
                  <div className={`text-2xl font-bold tabular-nums ${pctText(pctOverall)}`}>
                    {pctOverall.toFixed(0)}%
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">Ø Score</div>
                </div>
              </div>
            </div>

            {/* Sessions table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              {/* Header */}
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-semibold text-gray-700 text-sm">
                  Practice Sessions
                  <span className="ml-1.5 font-normal text-gray-400">({history.length})</span>
                </h3>
                <p className="text-xs text-gray-400">Tippe auf eine Session für Details</p>
              </div>

              {/* Column labels */}
              <div className="px-4 py-2 grid grid-cols-[1fr_auto_auto_auto] gap-3 bg-gray-50 border-b border-gray-100 text-xs font-medium text-gray-400">
                <span>Datum</span>
                <span className="w-14 text-center">Fragen</span>
                <span className="w-16 text-center">Score</span>
                <span className="w-4" />
              </div>

              {/* Rows */}
              <div className="divide-y divide-gray-50">
                {history.map((session) => {
                  const pct =
                    session.maxTotalScore > 0
                      ? (session.totalScore / session.maxTotalScore) * 100
                      : 0
                  const info = MODE_INFO[session.mode] ?? { icon: '📝', label: session.mode }
                  return (
                    <button
                      key={session.id}
                      onClick={() => setSelectedSession(session)}
                      className="w-full px-4 py-3 grid grid-cols-[1fr_auto_auto_auto] gap-3 items-center hover:bg-gray-50 active:bg-gray-100 transition text-left"
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-gray-800 truncate">
                          {formatDate(session.timestamp)}
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5">
                          {info.icon} {info.label} · {formatDuration(session.durationSeconds)}
                        </div>
                      </div>
                      <div className="w-14 text-center text-sm text-gray-600 tabular-nums">
                        {session.results.length}
                      </div>
                      <div
                        className={`w-16 text-center text-sm font-bold tabular-nums px-2 py-1 rounded-lg ${pctBadge(pct)}`}
                      >
                        {pct.toFixed(0)}%
                      </div>
                      <div className="w-4 text-gray-300 text-base font-light">›</div>
                    </button>
                  )
                })}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
