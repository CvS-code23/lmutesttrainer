import { SUBJECT_META } from '../utils/scoring'

interface HomeProps {
  onStartPractice: () => void
  onStartTest: () => void
  onSessionCreator: () => void
  onLiterature: () => void
}

export function Home({ onStartPractice, onStartTest, onSessionCreator, onLiterature }: HomeProps) {
  const subjects = Object.values(SUBJECT_META)

  return (
    <div className="min-h-screen bg-gradient-to-br from-lmu-blue to-lmu-light flex flex-col">
      {/* Header */}
      <header className="py-10 px-4 text-center text-white">
        <div className="flex items-center justify-center gap-3 mb-2">
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg">
            <span className="text-lmu-blue font-bold text-lg">LMU</span>
          </div>
          <div className="text-left">
            <div className="text-xs opacity-75 uppercase tracking-widest">Munich School of Management</div>
            <div className="text-xl font-semibold">Master BWL Eingangsklausur</div>
          </div>
        </div>
        <h1 className="text-4xl font-bold mt-6 mb-2">Testtrainer 2026</h1>
        <p className="text-blue-100 max-w-xl mx-auto text-sm">
          Bereite dich auf die Eingangsklausur am <strong>05.06.2026</strong> vor.
          6 Themengebiete · 30 Fragen · 2,5 Stunden · 5-3-1-0 Bewertung
        </p>
      </header>

      {/* Main actions */}
      <main className="flex-1 px-4 pb-12">
        <div className="max-w-3xl mx-auto">
          {/* Mode cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
            <button
              onClick={onStartPractice}
              className="group bg-white rounded-2xl p-7 text-left shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-1 border-2 border-transparent hover:border-lmu-gold"
            >
              <div className="text-4xl mb-3">📖</div>
              <h2 className="text-xl font-bold text-lmu-blue mb-1">Üben</h2>
              <p className="text-gray-500 text-sm">Themengebiet wählen und adaptiv üben — richtige Antworten führen zu schwereren Fragen.</p>
              <div className="mt-4 inline-flex items-center gap-2 text-lmu-light font-semibold text-sm group-hover:gap-3 transition-all">
                Jetzt üben <span>→</span>
              </div>
            </button>

            <button
              onClick={onStartTest}
              className="group bg-white rounded-2xl p-7 text-left shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-1 border-2 border-transparent hover:border-lmu-gold"
            >
              <div className="text-4xl mb-3">⏱️</div>
              <h2 className="text-xl font-bold text-lmu-blue mb-1">Test simulieren</h2>
              <p className="text-gray-500 text-sm">Simuliere die echte Klausur: 6 Themengebiete, 5 Fragen je Gebiet, 25 Minuten pro Teilgebiet.</p>
              <div className="mt-4 inline-flex items-center gap-2 text-lmu-light font-semibold text-sm group-hover:gap-3 transition-all">
                Test starten <span>→</span>
              </div>
            </button>
          </div>

          {/* Session Creator card */}
          <button
            onClick={onSessionCreator}
            className="group w-full bg-white rounded-2xl p-6 text-left shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-1 border-2 border-transparent hover:border-lmu-gold mb-8 flex items-center gap-5"
          >
            <div className="text-4xl flex-shrink-0">🎛️</div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-lmu-blue mb-1">Session erstellen</h2>
              <p className="text-gray-500 text-sm">Wähle pro Themengebiet Anzahl und Schwierigkeit der Fragen — deine individuelle Übungseinheit.</p>
            </div>
            <div className="text-lmu-light font-semibold text-sm group-hover:translate-x-1 transition-transform">→</div>
          </button>

          {/* Exam info */}
          <div className="bg-white bg-opacity-10 rounded-2xl p-6 backdrop-blur-sm mb-6">
            <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wide">Klausurformat</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: '📋', label: '30 Fragen', sub: '5 je Gebiet' },
                { icon: '⏱', label: '2,5 Stunden', sub: '25 min / Gebiet' },
                { icon: '☑️', label: 'Multiple Choice', sub: '5 Antworten / Frage' },
                { icon: '🏆', label: '5-3-1-0 Schema', sub: 'Min. 50% zum Bestehen' },
              ].map(({ icon, label, sub }) => (
                <div key={label} className="text-center">
                  <div className="text-2xl mb-1">{icon}</div>
                  <div className="text-white font-semibold text-sm">{label}</div>
                  <div className="text-blue-200 text-xs">{sub}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Literature button */}
          <div className="mb-6 text-center">
            <button
              onClick={onLiterature}
              className="inline-flex items-center gap-2 bg-white bg-opacity-15 hover:bg-opacity-25 text-white border border-white border-opacity-30 px-6 py-3 rounded-xl font-semibold text-sm transition backdrop-blur-sm"
            >
              📚 Literaturübersicht
            </button>
          </div>

          {/* Subjects */}
          <div className="bg-white bg-opacity-10 rounded-2xl p-6 backdrop-blur-sm">
            <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wide">6 Themengebiete</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {subjects.map((s) => (
                <div key={s.id} className={`rounded-xl p-3 flex items-start gap-3 ${s.bgColor}`}>
                  <span className="text-lg">{s.language === 'en' ? '🇬🇧' : '🇩🇪'}</span>
                  <div>
                    <div className={`font-semibold text-sm ${s.color}`}>{s.label}</div>
                    <div className="text-gray-500 text-xs">{s.language === 'en' ? 'English' : 'Deutsch'}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
