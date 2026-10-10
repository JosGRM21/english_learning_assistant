import { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  BookOpen,
  ArrowRight,
  Layers,
  Zap,
} from 'lucide-react';
import { useSrsSession } from '../hooks/useSrsSession';
import { SrsCardDisplay } from './SrsCardDisplay';
import { SrsSessionComplete } from './SrsSessionComplete';
import { SrsDeckDrawer } from './SrsDeckDrawer';
import { useAudio } from '@/shared/hooks/useAudio';
import { LoadingSpinner } from '@/shared/ui/LoadingSpinner';

export interface SrsReviewSessionProps {
  onNavigateTab?: (tab: string) => void;
}

export function SrsReviewSession({ onNavigateTab }: SrsReviewSessionProps) {
  const { audioService } = useAudio();
  const [isDeckExplorerOpen, setIsDeckExplorerOpen] = useState(false);
  const [cardElapsedSec, setCardElapsedSec] = useState(0);
  const cardStartRef = useRef<number>(Date.now());

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

  // Reset timer whenever currentCard changes
  useEffect(() => {
    cardStartRef.current = Date.now();
    setCardElapsedSec(0);
    const interval = setInterval(() => {
      setCardElapsedSec(Math.round((Date.now() - cardStartRef.current) / 1000));
    }, 500);
    return () => clearInterval(interval);
  }, [currentCard?.card.id]);

  // Global Keyboard Shortcuts (Space, 1..4, R, S, N, Esc)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore keystrokes when typing into form fields
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }

      if (isDeckExplorerOpen || !currentCard || isRating) return;

      if (!showAnswer) {
        // Front face shortcuts
        if (e.code === 'Space' || e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          setShowAnswer(true);
        } else if (e.key === 'r' || e.key === 'R') {
          e.preventDefault();
          if (selectedVocab) {
            audioService.speak(selectedVocab.word, 1.0);
          }
        } else if (e.key === 's' || e.key === 'S') {
          e.preventDefault();
          if (selectedVocab) {
            audioService.speak(selectedVocab.word, 0.75);
          }
        }
      } else {
        // Back face shortcuts
        if (e.key === '1') {
          e.preventDefault();
          handleRate(1);
        } else if (e.key === '2') {
          e.preventDefault();
          handleRate(2);
        } else if (e.key === '3') {
          e.preventDefault();
          handleRate(3);
        } else if (e.key === '4') {
          e.preventDefault();
          handleRate(4);
        } else if (e.key === 'r' || e.key === 'R') {
          e.preventDefault();
          if (selectedVocab) {
            audioService.speak(selectedVocab.word, 1.0);
          }
        } else if (e.key === 's' || e.key === 'S') {
          e.preventDefault();
          if (selectedVocab) {
            audioService.speak(selectedVocab.word, 0.75);
          }
        } else if (e.key === 'n' || e.key === 'N') {
          e.preventDefault();
          handleRotateContext();
        } else if (e.key === 'Escape' || e.key === 'Backspace') {
          e.preventDefault();
          setShowAnswer(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    showAnswer,
    currentCard,
    selectedVocab,
    isRating,
    isDeckExplorerOpen,
    setShowAnswer,
    handleRate,
    handleRotateContext,
    audioService,
  ]);

  // 1. Database still connecting or loading
  if (!isReady) {
    return <LoadingSpinner label="Cargando mazo de repaso..." />;
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
              No tienes tarjetas registradas aún. Registra tus primeras palabras en el Catálogo de Vocabulario para comenzar tus sesiones de repaso inteligente.
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
      {/* Session Progress Header Bar - Modern Minimalist Design */}
      <div className="p-4 px-5 rounded-2xl bg-white/70 dark:bg-[#121622]/70 border border-slate-200/70 dark:border-slate-800/70 backdrop-blur-xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 dark:bg-indigo-400/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                Mazo Ágil de Vocabulario
              </h2>
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 pt-0.5">
                <span>
                  Restantes: <strong className="text-indigo-600 dark:text-indigo-400 font-semibold">{remainingCount}</strong>
                </span>
                <span className="opacity-30">•</span>
                <span>
                  Completadas: <strong className="text-emerald-600 dark:text-emerald-400 font-semibold">{completedCount}</strong>
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Elegant Cadence Timer */}
            <div
              className={`px-2.5 py-1 rounded-full text-xs font-mono font-medium flex items-center gap-1.5 border transition-all ${
                cardElapsedSec <= 5
                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20'
              }`}
              title="Tiempo en la tarjeta actual (cadencia objetivo: 3-5s)"
            >
              <Zap className="w-3 h-3" />
              <span>{cardElapsedSec}s</span>
            </div>

            {/* Deck Explorer Trigger */}
            <button
              type="button"
              onClick={() => setIsDeckExplorerOpen(true)}
              className="px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-100/80 hover:bg-slate-200/70 dark:bg-slate-800/60 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200/60 dark:border-slate-700/60 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-[0.98]"
              title="Abrir explorador de mazo para elegir palabra"
            >
              <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
              <span>Mazo</span>
              <span className="px-1.5 py-0.2 rounded-md bg-slate-200/70 dark:bg-slate-700/70 text-[10px] font-mono font-semibold text-slate-600 dark:text-slate-300">
                {deckCards.length}
              </span>
            </button>
          </div>
        </div>

        {/* Progress Bar with smooth gradient */}
        <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800/80 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 transition-all duration-500 ease-out rounded-full"
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
