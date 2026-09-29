import { useEffect, useState, useMemo } from 'react';
import {
  Sparkles,
  BookOpen,
  CheckCircle2,
  Moon,
  Sun,
  RotateCw,
  Search,
  AlertTriangle,
  ArrowRight,
  Ear,
  PenTool,
  Cpu,
  Volume2,
  Volume1,
  LayoutDashboard,
  Zap,
  BarChart2,
  Settings,
} from 'lucide-react';
import { createTestDatabase } from './infrastructure/db/database';
import { seedDatabase } from './infrastructure/db/seed-data';
import { VocabRepository } from './infrastructure/db/repositories/VocabRepository';
import { FsrsScheduler } from './core/srs/FsrsScheduler';
import { ContextRotator } from './core/srs/ContextRotator';
import { VocabItem, VocabContextExample } from './core/types/vocab';
import { SrsCard, FsrsGrade, ReviewLog } from './core/types/srs';
import { AudioService } from './infrastructure/audio/AudioService';
import { ConnectedSpeechPill } from './components/phonology/ConnectedSpeechPill';
import { MinimalPairsGym } from './components/phonology/MinimalPairsGym';
import { SocraticWritingStudio } from './components/writing/SocraticWritingStudio';
import { QuotaMatrixMonitor } from './components/ai/QuotaMatrixMonitor';
import { OverviewDashboard } from './components/dashboard/OverviewDashboard';
import { WeaknessHeatmap } from './components/diagnostics/WeaknessHeatmap';
import { SpeedDrillArena } from './components/drills/SpeedDrillArena';
import { GradedReaderView } from './components/reader/GradedReaderView';
import { BackupSettingsModal } from './components/settings/BackupSettingsModal';

import { HabitsManager } from './core/habits/HabitsManager';
import { WeaknessEngine } from './core/diagnostics/WeaknessEngine';
import { UserStreak, DailyQuest } from './core/types/habits';
import { WeaknessMetric } from './core/types/diagnostics';
import { OneClickCardPayload } from './core/types/reader';

