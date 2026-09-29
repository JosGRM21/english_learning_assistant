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
  Layers,
  Database,
  ArrowRight,
} from 'lucide-react';
import { createTestDatabase } from './infrastructure/db/database';
import { seedDatabase } from './infrastructure/db/seed-data';
import { VocabRepository } from './infrastructure/db/repositories/VocabRepository';
import { FsrsScheduler } from './core/srs/FsrsScheduler';
import { ContextRotator } from './core/srs/ContextRotator';
import { VocabItem, VocabContextExample, CefrLevel } from './core/types/vocab';
import { SrsCard, FsrsGrade } from './core/types/srs';

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

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

  const scheduler = useMemo(() => new FsrsScheduler(0.9), []);
  const rotator = useMemo(() => new ContextRotator(), []);

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
      <header className="border-b border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-[#131722]/80 backdrop-blur-md sticky top-0 z-50">
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
                Local-First • SLA Science • FSRS v5 • Clean Architecture
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
              Fase 0 & 1 Completadas
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
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* System Architecture Banner */}
        <section className="mb-8 p-6 rounded-2xl bg-white dark:bg-[#131722] border border-gray-200 dark:border-gray-800/80 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                Estado del Motor de Ingeniería
              </span>
              <h2 className="text-xl font-bold mt-1 text-gray-900 dark:text-white">
                Base de Datos SQLite (15 Tablas) & Planificador FSRS v5 Operativos
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 max-w-3xl">
                Se han desplegado los 15 esquemas relacionales con modo WAL, el algoritmo DSR con objetivo
                de retención del 90%, el rotador de contextos clozes y el catálogo semilla optimizado.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1.5 rounded-lg text-xs font-mono bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-indigo-500" />
                SQLite: {dbReady ? '15 Tablas' : 'Iniciando...'}
              </span>
              <span className="px-3 py-1.5 rounded-lg text-xs font-mono bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 flex items-center gap-1.5">
                <Brain className="w-3.5 h-3.5 text-emerald-500" />
                FSRS: DSR v5
              </span>
              <span className="px-3 py-1.5 rounded-lg text-xs font-mono bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-amber-500" />
                Context Rotator: Activo
              </span>
            </div>
          </div>
        </section>

        {/* Two-Column Layout: SRS Active Flashcard + Lexicon Catalog */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: SRS Interactive Workspace (7 Cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                  Sesión Activa FSRS (Spaced Repetition)
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

                {/* Term & IPA */}
                <div className="text-center py-6 border-b border-gray-100 dark:border-gray-800/60">
                  <h2 className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white mb-2">
                    {selectedVocab.word}
                  </h2>
                  <p
                    className="text-lg text-indigo-600 dark:text-indigo-400 font-medium"
                    style={{ fontFamily: 'var(--font-phonetic)' }}
                  >
                    /{selectedVocab.ipaGeneralAmerican}/
                  </p>
                </div>

                {/* Cloze Context Example with Encoding Variability */}
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

          {/* Right Column: Lexicon Catalog Explorer (5 Cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <BookOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                  Catálogo Léxico ({filteredVocab.length})
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

            {/* CEFR Level Filter Pills */}
            <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-xs">
              {(['ALL', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const).map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setSelectedCefr(lvl)}
                  className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                    selectedCefr === lvl
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white dark:bg-[#131722] text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>

            {/* Scrollable Vocab List */}
            <div className="bg-white dark:bg-[#131722] rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden max-h-[480px] overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800/60">
              {filteredVocab.length > 0 ? (
                filteredVocab.map((item) => (
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
                ))
              ) : (
                <div className="p-8 text-center text-xs text-gray-400">
                  No se encontraron términos que coincidan con la búsqueda.
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
