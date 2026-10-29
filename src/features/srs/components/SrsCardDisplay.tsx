import { useState } from 'react';
import {
  AlertTriangle,
  Volume2,
  Volume1,
  RotateCw,
  Repeat,
  Lightbulb,
} from 'lucide-react';
import {
  Disclosure,
  DisclosureTrigger,
  DisclosureContent,
  DisclosureBody,
} from '@heroui/react';
import {
  VocabItem,
  VocabContextExample,
  PART_OF_SPEECH_LABELS_ES,
  PHRASAL_VERB_TYPE_LABELS_ES,
} from '@/core/types/vocab';
import { SrsCard, FsrsGrade, CardWithTarget } from '@/core/types/srs';
import { useAudio } from '@/shared/hooks/useAudio';
import { AudioService, getVoiceForAccent } from '@/infrastructure/audio/AudioService';
import { SrsCardBack } from './SrsCardBack';

export interface SrsCardDisplayProps {
  cardWithTarget?: CardWithTarget | null;
  selectedVocab: VocabItem;
  currentContext: VocabContextExample | null;
  availableContexts: VocabContextExample[];
  srsCard: SrsCard | null;
  showAnswer: boolean;
  previewIntervals: Record<number, number>;
  onRotateContext: () => void;
  onShowAnswer: () => void;
  onFlipBack?: () => void;
  onRate: (grade: FsrsGrade) => void;
  isRating?: boolean;
  audioService?: AudioService;
}

