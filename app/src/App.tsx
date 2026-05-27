import { useState } from 'react'
import { Home } from './components/Home'
import { PracticeMode } from './components/PracticeMode'
import { TestMode } from './components/TestMode'
import { ResultsPage } from './components/ResultsPage'
import { LiteraturePage } from './components/LiteraturePage'
import { SessionCreator } from './components/SessionCreator'
import { CustomSession } from './components/CustomSession'
import { Dashboard } from './components/Dashboard'
import { LernheftPage } from './components/LernheftPage'
import { type Question, type SessionResult, type Subject } from './types'
import { saveSession, generateId } from './utils/history'
import { markSeen } from './utils/seenQuestions'
import { loadPausedSession, clearPausedSession } from './utils/pausedSession'
import { questions as allQuestions } from './data/questions'

type View = 'home' | 'practice' | 'test' | 'results' | 'literature' | 'session-creator' | 'custom-session' | 'dashboard' | 'lernheft'

export default function App() {
  const [view, setView] = useState<View>('home')
  const [lastResult, setLastResult] = useState<SessionResult | null>(null)
  const [lastView, setLastView] = useState<View>('practice')
  const [customQuestions, setCustomQuestions] = useState<Question[]>([])
  const [lernheftInitialSubject, setLernheftInitialSubject] = useState<Subject | null>(null)
  const [resumeIndex, setResumeIndex] = useState<number>(0)
  const [resumeResults, setResumeResults] = useState<SessionResult['results']>([])
  const [resumeDuration, setResumeDuration] = useState<number>(0)

  function openLernheft(subject?: Subject) {
    setLernheftInitialSubject(subject ?? null)
    setView('lernheft')
  }

  function handleFinish(result: Omit<SessionResult, 'id' | 'timestamp'>, returnTo: View) {
    const fullResult: SessionResult = {
      ...result,
      id: generateId(),
      timestamp: Date.now(),
    }
    saveSession(fullResult)
    markSeen(fullResult.results.map((r) => ({ id: r.question.id, score: r.score })))
    setLastResult(fullResult)
    setLastView(returnTo)
    setView('results')
  }

  function resumePausedSession() {
    const paused = loadPausedSession()
    if (!paused) return
    // Reconstruct Question objects from IDs
    const idMap = new Map(allQuestions.map((q) => [q.id, q]))
    const qs = paused.questionIds.map((id) => idMap.get(id)).filter(Boolean) as Question[]
    if (qs.length === 0) { clearPausedSession(); return }
    setCustomQuestions(qs)
    setResumeIndex(paused.currentIndex)
    setResumeResults(paused.results)
    setResumeDuration(paused.pausedDuration)
    setView('custom-session')
  }

  if (view === 'home') {
    return (
      <Home
        onStartPractice={() => setView('practice')}
        onStartTest={() => setView('test')}
        onSessionCreator={() => setView('session-creator')}
        onLiterature={() => setView('literature')}
        onDashboard={() => setView('dashboard')}
        onLernheft={(subject) => openLernheft(subject)}
        onResumePaused={resumePausedSession}
      />
    )
  }

  if (view === 'literature') {
    return <LiteraturePage onBack={() => setView('home')} />
  }

  if (view === 'lernheft') {
    return (
      <LernheftPage
        initialSubject={lernheftInitialSubject}
        onBack={() => setView('home')}
      />
    )
  }

  if (view === 'dashboard') {
    return <Dashboard onBack={() => setView('home')} />
  }

  if (view === 'session-creator') {
    return (
      <SessionCreator
        onStart={(qs) => {
          setCustomQuestions(qs)
          setResumeIndex(0)
          setResumeResults([])
          setResumeDuration(0)
          setView('custom-session')
        }}
        onBack={() => setView('home')}
      />
    )
  }

  if (view === 'custom-session' && customQuestions.length > 0) {
    return (
      <CustomSession
        questions={customQuestions}
        onFinish={(r) => handleFinish(r, 'session-creator')}
        onBack={() => setView('home')}
        initialIndex={resumeIndex}
        initialResults={resumeResults}
        initialPausedDuration={resumeDuration}
      />
    )
  }

  if (view === 'practice') {
    return (
      <PracticeMode
        onFinish={(r) => handleFinish(r, 'practice')}
        onBack={() => setView('home')}
      />
    )
  }

  if (view === 'test') {
    return (
      <TestMode
        onFinish={(r) => handleFinish(r, 'test')}
        onBack={() => setView('home')}
      />
    )
  }

  if (view === 'results' && lastResult) {
    return (
      <ResultsPage
        result={lastResult}
        onHome={() => setView('home')}
        onRetry={() => setView(lastView)}
      />
    )
  }

  return null
}
