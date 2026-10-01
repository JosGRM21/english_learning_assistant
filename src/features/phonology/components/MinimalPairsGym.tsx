import {
  Volume2,
  Trophy,
  Zap,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Clock,
  Ear,
  AlertCircle,
  Users,
} from 'lucide-react';
import { AudioService } from '@/infrastructure/audio/AudioService';
import { useMinimalPairs } from '../hooks/useMinimalPairs';
import { SpectrogramDiffView } from './SpectrogramDiffView';

export interface MinimalPairsGymProps {
  audioService?: AudioService;
}

export function MinimalPairsGym(_props: MinimalPairsGymProps) {
  const {
    filterType,
    selectedSpeakerId,
    speakers,
    currentChallenge,
    lastResult,
    isPlayingAudio,
    timeLeftMs,
    isAnswering,
    stats,
    avgLatency,
    accuracy,
    setFilterType,
    setSelectedSpeakerId,
    nextChallenge,
    handleSelect,
    repeatAudio,
    playWord,
    playComparativeSequence,
  } = useMinimalPairs();

  return (
    <div className="space-y-6">
      {/* Header and Filter */}
      <div className="bg-white dark:bg-[#131722] rounded-3xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                <Ear className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Gimnasio de Pares Mínimos
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Entrenamiento de discriminación auditiva con múltiples voces nativas para superar la interferencia fonética del español.
                </p>
              </div>
            </div>
          </div>

          {/* Filter Pills & Speaker Selector */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-2xl">
              <span className="px-2 text-[11px] text-gray-500 font-semibold flex items-center gap-1">
                <Users className="w-3 h-3 text-indigo-500" /> Voz:
              </span>
              <select
                value={selectedSpeakerId}
                onChange={(e) => setSelectedSpeakerId(e.target.value)}
                className="bg-white dark:bg-[#1A1F2C] border-none text-xs rounded-xl px-2 py-1 text-gray-800 dark:text-gray-200 font-medium cursor-pointer focus:ring-1 focus:ring-indigo-500"
              >
                <option value="ALL">🎲 Todas (HVPT Aleatorio)</option>
                {speakers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label} ({s.name})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1">
              {(['ALL', 'VOWEL', 'CONSONANT'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                    filterType === type
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {type === 'ALL' ? 'Todos' : type === 'VOWEL' ? 'Vocales' : 'Consonantes'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-6 pt-6 border-t border-gray-100 dark:border-gray-800/80">
          <div className="p-3 rounded-2xl bg-gray-50 dark:bg-[#181D2A] text-center">
            <span className="text-[11px] text-gray-400 uppercase font-semibold block">Total Retos</span>
            <span className="text-lg font-bold text-gray-900 dark:text-white">{stats.total}</span>
          </div>

          <div className="p-3 rounded-2xl bg-gray-50 dark:bg-[#181D2A] text-center">
            <span className="text-[11px] text-gray-400 uppercase font-semibold block">Precisión</span>
            <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{accuracy}%</span>
          </div>

          <div className="p-3 rounded-2xl bg-gray-50 dark:bg-[#181D2A] text-center">
            <span className="text-[11px] text-gray-400 uppercase font-semibold block flex items-center justify-center gap-1">
              <Zap className="w-3 h-3 text-amber-500" /> Racha Actual
            </span>
            <span className="text-lg font-bold text-amber-600 dark:text-amber-400">{stats.streak}</span>
          </div>

          <div className="p-3 rounded-2xl bg-gray-50 dark:bg-[#181D2A] text-center">
            <span className="text-[11px] text-gray-400 uppercase font-semibold block flex items-center justify-center gap-1">
              <Trophy className="w-3 h-3 text-indigo-500" /> Mejor Racha
            </span>
            <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{stats.bestStreak}</span>
          </div>

          <div className="p-3 rounded-2xl bg-gray-50 dark:bg-[#181D2A] text-center col-span-2 md:col-span-1">
            <span className="text-[11px] text-gray-400 uppercase font-semibold block flex items-center justify-center gap-1">
              <Clock className="w-3 h-3 text-blue-500" /> Latencia Media
            </span>
            <span className="text-lg font-bold text-blue-600 dark:text-blue-400 font-mono">
              {avgLatency > 0 ? `${avgLatency}ms` : '—'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Interactive Challenge Arena */}
      <div className="bg-white dark:bg-[#131722] rounded-3xl p-8 border border-gray-200 dark:border-gray-800 shadow-md">
        {!currentChallenge ? (
          <div className="text-center py-12 space-y-4">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-inner">
              <Ear className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                ¿Listo para afinar tu oído fonológico?
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto mt-1">
                Escucharás una palabra a ciegas correspondiente a un par contrastante (ej: <em>sheep</em> vs <em>ship</em>).
                Tendrás 2 segundos para pulsar la opción correcta.
              </p>
            </div>
            <button
              onClick={nextChallenge}
              className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-md shadow-indigo-600/20 transition-all cursor-pointer inline-flex items-center gap-2"
            >
              <Zap className="w-4 h-4" />
              <span>Iniciar Entrenamiento Rápido</span>
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Contrast Header & Speaker Profile */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  Contraste: {currentChallenge.pair.phonemicContrast}
                </span>
                <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50/60 dark:bg-indigo-950/40 px-2.5 py-1 rounded-xl border border-indigo-100 dark:border-indigo-900 flex items-center gap-1.5">
                  <Users className="w-3 h-3" />
                  <span>Voz: {currentChallenge.speaker.label}</span>
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={playComparativeSequence}
                  disabled={isPlayingAudio}
                  className="px-2.5 py-1.5 rounded-xl text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 transition-colors flex items-center gap-1 text-xs font-medium cursor-pointer disabled:opacity-50"
                  title="Escuchar secuencia A -> B"
                >
                  <Volume2 className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Secuencia A→B</span>
                </button>

                <button
                  onClick={repeatAudio}
                  disabled={isPlayingAudio}
                  className="p-2 rounded-xl text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center gap-1.5 text-xs font-medium cursor-pointer disabled:opacity-50"
                  title="Repetir audio del estímulo"
                >
                  <Volume2 className="w-4 h-4 text-indigo-500" />
                  <span>Re-escuchar</span>
                </button>
              </div>
            </div>

            {/* Countdown Progress Bar (2.0s) */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-gray-400 font-mono">
                <span>Tiempo de Reacción</span>
                <span>{(timeLeftMs / 1000).toFixed(2)}s</span>
              </div>
              <div className="w-full h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                <div
                  className={`h-full transition-all duration-30 ease-linear ${
                    timeLeftMs > 1000
                      ? 'bg-emerald-500'
                      : timeLeftMs > 500
                        ? 'bg-amber-500'
                        : 'bg-rose-500'
                  }`}
                  style={{ width: `${(timeLeftMs / 2000) * 100}%` }}
                />
              </div>
            </div>

            {/* Blind Options Choice (A vs B) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {/* Option A */}
              <button
                onClick={() => handleSelect('A')}
                disabled={!isAnswering}
                className={`p-6 rounded-2xl border text-center transition-all cursor-pointer ${
                  !lastResult
                    ? 'bg-gray-50 hover:bg-indigo-50/50 dark:bg-[#181D2A] dark:hover:bg-[#1E2435] border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700 hover:scale-[1.02]'
                    : lastResult.targetWord === currentChallenge.pair.wordA
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-900 dark:text-emerald-100 ring-2 ring-emerald-500/20'
                      : lastResult.selectedWord === currentChallenge.pair.wordA
                        ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 text-rose-900 dark:text-rose-100'
                        : 'bg-gray-50 dark:bg-[#181D2A] border-gray-200 dark:border-gray-800 opacity-50'
                }`}
              >
                <div className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white mb-1">
                  {currentChallenge.pair.wordA}
                </div>
                <div
                  className="text-sm font-mono text-indigo-600 dark:text-indigo-400"
                  style={{ fontFamily: 'var(--font-phonetic)' }}
                >
                  /{currentChallenge.pair.ipaA}/
                </div>
              </button>

              {/* Option B */}
              <button
                onClick={() => handleSelect('B')}
                disabled={!isAnswering}
                className={`p-6 rounded-2xl border text-center transition-all cursor-pointer ${
                  !lastResult
                    ? 'bg-gray-50 hover:bg-indigo-50/50 dark:bg-[#181D2A] dark:hover:bg-[#1E2435] border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700 hover:scale-[1.02]'
                    : lastResult.targetWord === currentChallenge.pair.wordB
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-900 dark:text-emerald-100 ring-2 ring-emerald-500/20'
                      : lastResult.selectedWord === currentChallenge.pair.wordB
                        ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 text-rose-900 dark:text-rose-100'
                        : 'bg-gray-50 dark:bg-[#181D2A] border-gray-200 dark:border-gray-800 opacity-50'
                }`}
              >
                <div className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white mb-1">
                  {currentChallenge.pair.wordB}
                </div>
                <div
                  className="text-sm font-mono text-indigo-600 dark:text-indigo-400"
                  style={{ fontFamily: 'var(--font-phonetic)' }}
                >
                  /{currentChallenge.pair.ipaB}/
                </div>
              </button>
            </div>

            {/* Result & Pedagogical Feedback */}
            {lastResult && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div
                  className={`p-4 rounded-2xl border ${
                    lastResult.isCorrect
                      ? 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/60'
                      : 'bg-rose-50/80 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      {lastResult.isCorrect ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                      )}

                      <div>
                        <div className="text-sm font-bold text-gray-900 dark:text-white">
                          {lastResult.isCorrect
                            ? `¡Correcto! Identificaste "${lastResult.targetWord}" en ${lastResult.responseTimeMs}ms`
                            : `Identificación incorrecta. La palabra emitida era "${lastResult.targetWord}".`}
                        </div>

                        <div className="text-xs text-gray-600 dark:text-gray-300 mt-2 flex items-start gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
                          <span>
                            <strong>Trampa L1 Español:</strong> {currentChallenge.pair.l1PitfallEs}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={nextChallenge}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors shrink-0 cursor-pointer flex items-center gap-1.5"
                    >
                      <span>Siguiente Reto</span>
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Spectrogram & Acoustic Formants Comparative Diff View */}
                <SpectrogramDiffView
                  pair={currentChallenge.pair}
                  targetWord={currentChallenge.targetWord}
                  selectedWord={lastResult.selectedWord}
                  onPlayWordA={() => playWord(currentChallenge.pair.wordA)}
                  onPlayWordB={() => playWord(currentChallenge.pair.wordB)}
                  onPlaySequence={playComparativeSequence}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
