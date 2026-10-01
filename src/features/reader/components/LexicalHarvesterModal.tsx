import { useState } from 'react';
import {
  BookmarkPlus,
  Volume2,
  CheckCircle2,
  X,
  Layers,
  Sparkles,
} from 'lucide-react';
import { OneClickCardPayload } from '@/core/types/reader';
import { CefrLevel } from '@/core/types/vocab';

export interface LexicalHarvesterModalProps {
  word: string;
  cleanWord: string;
  contextSentenceEn: string;
  initialIpa?: string;
  initialTranslationEs?: string;
  cefrLevel?: CefrLevel;
  onClose: () => void;
  onSaveToFlashcards: (payload: OneClickCardPayload) => Promise<void>;
}

export function LexicalHarvesterModal({
  word,
  cleanWord,
  contextSentenceEn,
  initialIpa = 'wɜːrd',
  initialTranslationEs = '',
  cefrLevel = 'B1',
  onClose,
  onSaveToFlashcards,
}: LexicalHarvesterModalProps) {
  const [translationEs, setTranslationEs] = useState(initialTranslationEs);
  const ipa = initialIpa;
  const [chunkType, setChunkType] = useState<'COLLOCATION' | 'PHRASAL_VERB' | 'WORD' | 'IDIOM'>('WORD');
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handlePlayAudio = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(cleanWord);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload: OneClickCardPayload = {
        word,
        cleanWord,
        sentenceEn: contextSentenceEn,
        sentenceEs: translationEs ? `(Contexto) ${translationEs}` : contextSentenceEn,
        cefrLevel,
        ipa,
        translationEs: translationEs || 'Definición contextual',
      };

      await onSaveToFlashcards(payload);
      setSavedSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1400);
    } catch (err) {
      console.error('Error saving extracted card:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white dark:bg-[#131722] rounded-3xl border border-gray-200 dark:border-gray-800 shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200 space-y-6 p-6">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-4">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <BookmarkPlus className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                Ingesta Léxica en 1-Clic hacia FSRS
              </h3>
              <p className="text-xs text-gray-400">
                Captura contextual de vocabulario desde el Graded Reader
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Word Display & Audio */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-50/50 to-blue-50/30 dark:from-indigo-950/30 dark:to-blue-950/20 border border-indigo-100 dark:border-indigo-900/40 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded-lg bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-mono text-xs font-bold">
                {cefrLevel}
              </span>
              <span className="text-xs font-mono text-gray-400 uppercase">
                {chunkType}
              </span>
            </div>
            <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white">
              {cleanWord}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <span
                className="text-sm font-mono text-indigo-600 dark:text-indigo-400"
                style={{ fontFamily: 'var(--font-phonetic)' }}
              >
                /{ipa}/
              </span>
            </div>
          </div>

          <button
            onClick={handlePlayAudio}
            className="p-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
            title="Escuchar pronunciación"
          >
            <Volume2 className="w-5 h-5" />
          </button>
        </div>

        {/* Chunk Taxonomy Type Selector */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-indigo-500" />
            <span>Categoría de Chunk (Lewis Lexical Approach):</span>
          </label>
          <div className="grid grid-cols-4 gap-2">
            {(['WORD', 'COLLOCATION', 'PHRASAL_VERB', 'IDIOM'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setChunkType(type)}
                className={`py-2 px-1 rounded-xl text-center text-[10px] font-bold font-mono transition-all cursor-pointer ${
                  chunkType === type
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200'
                }`}
              >
                {type.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Translation / Definition Input */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Traducción / Significado en Español:
          </label>
          <input
            type="text"
            value={translationEs}
            onChange={(e) => setTranslationEs(e.target.value)}
            placeholder="Escribe la traducción o glosa..."
            className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#181E2B] text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Context Sentence Preview */}
        <div className="p-4 rounded-2xl bg-gray-50 dark:bg-[#161B26] border border-gray-200 dark:border-gray-800 space-y-1">
          <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
            Contexto Cloze Extraído de la Lectura:
          </span>
          <p className="text-xs font-serif italic text-gray-800 dark:text-gray-200 leading-relaxed">
            "{contextSentenceEn}"
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between gap-3 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 text-xs font-semibold hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
          >
            Cancelar
          </button>

          {!savedSuccess ? (
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isSaving ? 'Guardando en FSRS...' : 'Añadir a Repaso FSRS (1-Clic)'}</span>
            </button>
          ) : (
            <div className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold text-xs border border-emerald-300 dark:border-emerald-800 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>¡Tarjeta creada en estado NEW!</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
