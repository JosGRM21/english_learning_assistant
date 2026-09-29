import { useEffect, useState, useMemo } from 'react';
import {
  Sparkles,
  BookOpen,
  Brain,
  CheckCircle2,
  Moon,
  Sun,
  RotateCw,
  Search,
  AlertTriangle,
  Database,
  ArrowRight,
  Ear,
  PenTool,
  Cpu,
  Volume2,
  Volume1,
} from 'lucide-react';
import { createTestDatabase } from './infrastructure/db/database';
import { seedDatabase } from './infrastructure/db/seed-data';
import { VocabRepository } from './infrastructure/db/repositories/VocabRepository';
import { FsrsScheduler } from './core/srs/FsrsScheduler';
import { ContextRotator } from './core/srs/ContextRotator';
import { VocabItem, VocabContextExample, CefrLevel } from './core/types/vocab';
import { SrsCard, FsrsGrade } from './core/types/srs';
import { AudioService } from './infrastructure/audio/AudioService';
import { ConnectedSpeechPill } from './components/phonology/ConnectedSpeechPill';
import { MinimalPairsGym } from './components/phonology/MinimalPairsGym';
import { SocraticWritingStudio } from './components/writing/SocraticWritingStudio';
import { QuotaMatrixMonitor } from './components/ai/QuotaMatrixMonitor';