type AppTab =
  | 'dashboard'
  | 'srs'
  | 'minimal_pairs'
  | 'writing'
  | 'drills'
  | 'reader'
  | 'weaknesses'
  | 'quota_matrix'
  | 'catalog'
  | 'settings';

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const [activeTab, setActiveTab] = useState<AppTab>('dashboard');
  const [vocabList, setVocabList] = useState<VocabItem[]>([]);
  const [selectedVocab, setSelectedVocab] = useState<VocabItem | null>(null);
  const [availableContexts, setAvailableContexts] = useState<VocabContextExample[]>([]);
  const [currentContext, setCurrentContext] = useState<VocabContextExample | null>(null);
  const [srsCard, setSrsCard] = useState<SrsCard | null>(null);
  const [reviewLogs, setReviewLogs] = useState<ReviewLog[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAnswer, setShowAnswer] = useState(false);
  const [reviewCount, setReviewCount] = useState(0);

  // Singletons
  const scheduler = useMemo(() => new FsrsScheduler(0.9), []);
  const rotator = useMemo(() => new ContextRotator(), []);
  const audioService = useMemo(() => new AudioService(), []);
  const habitsManager = useMemo(() => new HabitsManager(), []);
  const weaknessEngine = useMemo(() => new WeaknessEngine(), []);

  // Habits and Streaks state
  const [streak, setStreak] = useState<UserStreak>({
    id: 'streak_local',
    userId: 'user_local',
    currentStreak: 5,
    longestStreak: 12,
    lastActivityDate: new Date().toISOString().split('T')[0],
    availableFreezes: 2,
    updatedAt: new Date().toISOString(),
  });

  const [quests, setQuests] = useState<DailyQuest[]>(() =>
    habitsManager.generateDailyQuests('user_local'),
  );

  // Weaknesses state
  const [weaknesses, setWeaknesses] = useState<WeaknessMetric[]>([
    {
      id: 'wm_01',
      userId: 'user_local',
      errorTaxonomyId: 'err_01',
      taxonomyCode: 'L1_PREP_DEPEND_ON',
      labelEs: 'Uso incorrecto de "depend of" en vez de "depend on"',
      domain: 'GRAMMAR',
      occurrencesLast7Days: 4,
      totalOccurrences: 6,
      weaknessScore: 6.8, // Critical!
      lastDetectedAt: new Date().toISOString(),
      isCritical: true,
    },
    {
      id: 'wm_02',
      userId: 'user_local',
      errorTaxonomyId: 'err_02',
      taxonomyCode: 'L1_SYNTAX_AM_AGREE',
      labelEs: 'Sintaxis no estándar: "I am agree" en vez de "I agree"',
      domain: 'GRAMMAR',
      occurrencesLast7Days: 2,
      totalOccurrences: 5,
      weaknessScore: 4.5,
      lastDetectedAt: new Date().toISOString(),
      isCritical: false,
    },
    {
      id: 'wm_03',
      userId: 'user_local',
      errorTaxonomyId: 'err_03',
      taxonomyCode: 'LEX_FALSE_FRIEND_ACTUALLY',
      labelEs: 'Falso amigo: "actually" (en realidad) vs "currently"',
      domain: 'LEXICON',
      occurrencesLast7Days: 1,
      totalOccurrences: 3,
      weaknessScore: 2.8,
      lastDetectedAt: new Date().toISOString(),
      isCritical: false,
    },
  ]);

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
    const { updatedCard, log } = scheduler.schedule(srsCard, grade, now);
    setSrsCard(updatedCard);
    const fullLog: ReviewLog = {
      id: `rev_${Date.now()}`,
      cardId: srsCard.id,
      reviewedAt: now.toISOString(),
      ...log,
    };
    setReviewLogs((prev) => [...prev, fullLog]);
    setReviewCount((prev) => prev + 1);
    setShowAnswer(false);

    // Audio chime on successful completion
    audioService.playFeedback(grade >= 3);

    // Rotate context on review for next repetition
    handleRotateContext();

    // Update VOCAB_SRS quest progress
    const { quests: updatedQuests } = habitsManager.updateQuestProgress(quests, 'VOCAB_SRS', 1);
    setQuests(updatedQuests);

    // Refresh streak
    const streakResult = habitsManager.updateStreak(streak);
    setStreak(streakResult.streak);
  };

  // 1-Click Flashcard extraction from Graded Reader
  const handleSaveFromReader = async (payload: OneClickCardPayload) => {
    const newItem: VocabItem = {
      id: `voc_extracted_${Date.now()}`,
      word: payload.cleanWord || payload.word,
      grammaticalDimension: 'CONTENT',
      partOfSpeech: 'NOUN',
      definitionEn: `Vocabulary term extracted from reading: "${payload.word}"`,
      translationEs: payload.translationEs || 'Término extraído',
      ipaGeneralAmerican: payload.ipa || 'ˌɛk.strækt',
      cefrLevel: payload.cefrLevel,
      isFalseFriend: false,
      createdAt: new Date().toISOString(),
    };

    const newContext: VocabContextExample = {
      id: `ctx_extracted_${Date.now()}`,
      vocabId: newItem.id,
      sentenceEn: payload.sentenceEn,
      sentenceEs: payload.sentenceEs,
      clozeTarget: payload.word,
      cefrLevel: payload.cefrLevel,
      createdAt: new Date().toISOString(),
    };

    setVocabList((prev) => [newItem, ...prev]);
    setSelectedVocab(newItem);
    setAvailableContexts([newContext]);
    setCurrentContext(newContext);

    setSrsCard({
      id: `card_${newItem.id}`,
      userId: 'user_local',
      targetType: 'VOCAB',
      targetId: newItem.id,
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

  // Handle Micro-Workout completion
  const handleResolveWeakness = (metricId: string) => {
    setWeaknesses((prev) =>
      prev.map((w) => {
        if (w.id === metricId) {
          const newScore = Math.max(0, w.weaknessScore - 2.5);
          return {
            ...w,
            weaknessScore: newScore,
            isCritical: weaknessEngine.isCritical(newScore),
          };
        }
        return w;
      }),
    );

    // Update quest progress
    const { quests: updated } = habitsManager.updateQuestProgress(quests, 'MICRO_WORKOUT', 1);
    setQuests(updated);
  };

  // Filtered vocabulary list
  const filteredVocab = useMemo(() => {
    return vocabList.filter((item) => {
      return (
        item.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.translationEs.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  }, [vocabList, searchQuery]);

  // Preview intervals for FSRS buttons
  const previewIntervals = useMemo(() => {
    if (!srsCard) return { 1: 1, 2: 1, 3: 3, 4: 16 };
    return scheduler.previewIntervals(srsCard);
  }, [srsCard, scheduler]);

  return (
    <div className="min-h-screen bg-[#FBFBF9] dark:bg-[#0B0D13] text-gray-900 dark:text-gray-100 transition-colors duration-300 font-sans">
      {/* Top Header */}
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
                FSRS v5 • Fonología • IA Socrática • Hábitos & Drills • Graded Reader ($i+1$)
              </p>
            </div>
          </div>

          {/* Tab Navigation (Desktop) */}
          <nav className="hidden xl:flex items-center space-x-1 bg-gray-100 dark:bg-gray-800/60 p-1 rounded-2xl border border-gray-200/60 dark:border-gray-700/60">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-white dark:bg-[#131722] text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Inicio</span>
            </button>

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
              <span>Pares Mínimos</span>
            </button>

            <button
              onClick={() => setActiveTab('drills')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'drills'
                  ? 'bg-white dark:bg-[#131722] text-amber-500 shadow-xs'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Speed Drills</span>
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
              onClick={() => setActiveTab('reader')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'reader'
                  ? 'bg-white dark:bg-[#131722] text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Graded Reader ($i+1$)</span>
            </button>

            <button
              onClick={() => setActiveTab('weaknesses')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'weaknesses'
                  ? 'bg-white dark:bg-[#131722] text-rose-600 dark:text-rose-400 shadow-xs'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5" />
              <span>Debilidades</span>
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
              <span>Matriz IA</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'settings'
                  ? 'bg-white dark:bg-[#131722] text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Respaldos</span>
            </button>
          </nav>

          {/* Right Header Status */}
          <div className="flex items-center space-x-3">
            <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
              Fases 0 a 5 Operativas
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

        {/* Scrollable Sub-nav on smaller screens */}
        <div className="xl:hidden flex items-center overflow-x-auto px-4 py-2 border-t border-gray-100 dark:border-gray-800/80 gap-1 text-xs">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium ${
              activeTab === 'dashboard' ? 'bg-indigo-600 text-white' : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            Inicio
          </button>
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
            onClick={() => setActiveTab('drills')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium ${
              activeTab === 'drills' ? 'bg-amber-500 text-white' : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            Speed Drills
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
            onClick={() => setActiveTab('reader')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium ${
              activeTab === 'reader' ? 'bg-blue-600 text-white' : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            Graded Reader
          </button>
          <button
            onClick={() => setActiveTab('weaknesses')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium ${
              activeTab === 'weaknesses' ? 'bg-rose-600 text-white' : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            Debilidades
          </button>
          <button
            onClick={() => setActiveTab('quota_matrix')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium ${
              activeTab === 'quota_matrix' ? 'bg-indigo-600 text-white' : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            Matriz IA
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium ${
              activeTab === 'settings' ? 'bg-indigo-600 text-white' : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            Respaldos
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Tab 0: Overview Dashboard & Habits */}
        {activeTab === 'dashboard' && (
          <OverviewDashboard
            streak={streak}
            quests={quests}
            weaknesses={weaknesses}
            reviewCount={reviewCount}
            onNavigateTab={(tab) => setActiveTab(tab as AppTab)}
            onStartMicroWorkout={() => setActiveTab('weaknesses')}
          />
        )}

        {/* Tab 1: SRS Active Flashcards & Phonology */}
        {activeTab === 'srs' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
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

              {selectedVocab && (
                <div className="bg-white dark:bg-[#131722] rounded-3xl p-8 border border-gray-200 dark:border-gray-800/80 shadow-md relative overflow-hidden">
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

                        <ConnectedSpeechPill
                          sentence={currentContext.sentenceEn}
                          audioService={audioService}
                        />
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 italic">No hay contexto cloze asignado.</p>
                    )}
                  </div>

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

            {/* Right Column: Mini Vocab Selector */}
            <div className="lg:col-span-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <BookOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                    Selección Rápida de Vocabulario
                  </h3>
                </div>
              </div>

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

        {/* Tab 3: Speed Drills */}
        {activeTab === 'drills' && (
          <SpeedDrillArena
            audioService={audioService}
            onDrillCompleted={() => {
              const { quests: updated } = habitsManager.updateQuestProgress(quests, 'SPEED_DRILL', 1);
              setQuests(updated);
            }}
          />
        )}

        {/* Tab 4: Socratic Writing Studio */}
        {activeTab === 'writing' && (
          <SocraticWritingStudio audioService={audioService} />
        )}

        {/* Tab 5: Graded Reader (i+1) */}
        {activeTab === 'reader' && (
          <GradedReaderView
            vocabList={vocabList}
            audioService={audioService}
            onSaveToFlashcards={handleSaveFromReader}
          />
        )}

        {/* Tab 6: Weakness Heatmap & Micro-Workouts */}
        {activeTab === 'weaknesses' && (
          <WeaknessHeatmap
            weaknesses={weaknesses}
            audioService={audioService}
            onWeaknessResolved={handleResolveWeakness}
          />
        )}

        {/* Tab 7: Quota Matrix 2D Monitor */}
        {activeTab === 'quota_matrix' && (
          <QuotaMatrixMonitor />
        )}

        {/* Tab 8: Backup & Settings */}
        {activeTab === 'settings' && (
          <BackupSettingsModal
            userId="user_local"
            cards={srsCard ? [srsCard as unknown as Record<string, unknown>] : []}
            reviewLogs={reviewLogs}
            errors={weaknesses as unknown as Record<string, unknown>[]}
            streak={streak as unknown as Record<string, unknown>}
            quests={quests as unknown as Record<string, unknown>[]}
          />
        )}
      </main>
    </div>
  );
}
