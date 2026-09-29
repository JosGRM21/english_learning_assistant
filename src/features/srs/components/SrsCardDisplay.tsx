import {
  AlertTriangle,
  Volume2,
  Volume1,
  RotateCw,
  ArrowRight,
} from 'lucide-react';
import { VocabItem, VocabContextExample } from '@/core/types/vocab';
import { SrsCard, FsrsGrade } from '@/core/types/srs';
import { ConnectedSpeechPill } from '@/features/phonology/components/ConnectedSpeechPill';
import { useAudio } from '@/shared/hooks/useAudio';
import { AudioService } from '@/infrastructure/audio/AudioService';

export interface SrsCardDisplayProps {
  selectedVocab: VocabItem;
  currentContext: VocabContextExample | null;
  availableContexts: VocabContextExample[];
  srsCard: SrsCard | null;
  showAnswer: boolean;
  previewIntervals: Record<number, number>;
  onRotateContext: () => void;
  onShowAnswer: () => void;
  onRate: (grade: FsrsGrade) => void;
  audioService?: AudioService;
}

export function SrsCardDisplay({
  selectedVocab,
  currentContext,
  availableContexts,
  srsCard,
  showAnswer,
  previewIntervals,
  onRotateContext,
  onShowAnswer,
  onRate,
  audioService: audioProp,
}: SrsCardDisplayProps) {
  const { audioService: defaultAudio } = useAudio();
  const audioService = audioProp ?? defaultAudio;

  return (
    <div className="bg-white dark:bg-[#131722] rounded-3xl p-8 border border-gray-200 dark:border-gray-800/80 shadow-md relative overflow-hidden">
      {/* Header Info */}
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

      {/* Main Word & Pronunciation */}
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

      {/* Dynamic Context Example */}
      <div className="py-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Contexto Dinámico Rotativo ({availableContexts.length} disponibles)
          </span>
          {availableContexts.length > 1 && (
            <button
              onClick={onRotateContext}
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

      {/* Answer & Rating buttons */}
      {!showAnswer ? (
        <button
          onClick={onShowAnswer}
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
                onClick={() => onRate(1)}
                className="py-3 px-2 rounded-xl bg-rose-100 hover:bg-rose-200 dark:bg-rose-950/50 dark:hover:bg-rose-900/60 text-rose-800 dark:text-rose-200 border border-rose-200 dark:border-rose-900 transition-colors text-center cursor-pointer"
              >
                <div className="font-bold text-sm">Again (1)</div>
                <div className="text-[11px] font-mono mt-0.5 opacity-80">
                  {previewIntervals[1]}d
                </div>
              </button>

              <button
                onClick={() => onRate(2)}
                className="py-3 px-2 rounded-xl bg-amber-100 hover:bg-amber-200 dark:bg-amber-950/50 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-900 transition-colors text-center cursor-pointer"
              >
                <div className="font-bold text-sm">Hard (2)</div>
                <div className="text-[11px] font-mono mt-0.5 opacity-80">
                  {previewIntervals[2]}d
                </div>
              </button>

              <button
                onClick={() => onRate(3)}
                className="py-3 px-2 rounded-xl bg-blue-100 hover:bg-blue-200 dark:bg-blue-950/50 dark:hover:bg-blue-900/60 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-900 transition-colors text-center cursor-pointer"
              >
                <div className="font-bold text-sm">Good (3)</div>
                <div className="text-[11px] font-mono mt-0.5 opacity-80">
                  {previewIntervals[3]}d
                </div>
              </button>

              <button
                onClick={() => onRate(4)}
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
  );
}