type AppTab = 'srs' | 'minimal_pairs' | 'writing' | 'quota_matrix' | 'catalog';

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const [activeTab, setActiveTab] = useState<AppTab>('srs');
  const [dbReady, setDbReady] = useState(false);
  const [vocabList, setVocabList] = useState<VocabItem[]>([]);
  const [selectedVocab, setSelectedVocab] = useState<VocabItem | null>(null);
  const [availableContexts, setAvailableContexts] = useState<VocabContextExample[]>([]);
  const [currentContext, setCurrentContext] = useState<VocabContextExample | null>(null);
  const [srsCard, setSrsCard] = useState<SrsCard | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCefr, setSelectedCefr] = useState<CefrLevel | 'ALL'>('ALL');
  const [showAnswer, setShowAnswer] = useState(false);
  const [reviewCount, setReviewCount] = useState(0);

  // Singletons
  const scheduler = useMemo(() => new FsrsScheduler(0.9), []);
  const rotator = useMemo(() => new ContextRotator(), []);
  const audioService = useMemo(() => new AudioService(), []);

  // Sync dark mode class
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Initialize DB and Seed Data
  useEffect(() => {
    async function init() {
      try {
        const db = await createTestDatabase();
        await seedDatabase(db);
        const vocabRepo = new VocabRepository(db);
        const all = await vocabRepo.getAllVocabs(100);
        setVocabList(all);

        // Pick first item with contexts (e.g. 'depend')
        const first = all.find((v) => v.word === 'depend') || all[0];
        if (first) {
          setSelectedVocab(first);
          const contexts = await vocabRepo.getContextExamples(first.id);
          setAvailableContexts(contexts);
          if (contexts.length > 0) {
            setCurrentContext(contexts[0]);
          }

          // Initial card state
          setSrsCard({
            id: 'card_demo_01',
            userId: 'user_local',
            targetType: 'VOCAB',
            targetId: first.id,
            state: 'NEW',
            stability: 0,
            difficulty: 5.0,
            reps: 0,
            lapses: 0,
            lastReviewedAt: null,
            scheduledFor: new Date().toISOString(),
            createdAt: new Date().toISOString(),
          });
        }

        setDbReady(true);
      } catch (err) {
        console.error('Failed to initialize database:', err);
      }
    }

    init();
  }, []);

  // Handle vocab selection from catalog
  const handleSelectVocab = async (item: VocabItem) => {
    setSelectedVocab(item);
    setShowAnswer(false);
    const db = await createTestDatabase();
    await seedDatabase(db);
    const vocabRepo = new VocabRepository(db);
    const contexts = await vocabRepo.getContextExamples(item.id);
    setAvailableContexts(contexts);
    setCurrentContext(contexts.length > 0 ? contexts[0] : null);

    setSrsCard({
      id: `card_${item.id}`,
      userId: 'user_local',
      targetType: 'VOCAB',
      targetId: item.id,
      state: 'NEW',
      stability: 0,
      difficulty: 5.0,
      reps: 0,
      lapses: 0,
      lastReviewedAt: null,
      scheduledFor: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    });
  };

  // Rotate cloze context
  const handleRotateContext = () => {
    if (availableContexts.length > 1 && currentContext) {
      const next = rotator.selectNextContext(availableContexts, currentContext.id);
      setCurrentContext(next);
    }
  };

  // Grade card with FSRS
  const handleRate = (grade: FsrsGrade) => {
    if (!srsCard) return;
    const now = new Date();
    const { updatedCard } = scheduler.schedule(srsCard, grade, now);
    setSrsCard(updatedCard);
    setReviewCount((prev) => prev + 1);
    setShowAnswer(false);

    // Audio chime on successful completion
    audioService.playFeedback(grade >= 3);

    // Rotate context on review for next repetition
    handleRotateContext();
  };

  // Filtered vocabulary list
  const filteredVocab = useMemo(() => {
    return vocabList.filter((item) => {
      const matchesSearch =
        item.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.translationEs.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCefr = selectedCefr === 'ALL' || item.cefrLevel === selectedCefr;
      return matchesSearch && matchesCefr;
    });
  }, [vocabList, searchQuery, selectedCefr]);

  // Preview intervals for FSRS buttons
  const previewIntervals = useMemo(() => {
    if (!srsCard) return { 1: 1, 2: 1, 3: 3, 4: 16 };
    return scheduler.previewIntervals(srsCard);
  }, [srsCard, scheduler]);

  return (
    <div className="min-h-screen bg-[#FBFBF9] dark:bg-[#0B0D13] text-gray-900 dark:text-gray-100 transition-colors duration-300 font-sans">
      {/* Top Navigation Bar */}
      <header className="border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-[#131722]/85 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 font-bold">
              ELA
            </div>
            <div>
              <h1 className="font-semibold text-base tracking-tight leading-none text-gray-900 dark:text-white">
                English Learning Assistant
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Local-First • SLA Science • FSRS v5 • Fonología • IA Socrática
              </p>
            </div>
          </div>

          {/* Tab buttons */}
          <nav className="hidden md:flex items-center space-x-1 bg-gray-100 dark:bg-gray-800/60 p-1 rounded-2xl border border-gray-200/60 dark:border-gray-700/60">
            <button
              onClick={() => setActiveTab('srs')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'srs'
                  ? 'bg-white dark:bg-[#131722] text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>SRS & Fonología</span>
            </button>

            <button
              onClick={() => setActiveTab('minimal_pairs')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'minimal_pairs'
                  ? 'bg-white dark:bg-[#131722] text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Ear className="w-3.5 h-3.5" />
              <span>Gym Pares Mínimos</span>
            </button>

            <button
              onClick={() => setActiveTab('writing')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'writing'
                  ? 'bg-white dark:bg-[#131722] text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <PenTool className="w-3.5 h-3.5" />
              <span>Taller Socrático</span>
            </button>

            <button
              onClick={() => setActiveTab('quota_matrix')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'quota_matrix'
                  ? 'bg-white dark:bg-[#131722] text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>Matriz 2D IA</span>
            </button>

            <button
              onClick={() => setActiveTab('catalog')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'catalog'
                  ? 'bg-white dark:bg-[#131722] text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Catálogo ({filteredVocab.length})</span>
            </button>
          </nav>

          <div className="flex items-center space-x-3">
            <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
              Fases 0, 1, 2 y 3 Operativas
            </div>

            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
              title="Alternar modo oscuro/claro"
            >
              {isDarkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Tab row */}
        <div className="md:hidden flex items-center overflow-x-auto px-4 py-2 border-t border-gray-100 dark:border-gray-800/80 gap-1 text-xs">
          <button
            onClick={() => setActiveTab('srs')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium ${
              activeTab === 'srs' ? 'bg-indigo-600 text-white' : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            SRS & Fonología
          </button>
          <button
            onClick={() => setActiveTab('minimal_pairs')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium ${
              activeTab === 'minimal_pairs' ? 'bg-indigo-600 text-white' : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            Pares Mínimos
          </button>
          <button
            onClick={() => setActiveTab('writing')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium ${
              activeTab === 'writing' ? 'bg-indigo-600 text-white' : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            Taller Socrático
          </button>
          <button
            onClick={() => setActiveTab('quota_matrix')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium ${
              activeTab === 'quota_matrix' ? 'bg-indigo-600 text-white' : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            Matriz Cuotas
          </button>
          <button
            onClick={() => setActiveTab('catalog')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium ${
              activeTab === 'catalog' ? 'bg-indigo-600 text-white' : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            Catálogo
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* System Architecture Banner */}
        <section className="mb-8 p-6 rounded-2xl bg-white dark:bg-[#131722] border border-gray-200 dark:border-gray-800/80 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                Motor de Aprendizaje Integral ELA
              </span>
              <h2 className="text-xl font-bold mt-1 text-gray-900 dark:text-white">
                FSRS v5 • Fonología Articulada • Gimnasio Auditivo • IA Socrática con Failover 2D
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 max-w-3xl">
                Arquitectura limpia modular: retención DSR calibrada al 90%, detección de fenómenos
                de discurso conectado (linking, elisión, weak forms), gimnasio de discriminación con ventana
                de 2.0s y taller de escritura con retroalimentación socrática y visualización diff.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1.5 rounded-lg text-xs font-mono bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-indigo-500" />
                SQLite: {dbReady ? '15 Tablas WAL' : 'Iniciando...'}
              </span>
              <span className="px-3 py-1.5 rounded-lg text-xs font-mono bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 flex items-center gap-1.5">
                <Brain className="w-3.5 h-3.5 text-emerald-500" />
                FSRS: DSR v5
              </span>
              <span className="px-3 py-1.5 rounded-lg text-xs font-mono bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 flex items-center gap-1.5">
                <Ear className="w-3.5 h-3.5 text-purple-500" />
                Fonología: Web Speech + Audio API
              </span>
              <span className="px-3 py-1.5 rounded-lg text-xs font-mono bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-amber-500" />
                Gemini 2D Pool: 80 RPD/Key
              </span>
            </div>
          </div>
        </section>

        {/* Tab 1: SRS Active Flashcards & Phonology */}
        {activeTab === 'srs' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: SRS Interactive Workspace (7 Cols) */}
            <div className="lg:col-span-7 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                    Sesión Activa FSRS & Fonología Conectada
                  </h3>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Repasos en sesión: <strong className="text-indigo-600 dark:text-indigo-400">{reviewCount}</strong>
                </span>
              </div>

              {/* Flashcard Component */}
              {selectedVocab && (
                <div className="bg-white dark:bg-[#131722] rounded-3xl p-8 border border-gray-200 dark:border-gray-800/80 shadow-md relative overflow-hidden">
                  {/* Header Pills */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-2">
                      <span className="px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60">
                        Nivel {selectedVocab.cefrLevel}
                      </span>
                      <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                        {selectedVocab.partOfSpeech}
                      </span>
                    </div>

                    {selectedVocab.isFalseFriend && (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60">
                        <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                        Falso Amigo
                      </span>
                    )}
                  </div>

                  {/* Term, IPA & Dual-Speed Audio Buttons */}
                  <div className="text-center py-6 border-b border-gray-100 dark:border-gray-800/60">
                    <h2 className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white mb-2">
                      {selectedVocab.word}
                    </h2>

                    <div className="flex items-center justify-center gap-2 mb-3">
                      <p
                        className="text-lg text-indigo-600 dark:text-indigo-400 font-medium"
                        style={{ fontFamily: 'var(--font-phonetic)' }}
                      >
                        /{selectedVocab.ipaGeneralAmerican}/
                      </p>
                    </div>

                    {/* Quick Audio Controls */}
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => audioService.speak(selectedVocab.word, 1.0)}
                        className="px-3 py-1.5 rounded-xl text-xs font-medium bg-gray-100 hover:bg-indigo-50 dark:bg-gray-800 dark:hover:bg-indigo-950/60 text-gray-700 hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-400 transition-colors flex items-center gap-1.5 cursor-pointer"
                        title="Pronunciación estándar (1.0x)"
                      >
                        <Volume2 className="w-4 h-4 text-indigo-500" />
                        <span>1.0x Nativo</span>
                      </button>

                      <button
                        onClick={() => audioService.speak(selectedVocab.word, 0.75)}
                        className="px-3 py-1.5 rounded-xl text-xs font-medium bg-gray-100 hover:bg-amber-50 dark:bg-gray-800 dark:hover:bg-amber-950/60 text-gray-700 hover:text-amber-600 dark:text-gray-300 dark:hover:text-amber-400 transition-colors flex items-center gap-1.5 cursor-pointer"
                        title="Pronunciación ralentizada para articulación (0.75x)"
                      >
                        <Volume1 className="w-4 h-4 text-amber-500" />
                        <span>0.75x Lento</span>
                      </button>
                    </div>
                  </div>

                  {/* Cloze Context Example with Encoding Variability & Connected Speech */}
                  <div className="py-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        Contexto Dinámico Rotativo ({availableContexts.length} disponibles)
                      </span>
                      {availableContexts.length > 1 && (
                        <button
                          onClick={handleRotateContext}
                          className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                          title="Rotar a otro ejemplo contextual para evitar anclaje estático"
                        >
                          <RotateCw className="w-3 h-3" />
                          Rotar Contexto
                        </button>
                      )}
                    </div>

                    {currentContext ? (
                      <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#1B2030]/60 border border-gray-200/80 dark:border-gray-800 text-sm">
                        <p className="font-editorial text-base text-gray-800 dark:text-gray-200 italic mb-2">
                          "{currentContext.sentenceEn}"
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {currentContext.sentenceEs}
                        </p>

                        {/* Connected Speech Phonology Engine Integration */}
                        <ConnectedSpeechPill
                          sentence={currentContext.sentenceEn}
                          audioService={audioService}
                        />
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 italic">No hay contexto cloze asignado.</p>
                    )}
                  </div>

                  {/* Answer reveal toggle */}
                  {!showAnswer ? (
                    <button
                      onClick={() => setShowAnswer(true)}
                      className="w-full py-3.5 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm transition-all shadow-md shadow-indigo-600/20 flex items-center justify-center space-x-2 cursor-pointer"
                    >
                      <span>Mostrar Respuesta & Calificar</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <div className="space-y-6 pt-2">
                      {/* Definition & Translation */}
                      <div className="p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {selectedVocab.translationEs}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                          {selectedVocab.definitionEn}
                        </p>

                        {selectedVocab.falseFriendNote && (
                          <div className="mt-3 text-xs text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 p-2.5 rounded-lg border border-amber-200 dark:border-amber-900/60">
                            <strong>⚠️ Nota Pedagógica:</strong> {selectedVocab.falseFriendNote}
                          </div>
                        )}
                      </div>

                      {/* FSRS Rating Buttons */}
                      <div>
                        <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">
                          Calificación FSRS (Calcula Próximo Intervalo para Retención 90%):
                        </div>
                        <div className="grid grid-cols-4 gap-3">
                          <button
                            onClick={() => handleRate(1)}
                            className="py-3 px-2 rounded-xl bg-rose-100 hover:bg-rose-200 dark:bg-rose-950/50 dark:hover:bg-rose-900/60 text-rose-800 dark:text-rose-200 border border-rose-200 dark:border-rose-900 transition-colors text-center cursor-pointer"
                          >
                            <div className="font-bold text-sm">Again (1)</div>
                            <div className="text-[11px] font-mono mt-0.5 opacity-80">
                              {previewIntervals[1]}d
                            </div>
                          </button>

                          <button
                            onClick={() => handleRate(2)}
                            className="py-3 px-2 rounded-xl bg-amber-100 hover:bg-amber-200 dark:bg-amber-950/50 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-900 transition-colors text-center cursor-pointer"
                          >
                            <div className="font-bold text-sm">Hard (2)</div>
                            <div className="text-[11px] font-mono mt-0.5 opacity-80">
                              {previewIntervals[2]}d
                            </div>
                          </button>

                          <button
                            onClick={() => handleRate(3)}
                            className="py-3 px-2 rounded-xl bg-blue-100 hover:bg-blue-200 dark:bg-blue-950/50 dark:hover:bg-blue-900/60 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-900 transition-colors text-center cursor-pointer"
                          >
                            <div className="font-bold text-sm">Good (3)</div>
                            <div className="text-[11px] font-mono mt-0.5 opacity-80">
                              {previewIntervals[3]}d
                            </div>
                          </button>

                          <button
                            onClick={() => handleRate(4)}
                            className="py-3 px-2 rounded-xl bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-900 transition-colors text-center cursor-pointer"
                          >
                            <div className="font-bold text-sm">Easy (4)</div>
                            <div className="text-[11px] font-mono mt-0.5 opacity-80">
                              {previewIntervals[4]}d
                            </div>
                          </button>
                        </div>
                      </div>

                      {/* DSR Metrics Display */}
                      {srsCard && (
                        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-100 dark:border-gray-800">
                          <span>
                            Estado: <strong className="text-gray-800 dark:text-gray-200">{srsCard.state}</strong>
                          </span>
                          <span>
                            Estabilidad: <strong className="font-mono text-indigo-600 dark:text-indigo-400">{srsCard.stability.toFixed(2)}d</strong>
                          </span>
                          <span>
                            Dificultad: <strong className="font-mono">{srsCard.difficulty.toFixed(1)}/10</strong>
                          </span>
                          <span>
                            Repeticiones: <strong className="font-mono">{srsCard.reps}</strong>
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right Column: Mini Vocab Selector (5 Cols) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <BookOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                    Selección Rápida de Vocabulario
                  </h3>
                </div>
              </div>

              {/* Search Input */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-3 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar término o traducción..."
                  className="w-full pl-10 pr-4 py-2 rounded-xl bg-white dark:bg-[#131722] border border-gray-200 dark:border-gray-800 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-gray-100"
                />
              </div>

              {/* Scrollable Vocab List */}
              <div className="bg-white dark:bg-[#131722] rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden max-h-[500px] overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800/60">
                {filteredVocab.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleSelectVocab(item)}
                    className={`p-3.5 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors flex items-center justify-between ${
                      selectedVocab?.id === item.id ? 'bg-indigo-50/70 dark:bg-indigo-950/30' : ''
                    }`}
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-sm text-gray-900 dark:text-white">
                          {item.word}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                          {item.cefrLevel}
                        </span>
                        {item.isFalseFriend && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300">
                            Falso Amigo
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {item.translationEs}
                      </div>
                    </div>

                    <span
                      className="text-xs font-mono text-gray-400"
                      style={{ fontFamily: 'var(--font-phonetic)' }}
                    >
                      /{item.ipaGeneralAmerican}/
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Minimal Pairs Gym */}
        {activeTab === 'minimal_pairs' && (
          <MinimalPairsGym audioService={audioService} />
        )}

        {/* Tab 3: Socratic Writing Studio */}
        {activeTab === 'writing' && (
          <SocraticWritingStudio audioService={audioService} />
        )}

        {/* Tab 4: Quota Matrix 2D Monitor */}
        {activeTab === 'quota_matrix' && (
          <QuotaMatrixMonitor />
        )}

        {/* Tab 5: Complete Lexicon Catalog */}
        {activeTab === 'catalog' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-[#131722] rounded-3xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                  <BookOpen className="w-5 h-5" />
                </span>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    Catálogo Léxico Completo ({filteredVocab.length} ítems)
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Banco de datos sembrado en SQLite con transcripciones IPA General American,
                    definiciones lexicográficas y advertencias de interferencia L1.
                  </p>
                </div>
              </div>

              {/* CEFR Level Filter Pills */}
              <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-xs">
                {(['ALL', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const).map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => setSelectedCefr(lvl)}
                    className={`px-3 py-1.5 rounded-xl font-medium transition-colors cursor-pointer ${
                      selectedCefr === lvl
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            {/* Vocab Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredVocab.map((item) => (
                <div
                  key={item.id}
                  className="bg-white dark:bg-[#131722] rounded-2xl p-5 border border-gray-200 dark:border-gray-800 shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-base text-gray-900 dark:text-white">
                          {item.word}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                          {item.cefrLevel}
                        </span>
                      </div>

                      <button
                        onClick={() => audioService.speak(item.word)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                        title="Pronunciar"
                      >
                        <Volume2 className="w-4 h-4 text-indigo-500" />
                      </button>
                    </div>

                    <div
                      className="text-xs text-indigo-600 dark:text-indigo-400 font-mono mb-2"
                      style={{ fontFamily: 'var(--font-phonetic)' }}
                    >
                      /{item.ipaGeneralAmerican}/
                    </div>

                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1">
                      {item.translationEs}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
                      {item.definitionEn}
                    </p>

                    {item.isFalseFriend && (
                      <div className="mt-3 p-2 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-[11px] text-rose-800 dark:text-rose-300">
                        <strong>⚠️ Falso Amigo:</strong> {item.falseFriendNote}
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800/80 flex items-center justify-between text-xs">
                    <span className="text-gray-400 uppercase font-mono text-[10px]">
                      {item.partOfSpeech}
                    </span>
                    <button
                      onClick={() => {
                        handleSelectVocab(item);
                        setActiveTab('srs');
                      }}
                      className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium text-xs cursor-pointer"
                    >
                      Repasar en SRS →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