export function SrsCardDisplay({
  cardWithTarget,
  selectedVocab,
  currentContext,
  availableContexts,
  srsCard,
  showAnswer,
  previewIntervals,
  onRotateContext,
  onShowAnswer,
  onFlipBack,
  onRate,
  isRating = false,
  audioService: audioProp,
}: SrsCardDisplayProps) {
  const { audioService: defaultAudio } = useAudio();
  const audioService = audioProp ?? defaultAudio;
  const [showHint, setShowHint] = useState(false);
  const [accent, setAccent] = useState<'US' | 'UK'>('US');

  const evaluatedSense =
    cardWithTarget?.currentSense ||
    selectedVocab.sensesJson?.[cardWithTarget?.currentSenseIndex ?? 0] ||
    selectedVocab.sensesJson?.[0];

  const totalSenses =
    selectedVocab.sensesJson && selectedVocab.sensesJson.length > 0
      ? selectedVocab.sensesJson.length
      : (selectedVocab.alternateSensesJson?.length ?? 0) + 1;
  const senseIndex = cardWithTarget?.currentSenseIndex ?? 0;
  const isPhrasal = Boolean(
    cardWithTarget?.phrase ||
    selectedVocab.subcategory === 'PHRASAL_VERB' ||
    selectedVocab.grammaticalDimension === 'CHUNK' ||
    selectedVocab.domainCategory === 'Phrasal Verb'
  );

  const partOfSpeechEs =
    PART_OF_SPEECH_LABELS_ES[evaluatedSense?.partOfSpeech || selectedVocab.partOfSpeech] ??
    selectedVocab.partOfSpeech;

  const activeVoice = getVoiceForAccent(accent);

  const activeIpa =
    accent === 'UK' && selectedVocab.ipaReceivedPronunciation
      ? selectedVocab.ipaReceivedPronunciation
      : selectedVocab.ipaGeneralAmerican || cardWithTarget?.phrase?.ipaGeneralAmerican;

  const playWordAudio = (rate: number) => {
    audioService.speak(selectedVocab.word, rate, activeVoice);
  };

  const renderClozeSentence = (sentence: string, targetWord: string, clozeTarget?: string) => {
    const target = (clozeTarget && clozeTarget.trim()) || targetWord.trim();
    if (!target) return sentence;

    const escaped = target.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b(${escaped})\\b`, 'gi');

    if (regex.test(sentence)) {
      const parts = sentence.split(regex);
      return (
        <>
          {parts.map((part, i) =>
            part.toLowerCase() === target.toLowerCase() ? (
              <span
                key={i}
                className="inline-block px-2 py-0.5 mx-1 rounded-md bg-indigo-100/90 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 font-bold not-italic border border-indigo-200/60 dark:border-indigo-800/60 tracking-wider text-xs"
              >
                [ ... ]
              </span>
            ) : (
              part
            )
          )}
        </>
      );
    }

    const fallbackRegex = new RegExp(escaped, 'gi');
    if (fallbackRegex.test(sentence)) {
      const parts = sentence.split(fallbackRegex);
      return (
        <>
          {parts.map((part, i) =>
            i < parts.length - 1 ? (
              <span key={i}>
                {part}
                <span className="inline-block px-2 py-0.5 mx-1 rounded-md bg-indigo-100/90 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 font-bold not-italic border border-indigo-200/60 dark:border-indigo-800/60 tracking-wider text-xs">
                  [ ... ]
                </span>
              </span>
            ) : (
              part
            )
          )}
        </>
      );
    }

    return sentence;
  };

  return (
    <div className="perspective-1000 w-full min-h-[610px]">
      <div
        className={`relative w-full min-h-[610px] transition-transform duration-500 transform-style-3d ${
          showAnswer ? 'rotate-y-180' : ''
        }`}
      >
        {/* ============================================================ */}
        {/* FRONT FACE (ANVERSO - ESTÍMULO DE ACTIVE RECALL ÁGIL)        */}
        {/* ============================================================ */}
        <div className="backface-hidden w-full min-h-[610px] bg-white dark:bg-[#131722] rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] flex flex-col justify-between select-none">
          {/* 1. TOP BAR: Metadatos (Nivel, Categoría, Ámbito) & Selector de Acento */}
          <div className="flex-shrink-0 flex items-center justify-between gap-3 flex-wrap border-b border-slate-100 dark:border-slate-800/60 pb-3.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/80 tracking-tight">
                Nivel {evaluatedSense?.cefrLevel || selectedVocab.cefrLevel}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100/70 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700/60">
                {partOfSpeechEs}
              </span>
              {totalSenses > 1 && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-200/60 dark:border-sky-800/60">
                  Acepción {senseIndex + 1} de {totalSenses}
                </span>
              )}
              {isPhrasal && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50/60 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/50">
                  {cardWithTarget?.phrase?.phrasalVerbType
                    ? PHRASAL_VERB_TYPE_LABELS_ES[cardWithTarget.phrase.phrasalVerbType] || 'Phrasal Verb'
                    : 'Phrasal Verb'}
                </span>
              )}
              {selectedVocab.domainCategory &&
                selectedVocab.domainCategory !== 'Uso General' &&
                selectedVocab.domainCategory !== 'Phrasal Verb' && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-50/50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 border border-purple-200/50 dark:border-purple-800/50">
                    {selectedVocab.domainCategory}
                  </span>
                )}
              {(selectedVocab.phoneticEdEnding || selectedVocab.verbTensesJson?.edPhoneticEnding) && (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-medium text-slate-500 dark:text-slate-400 bg-slate-100/60 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50">
                  -ed: {selectedVocab.phoneticEdEnding || selectedVocab.verbTensesJson?.edPhoneticEnding}
                </span>
              )}
              {selectedVocab.ipaWeakForm && (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-medium text-slate-600 dark:text-slate-400 bg-slate-100/60 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50">
                  débil: /{selectedVocab.ipaWeakForm}/
                </span>
              )}
              {selectedVocab.isFalseFriend && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                  <span>Falso Amigo</span>
                </span>
              )}
            </div>

            {/* Accent switcher: Segmented Control tipográfico limpio (Sin emojis de bandera para Windows) */}
            <div className="inline-flex items-center p-0.5 rounded-xl bg-slate-100/90 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setAccent('US')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  accent === 'US'
                    ? 'bg-white dark:bg-[#161B28] text-indigo-600 dark:text-indigo-400 font-bold shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
                title="Acento General American (US)"
                aria-label="Acento General American"
              >
                US
              </button>
              <button
                type="button"
                onClick={() => setAccent('UK')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  accent === 'UK'
                    ? 'bg-white dark:bg-[#161B28] text-indigo-600 dark:text-indigo-400 font-bold shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
                title="Acento Received Pronunciation (UK)"
                aria-label="Acento Received Pronunciation"
              >
                UK
              </button>
            </div>
          </div>

          {/* Leech Callout Banner (RF-SRS-CORE-09) */}
          {srsCard?.isLeech && (
            <div className="mt-3 p-4 rounded-2xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 text-left space-y-2 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-amber-800 dark:text-amber-200 font-semibold text-xs">
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>Tarjeta Sangijuela (Leech) — {srsCard.consecutiveLapses || srsCard.lapses} fallos acumulados</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 font-medium">
                  Atención Pedagógica
                </span>
              </div>
              <p className="text-xs text-amber-700/90 dark:text-amber-300/80 leading-relaxed">
                Palabra con dificultad recurrente. Te sugerimos explorar un nuevo ejemplo contextual.
              </p>
              <div className="flex items-center gap-2 pt-1">
                {availableContexts.length > 1 && (
                  <button
                    type="button"
                    onClick={onRotateContext}
                    className="px-3 py-1.5 rounded-xl text-xs font-medium bg-white dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 border border-amber-300/80 dark:border-amber-700/80 hover:bg-amber-50 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                    <span>Nueva Oración Mnemónica</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowHint(true)}
                  className="px-3 py-1.5 rounded-xl text-xs font-medium bg-amber-600 hover:bg-amber-700 text-white transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Lightbulb className="w-3.5 h-3.5" />
                  <span>Ver Pista Ahora</span>
                </button>
              </div>
            </div>
          )}

          {/* 2. BODY: Estímulo Principal (Centrado armónico sin espacios muertos) */}
          <div className="flex-1 flex flex-col justify-center items-center py-6 text-center space-y-3.5">
            <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white select-text">
              {selectedVocab.word}
            </h2>

            {activeIpa && (
              <div className="flex items-center justify-center gap-2">
                <span
                  className="text-lg text-indigo-600 dark:text-indigo-400 font-phonetic font-medium tracking-wide"
                  style={{ fontFamily: 'var(--font-phonetic)' }}
                >
                  /{activeIpa}/
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-semibold border border-slate-200/50 dark:border-slate-700/50">
                  {accent}
                </span>
              </div>
            )}

            {/* Contextual Disambiguation Hint (RF-SRS-04, RF-VOC-03) */}
            {(() => {
              const hint = evaluatedSense?.contextualHint;

              if (!hint) return null;

              // Pedagogy filter: do NOT show trivial/spoiler hints for single-sense function words (e.g. "the", "he", "it")
              // or monosemic basic words without polysemy/disambiguation need
              const isFunctionWord =
                selectedVocab.grammaticalDimension === 'FUNCTION' ||
                ['ARTICLE_DETERMINER', 'PRONOUN', 'CONJUNCTION', 'PREPOSITION'].includes(selectedVocab.partOfSpeech);

              const isTrivialMonoseme =
                totalSenses <= 1 &&
                !isPhrasal &&
                (isFunctionWord || selectedVocab.domainCategory === 'Uso General');

              if (isTrivialMonoseme) return null;

              return (
                <div className="flex items-center justify-center pt-0.5 flex-wrap gap-2">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100/90 dark:bg-slate-800/70 border border-slate-200/60 dark:border-slate-700/60 text-xs">
                    <span className="text-slate-500 dark:text-slate-400 font-semibold">Pista:</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {hint}
                    </span>
                  </div>
                </div>
              );
            })()}

            {/* Audio Controls con teclas rápidas R y S */}
            <div className="flex items-center justify-center gap-2.5 pt-1.5">
              <button
                type="button"
                onClick={() => playWordAudio(1.0)}
                className="group inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-medium bg-slate-100/80 hover:bg-indigo-50/80 dark:bg-slate-800/70 dark:hover:bg-indigo-950/40 text-slate-700 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-400 border border-slate-200/60 dark:border-slate-700/60 hover:border-indigo-200 dark:hover:border-indigo-800 transition-all cursor-pointer shadow-xs active:scale-[0.98]"
                title="Pronunciación nativa (tecla R)"
              >
                <Volume2 className="w-3.5 h-3.5 text-indigo-500 transition-transform group-hover:scale-110" />
                <span>Normal (1.0x)</span>
                <kbd className="px-1.5 py-0.2 rounded bg-slate-200/70 dark:bg-slate-700/70 text-[10px] font-mono text-slate-500 dark:text-slate-400">R</kbd>
              </button>

              <button
                type="button"
                onClick={() => playWordAudio(0.75)}
                className="group inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-medium bg-slate-100/80 hover:bg-amber-50/80 dark:bg-slate-800/70 dark:hover:bg-amber-950/40 text-slate-700 hover:text-amber-600 dark:text-slate-300 dark:hover:text-amber-400 border border-slate-200/60 dark:border-slate-700/60 hover:border-amber-200 dark:hover:border-amber-800 transition-all cursor-pointer shadow-xs active:scale-[0.98]"
                title="Pronunciación lenta (tecla S)"
              >
                <Volume1 className="w-3.5 h-3.5 text-amber-500 transition-transform group-hover:scale-110" />
                <span>Lento (0.75x)</span>
                <kbd className="px-1.5 py-0.2 rounded bg-slate-200/70 dark:bg-slate-700/70 text-[10px] font-mono text-slate-500 dark:text-slate-400">S</kbd>
              </button>
            </div>
          </div>

          {/* 3. Pista Contextual Cloze con HeroUI Disclosure y Espacio Reservado Anti-Desplazamiento */}
          {currentContext ? (
            <div className="flex-shrink-0 w-full">
              <Disclosure
                isExpanded={showHint}
                onExpandedChange={setShowHint}
                className="w-full"
              >
                <div className="flex items-center justify-between">
                  <DisclosureTrigger className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer bg-transparent border-0 p-0 focus:outline-none">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-500/80" />
                    <span>{showHint ? 'Ocultar pista' : '¿Pista? Ver contexto cloze'}</span>
                  </DisclosureTrigger>

                  {availableContexts.length > 1 && showHint && (
                    <button
                      type="button"
                      onClick={onRotateContext}
                      className="inline-flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer font-medium"
                      title="Rotar a otro ejemplo contextual"
                    >
                      <RotateCw className="w-3 h-3" />
                      <span>Rotar ejemplo</span>
                    </button>
                  )}
                </div>

                {/* Espacio reservado para albergar la oración de pista sin desplazar el botón de voltear tarjeta */}
                <div className="min-h-[76px] flex items-center justify-center my-1.5">
                  <DisclosureContent className="w-full">
                    <DisclosureBody className="p-0">
                      <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 text-xs animate-in fade-in duration-200">
                        <p className="font-editorial text-sm text-slate-800 dark:text-slate-200 italic leading-relaxed text-center">
                          &ldquo;{renderClozeSentence(currentContext.sentenceEn, selectedVocab.word, currentContext.clozeTarget)}&rdquo;
                        </p>
                      </div>
                    </DisclosureBody>
                  </DisclosureContent>
                </div>
              </Disclosure>
            </div>
          ) : (
            <div className="min-h-[100px] flex-shrink-0" />
          )}

          {/* 4. Action: Reveal Answer with Space shortcut badge */}
          <div className="flex-shrink-0">
            <button
              type="button"
              onClick={onShowAnswer}
              className="w-full py-3.5 px-5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white font-semibold text-sm shadow-[0_4px_16px_rgba(79,70,229,0.25)] hover:shadow-[0_6px_20px_rgba(79,70,229,0.35)] transition-all flex items-center justify-center gap-2 cursor-pointer group"
            >
              <Repeat className="w-4 h-4 transition-transform group-hover:rotate-180 duration-500" />
              <span>Mostrar Respuesta</span>
              <kbd className="ml-2 px-2 py-0.5 rounded-lg bg-indigo-500/30 text-[10px] font-mono font-medium tracking-wide border border-indigo-400/20">
                Espacio
              </kbd>
            </button>
          </div>
        </div>

        {/* ============================================================ */}
        {/* BACK FACE (REVERSO - DISEÑO MINIMALISTA, MODERNO Y ELEGANTE)  */}
        {/* ============================================================ */}
        <SrsCardBack
          cardWithTarget={cardWithTarget}
          selectedVocab={selectedVocab}
          currentContext={currentContext}
          availableContexts={availableContexts}
          srsCard={srsCard}
          previewIntervals={previewIntervals}
          accent={accent}
          onAccentChange={setAccent}
          onRotateContext={onRotateContext}
          onFlipBack={onFlipBack}
          onRate={onRate}
          isRating={isRating}
        />
      </div>
    </div>
  );
}
