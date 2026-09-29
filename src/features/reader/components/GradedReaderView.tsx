import {
  BookOpen,
  Volume2,
  BookmarkPlus,
  CheckCircle2,
  Info,
  Clock,
} from 'lucide-react';
import { OneClickCardPayload } from '@/core/types/reader';
import { VocabItem } from '@/core/types/vocab';
import { AudioService } from '@/infrastructure/audio/AudioService';
import { useGradedReader } from '../hooks/useGradedReader';
import { useAudio } from '@/shared/hooks/useAudio';

import { useSrsStore } from '@/features/srs/store/srsStore';
import { MathText } from '@/shared/ui/MathText';

export interface GradedReaderViewProps {
  vocabList?: VocabItem[];
  audioService?: AudioService;
  onSaveToFlashcards?: (payload: OneClickCardPayload) => Promise<void>;
}

export function GradedReaderView({
  vocabList: propVocabList,
  audioService: audioProp,
  onSaveToFlashcards: propOnSave,
}: GradedReaderViewProps) {
  const storeVocabList = useSrsStore((s) => s.vocabList);
  const storeAddExtracted = useSrsStore((s) => s.addExtractedCard);

  const vocabList = propVocabList ?? storeVocabList;
  const onSaveToFlashcards =
    propOnSave ??
    (async (payload: OneClickCardPayload) => {
      storeAddExtracted(payload);
    });

  const { audioService: defaultAudio } = useAudio();
  const audioService = audioProp ?? defaultAudio;

  const {
    selectedArticle,
    selectedCefr,
    activeToken,
    activeSentence,
    savedSuccess,
    isSaving,
    filteredArticles,
    segments,
    setSelectedArticle,
    setSelectedCefr,
    handleTokenClick,
    handleSaveCard,
    setActiveToken,
  } = useGradedReader(vocabList, onSaveToFlashcards);

  return (
    <div className="space-y-6">
      {/* Header & CEFR Filter */}
      <div className="bg-white dark:bg-[#131722] rounded-3xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <BookOpen className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                <MathText text="Lector Inteligente Graduado ($i+1$ Smart Graded Reader)" />
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Lecturas graduadas con tipografía editorial. Las palabras de tu catálogo aparecen
                resaltadas para favorecer el efecto *Noticing* y la extracción a flashcards en 1-clic.
              </p>
            </div>
          </div>
        </div>

        {/* CEFR Level filter pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {(['ALL', 'A1', 'A2', 'B1', 'B2'] as const).map((lvl) => (
            <button
              key={lvl}
              onClick={() => setSelectedCefr(lvl)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                selectedCefr === lvl
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {lvl === 'ALL' ? 'Todos los Niveles' : `Nivel ${lvl}`}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Articles Browser (4 Cols) + Reader Canvas (8 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Article Selector List */}
        <div className="lg:col-span-4 space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-gray-400 px-1">
            Artículos Disponibles ({filteredArticles.length})
          </div>

          <div className="space-y-2 max-h-[580px] overflow-y-auto">
            {filteredArticles.map((art) => (
              <div
                key={art.id}
                onClick={() => {
                  setSelectedArticle(art);
                  setActiveToken(null);
                }}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  selectedArticle.id === art.id
                    ? 'bg-blue-50/70 dark:bg-blue-950/30 border-blue-300 dark:border-blue-800/80 shadow-xs'
                    : 'bg-white dark:bg-[#131722] border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/40'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300">
                    {art.cefrLevel}
                  </span>
                  <span className="text-[10px] text-gray-400 font-mono flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {art.totalWords} palabras
                  </span>
                </div>

                <h4 className="text-sm font-bold text-gray-900 dark:text-white line-clamp-1">
                  {art.title}
                </h4>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 line-clamp-2 leading-relaxed">
                  {art.contentText.slice(0, 110)}...
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Editorial Reading Canvas */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white dark:bg-[#131722] rounded-3xl p-8 border border-gray-200 dark:border-gray-800 shadow-md space-y-6">
            {/* Article Meta */}
            <div className="border-b border-gray-100 dark:border-gray-800 pb-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                  {selectedArticle.topic}
                </span>
                <span className="text-xs text-gray-400">•</span>
                <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
                  Nivel {selectedArticle.cefrLevel}
                </span>
              </div>
              <h2 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white">
                {selectedArticle.title}
              </h2>
            </div>

            {/* Reading Content with Interactive Noticing Tokens */}
            <div className="prose dark:prose-invert max-w-none">
              <p
                className="text-lg leading-loose text-gray-800 dark:text-gray-200 tracking-normal"
                style={{ fontFamily: 'var(--font-editorial)' }}
              >
                {segments.map((seg, sIdx) => (
                  <span key={sIdx} className="mr-1">
                    {seg.tokens.map((token, tIdx) => {
                      if (token.isPunctuation) {
                        return <span key={tIdx}>{token.originalText} </span>;
                      }

                      const isSelected = activeToken?.cleanWord === token.cleanWord;

                      return (
                        <span
                          key={tIdx}
                          onClick={() => handleTokenClick(token, seg.sentenceEn)}
                          className={`cursor-pointer transition-all rounded-sm px-0.5 inline-block ${
                            isSelected
                              ? 'bg-blue-500 text-white font-semibold'
                              : token.isTargetVocab
                                ? 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border-b-2 border-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900 font-medium'
                                : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                          }`}
                          title={
                            token.isTargetVocab
                              ? `Término activo en catálogo: ${token.translationEs}`
                              : 'Click para pronunciación y glosa'
                          }
                        >
                          {token.originalText}
                        </span>
                      );
                    })}
                  </span>
                ))}
              </p>
            </div>

            {/* Helper Notice */}
            <div className="flex items-center gap-1.5 text-xs text-gray-400 pt-2 border-t border-gray-100 dark:border-gray-800">
              <Info className="w-3.5 h-3.5 text-blue-500 shrink-0" />
              <span>
                Las palabras subrayadas en azul corresponden a términos en tu catálogo activo de estudio.
                Haz clic en cualquier palabra para escucharla y extraerla a flashcards en 1-clic.
              </span>
            </div>
          </div>

          {/* Active Word Gloss & 1-Click Card Drawer */}
          {activeToken && (
            <div className="p-6 rounded-3xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 shadow-md animate-in fade-in duration-200 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => audioService.speak(activeToken.cleanWord, 1.0)}
                    className="p-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors cursor-pointer"
                    title="Reproducir audio"
                  >
                    <Volume2 className="w-5 h-5" />
                  </button>

                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        {activeToken.originalText}
                      </h3>
                      {activeToken.ipa && (
                        <span
                          className="text-sm font-mono text-blue-600 dark:text-blue-400"
                          style={{ fontFamily: 'var(--font-phonetic)' }}
                        >
                          /{activeToken.ipa}/
                        </span>
                      )}
                    </div>

                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                      {activeToken.translationEs ?? 'Palabra contextual en lectura'}
                    </p>
                  </div>
                </div>

                {/* 1-Click Save button */}
                <div className="flex items-center gap-2">
                  {!savedSuccess ? (
                    <button
                      onClick={handleSaveCard}
                      disabled={isSaving}
                      className="px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md shadow-indigo-600/20 transition-all cursor-pointer flex items-center gap-2"
                    >
                      <BookmarkPlus className="w-4 h-4" />
                      <span>{isSaving ? 'Guardando...' : 'Guardar en Flashcards en 1-Clic'}</span>
                    </button>
                  ) : (
                    <span className="px-4 py-2.5 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold text-xs flex items-center gap-1.5 border border-emerald-300 dark:border-emerald-800 animate-in fade-in">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>¡Añadida al mazo FSRS con contexto!</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Context Sentence Preview */}
              <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-[#131722]/80 border border-blue-100 dark:border-blue-900/40 text-xs">
                <span className="text-gray-400 uppercase font-bold text-[10px] block mb-0.5">
                  Contexto cloze auto-extraído:
                </span>
                <p className="font-editorial text-sm italic text-gray-800 dark:text-gray-200">
                  "{activeSentence}"
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
