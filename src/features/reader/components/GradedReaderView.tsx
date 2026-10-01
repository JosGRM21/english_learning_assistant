import { useState, useMemo } from 'react';
import {
  BookOpen,
  Volume2,
  BookmarkPlus,
  CheckCircle2,
  Info,
  Clock,
  Ear,
  RotateCcw,
  Layers,
  Wand2,
} from 'lucide-react';
import { OneClickCardPayload, AnnotatedToken } from '@/core/types/reader';
import { VocabItem } from '@/core/types/vocab';
import { AudioService } from '@/infrastructure/audio/AudioService';
import { useGradedReader } from '../hooks/useGradedReader';
import { useAudio } from '@/shared/hooks/useAudio';
import { useSrsStore } from '@/features/srs/store/srsStore';
import { lexicalCoverageProfiler } from '@/core/domain/reader/services/LexicalCoverageProfiler';
import { BottomUpPlayer } from './BottomUpPlayer';
import { LexicalHarvesterModal } from './LexicalHarvesterModal';

import { useDatabase } from '@/shared/hooks/useDatabase';

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
  const { vocabRepo, cardRepo } = useDatabase();
  const storeVocabList = useSrsStore((s) => s.vocabList);
  const storeAddExtracted = useSrsStore((s) => s.addExtractedCard);

  const vocabList = propVocabList ?? storeVocabList;
  const onSaveToFlashcards =
    propOnSave ??
    (async (payload: OneClickCardPayload) => {
      storeAddExtracted(payload);

      if (vocabRepo && cardRepo) {
        try {
          const vocabId = `voc_extracted_${Date.now()}`;
          const cleanWord = payload.cleanWord || payload.word;
          await vocabRepo.createVocab({
            id: vocabId,
            word: cleanWord,
            grammaticalDimension: 'CONTENT',
            partOfSpeech: 'NOUN',
            definitionEn: `Vocabulary term extracted from reading: "${payload.word}"`,
            translationEs: payload.translationEs || 'Término extraído',
            ipaGeneralAmerican: payload.ipa || '',
            cefrLevel: payload.cefrLevel,
            isFalseFriend: false,
          });

          if (payload.sentenceEn) {
            await vocabRepo.addContextExample({
              vocabId,
              sentenceEn: payload.sentenceEn,
              sentenceEs: payload.sentenceEs || '',
              clozeTarget: payload.word,
              cefrLevel: payload.cefrLevel,
            });
          }

          await cardRepo.createCard({
            id: `card_${vocabId}`,
            userId: 'user_local',
            targetType: 'VOCAB',
            targetId: vocabId,
            state: 'NEW',
            stability: 0,
            difficulty: 5.0,
            reps: 0,
            lapses: 0,
            lastReviewedAt: null,
            scheduledFor: new Date().toISOString(),
          });
        } catch (err) {
          console.error('[GradedReaderView] Failed to persist extracted card to DB:', err);
        }
      }
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

  const [readerMode, setReaderMode] = useState<'READING' | 'BOTTOM_UP'>('READING');
  const [activeSentenceIndex, setActiveSentenceIndex] = useState(0);
  const [isHarvesterOpen, setIsHarvesterOpen] = useState(false);
  const [harvesterToken, setHarvesterToken] = useState<AnnotatedToken | null>(null);
  const [isSimplified, setIsSimplified] = useState(false);
  const [simplifiedArticleContent, setSimplifiedArticleContent] = useState<string | null>(null);

  // Analyze Lexical Coverage Ratio (Paul Nation formula)
  const currentContent = isSimplified && simplifiedArticleContent
    ? simplifiedArticleContent
    : selectedArticle.contentText;

  const coverage = useMemo(() => {
    return lexicalCoverageProfiler.analyzeCoverage(currentContent, vocabList);
  }, [currentContent, vocabList]);

  // Extract sentences for Bottom-Up listening
  const sentences = useMemo(() => {
    return selectedArticle.contentText
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 5);
  }, [selectedArticle]);

  const currentBottomUpSentence = sentences[activeSentenceIndex] || sentences[0] || '';

  const handleSimplifyArticle = () => {
    const result = lexicalCoverageProfiler.simplifyText(selectedArticle.contentText);
    setSimplifiedArticleContent(result.simplifiedText);
    setIsSimplified(true);
  };

  const handleRestoreOriginal = () => {
    setIsSimplified(false);
    setSimplifiedArticleContent(null);
  };

  const handleOpenHarvester = (token: AnnotatedToken) => {
    setHarvesterToken(token);
    setIsHarvesterOpen(true);
  };

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
                Lectura Graduada
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Lecturas adaptadas por nivel con análisis de vocabulario en contexto y práctica de comprensión auditiva.
              </p>
            </div>
          </div>
        </div>

        {/* Mode Switcher & Level Filter */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Reader Mode Tabs */}
          <div className="flex items-center p-1 bg-gray-100 dark:bg-gray-800 rounded-2xl">
            <button
              onClick={() => setReaderMode('READING')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                readerMode === 'READING'
                  ? 'bg-white dark:bg-[#1C2230] text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Lectura Guiada</span>
            </button>
            <button
              onClick={() => setReaderMode('BOTTOM_UP')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                readerMode === 'BOTTOM_UP'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Ear className="w-3.5 h-3.5" />
              <span>Comprensión Auditiva</span>
            </button>
          </div>

          {/* CEFR Level filter pills */}
          <div className="flex items-center gap-1">
            {(['ALL', 'A1', 'A2', 'B1', 'B2'] as const).map((lvl) => (
              <button
                key={lvl}
                onClick={() => setSelectedCefr(lvl)}
                className={`px-2.5 py-1 rounded-xl text-xs font-mono font-semibold transition-colors cursor-pointer ${
                  selectedCefr === lvl
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Lexical Coverage Gauge Banner (Paul Nation) */}
      <div className="p-4 rounded-3xl bg-white dark:bg-[#131722] border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {/* Circular / Badge Metric */}
          <div
            className={`px-4 py-2 rounded-2xl border text-center font-mono ${
              coverage.band === 'OPTIMAL'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                : coverage.band === 'ASSISTED'
                  ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-300'
                  : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300'
            }`}
          >
            <span className="text-[10px] uppercase font-bold block">Cobertura</span>
            <span className="text-xl font-extrabold">{coverage.coveragePercentage}%</span>
          </div>

          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-800 dark:text-gray-200">
                {coverage.band === 'OPTIMAL'
                  ? 'Nivel de Lectura Extensiva Óptima (≥ 98%)'
                  : coverage.band === 'ASSISTED'
                    ? 'Nivel de Lectura Asistida con Andamiaje (95% - 97%)'
                    : 'Alerta de Sobrecarga Léxica (< 95%)'}
              </span>
              <span className="text-xs text-gray-400 font-mono">
                ({coverage.knownWordsCount} conocidas / {coverage.effectiveWords} efectivas)
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {coverage.pedagogicalAdviceEs}
            </p>
          </div>
        </div>

        {/* Text Simplifier Action */}
        <div className="flex items-center gap-2 shrink-0">
          {!isSimplified ? (
            <button
              onClick={handleSimplifyArticle}
              className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-300 text-xs font-bold hover:bg-indigo-100 transition-all cursor-pointer"
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span>Simplificar Vocabulario a 95%+</span>
            </button>
          ) : (
            <button
              onClick={handleRestoreOriginal}
              className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-bold hover:bg-gray-200 transition-all cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restaurar Texto Original</span>
            </button>
          )}
        </div>
      </div>

      {/* --- MODE 1: LECTURA & NOTICING CANVAS --- */}
      {readerMode === 'READING' && (
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
                    setIsSimplified(false);
                    setSimplifiedArticleContent(null);
                    setActiveSentenceIndex(0);
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
                  {isSimplified && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-mono text-[10px] font-bold">
                      Versión Simplificada Dinámica
                    </span>
                  )}
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

                  {/* 1-Click Save button & Advanced Harvest */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenHarvester(activeToken)}
                      className="px-3.5 py-2.5 rounded-2xl border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-[#151A26] text-indigo-600 dark:text-indigo-300 text-xs font-bold hover:bg-indigo-50 transition-all cursor-pointer"
                      title="Abrir editor completo de extracción léxica"
                    >
                      <Layers className="w-3.5 h-3.5" />
                    </button>

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
      )}

      {/* --- MODE 2: DECODIFICACIÓN AUDITIVA BOTTOM-UP --- */}
      {readerMode === 'BOTTOM_UP' && (
        <div className="space-y-6">
          <BottomUpPlayer
            sentence={currentBottomUpSentence}
            sentenceIndex={activeSentenceIndex}
            totalSentences={sentences.length}
            onSelectWord={(word) => {
              const matched = segments
                .flatMap((s) => s.tokens)
                .find((t) => t.cleanWord.toLowerCase() === word.toLowerCase());
              if (matched) {
                handleTokenClick(matched, currentBottomUpSentence);
              }
            }}
            onNextSentence={() =>
              setActiveSentenceIndex((prev) => Math.min(sentences.length - 1, prev + 1))
            }
            onPrevSentence={() =>
              setActiveSentenceIndex((prev) => Math.max(0, prev - 1))
            }
          />
        </div>
      )}

      {/* Lexical Harvester Modal */}
      {isHarvesterOpen && harvesterToken && (
        <LexicalHarvesterModal
          word={harvesterToken.originalText}
          cleanWord={harvesterToken.cleanWord}
          contextSentenceEn={activeSentence || selectedArticle.contentText.slice(0, 100)}
          initialIpa={harvesterToken.ipa}
          initialTranslationEs={harvesterToken.translationEs}
          cefrLevel={selectedArticle.cefrLevel}
          onClose={() => setIsHarvesterOpen(false)}
          onSaveToFlashcards={onSaveToFlashcards}
        />
      )}
    </div>
  );
}
