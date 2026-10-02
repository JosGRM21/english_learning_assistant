import { useState } from 'react';
import {
  Sparkles,
  BookOpen,
  ArrowRight,
  Layers,
} from 'lucide-react';
import { useSrsSession } from '../hooks/useSrsSession';
import { SrsCardDisplay } from './SrsCardDisplay';
import { SrsSessionComplete } from './SrsSessionComplete';
import { SrsDeckDrawer } from './SrsDeckDrawer';
import { useAudio } from '@/shared/hooks/useAudio';
import { LoadingSpinner } from '@/shared/ui/LoadingSpinner';
import { useHabitsStore } from '@/features/habits/store/habitsStore';

export interface SrsReviewSessionProps {
  onNavigateTab?: (tab: string) => void;
}

export function SrsReviewSession({ onNavigateTab }: SrsReviewSessionProps) {
  const { audioService } = useAudio();
  const streak = useHabitsStore((s) => s.streak);
  const [isDeckExplorerOpen, setIsDeckExplorerOpen] = useState(false);

  const {
    currentCard,
    selectedVocab,
    availableContexts,
    currentContext,
    srsCard,
    showAnswer,
    deckCards,
    previewIntervals,
    isSessionFinished,
    sessionStats,
    remainingCount,
    completedCount,
    progressPercentage,
    setShowAnswer,
    handleRotateContext,
    handleRate,
    handleSelectCard,
    handleRestartSession,
    handleStartEarlyStudy,
    cooldownCount,
    earliestCooldownDate,
    isRating,
    isReady,
  } = useSrsSession();

  // 1. Database still connecting or loading
  if (!isReady) {
    return <LoadingSpinner label="Conectando con el motor FSRS v5..." />;
  }

  // 2. Empty state: database ready but no flashcards registered yet
  if (deckCards.length === 0) {
    return (
      <div className="space-y-6 max-w-xl mx-auto py-8 animate-in fade-in duration-200">
        <div className="p-10 rounded-3xl bg-white dark:bg-[#121622] border border-gray-200/80 dark:border-gray-800 text-center space-y-4 shadow-sm">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Layers className="w-7 h-7" />
          </div>

          <div className="space-y-1">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              Tu Mazo de Repaso está Vacío
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto leading-relaxed">
              No tienes tarjetas registradas aún. Registra tus primeras palabras en el Catálogo de Vocabulario para activar el algoritmo de repaso espaciado FSRS v5.
            </p>
          </div>

          <div className="pt-2 flex justify-center">
            {onNavigateTab && (
              <button
                type="button"
                onClick={() => onNavigateTab('vocab')}
                className="h-10 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md shadow-indigo-600/20 transition-all cursor-pointer flex items-center gap-2"
              >
                <span>Ir al Catálogo de Vocabulario</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 3. Completed State: All cards in the daily queue finished or no cards due today
  if (isSessionFinished || !currentCard) {
    return (
      <>
        <SrsSessionComplete
          stats={sessionStats}
          streakDays={streak.currentStreak}
          totalDeckCount={deckCards.length}
          cooldownCount={cooldownCount}
          earliestCooldownDate={earliestCooldownDate}
          onRestartSession={handleRestartSession}
          onStartEarlyStudy={handleStartEarlyStudy}
          onNavigateTab={onNavigateTab}
        />

        <SrsDeckDrawer
          isOpen={isDeckExplorerOpen}
          onClose={() => setIsDeckExplorerOpen(false)}
          deckCards={deckCards}
          activeCardId={null}
          onSelectCard={(card) => {
            handleSelectCard(card);
            setIsDeckExplorerOpen(false);
          }}
        />
      </>
    );
  }

  // 4. Active Review Arena
  return (
    <div className="relative max-w-2xl mx-auto space-y-4 py-2 animate-in fade-in duration-200">
      {/* Session Progress Header Bar */}
      <div className="p-3.5 px-5 rounded-2xl bg-white/80 dark:bg-[#121622]/80 border border-gray-200/70 dark:border-gray-800/80 backdrop-blur-md shadow-[0_2px_12px_rgba(0,0,0,0.02)] space-y-2.5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Sparkles className="w-4 h-4" />
            </span>
            <div>
              <h2 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <span>Sesión FSRS & Fonología</span>
              </h2>
              <div className="flex items-center gap-2 text-[11px] text-gray-400 font-mono">
                <span>
                  Restantes: <strong className="text-indigo-600 dark:text-indigo-400 font-sans">{remainingCount}</strong>
                </span>
                <span>•</span>
                <span>
                  Completadas: <strong className="text-emerald-600 dark:text-emerald-400 font-sans">{completedCount}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Deck Explorer Trigger */}
          <button
            type="button"
            onClick={() => setIsDeckExplorerOpen(true)}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700/80 text-gray-700 dark:text-gray-300 border border-gray-200/70 dark:border-gray-700/60 transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Abrir explorador de mazo para elegir palabra"
          >
            <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
            <span>Mazo ({deckCards.length})</span>
          </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-300 rounded-full"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Hero Review Card */}
      {selectedVocab && (
        <SrsCardDisplay
          key={currentCard.card.id}
          selectedVocab={selectedVocab}
          currentContext={currentContext}
          availableContexts={availableContexts}
          srsCard={srsCard}
          showAnswer={showAnswer}
          previewIntervals={previewIntervals}
          onRotateContext={handleRotateContext}
          onShowAnswer={() => setShowAnswer(true)}
          onFlipBack={() => setShowAnswer(false)}
          onRate={handleRate}
          isRating={isRating}
          audioService={audioService}
        />
      )}

      {/* Slide-over Drawer: Deck Explorer */}
      <SrsDeckDrawer
        isOpen={isDeckExplorerOpen}
        onClose={() => setIsDeckExplorerOpen(false)}
        deckCards={deckCards}
        activeCardId={currentCard?.card.id || null}
        onSelectCard={(card) => {
          handleSelectCard(card);
          setIsDeckExplorerOpen(false);
        }}
      />
    </div>
  );
}
