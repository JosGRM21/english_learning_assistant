import { useState, useEffect } from 'react';
import {
  X,
  Volume2,
  Volume1,
  AlertTriangle,
  AlertCircle,
  Brain,
  Trash2,
  Edit3,
  Check,
  CheckCircle,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  PlusCircle,
  BookOpen,
  Calendar,
  Layers,
  GraduationCap,
  Sparkles,
  Clock,
  Gauge,
  Activity,
  Zap,
} from 'lucide-react';
import {
  Drawer,
  DrawerTrigger,
  DrawerBackdrop,
  DrawerContent,
  DrawerDialog,
  DrawerHeader,
  DrawerBody,
  Button,
} from '@heroui/react';
import {
  VocabItem,
  VocabContextExample,
  CefrLevel,
  VocabSense,
  PART_OF_SPEECH_LABELS_ES,
} from '@/core/types/vocab';
import { SrsCard } from '@/core/types/srs';
import { useAudio } from '@/shared/hooks/useAudio';
import { useDatabase } from '@/shared/hooks/useDatabase';
import { SenseBlock } from './SenseBlock';
import { VerbTensesTable } from './VerbTensesTable';

export interface VocabDetailDrawerProps {
  vocab: VocabItem | null;
  isOpen: boolean;
  onClose: () => void;
  examples?: VocabContextExample[];
  allWords?: VocabItem[];
  onSelectWord?: (vocab: VocabItem) => void;
  onCreateCardFromSense?: (sense: VocabSense, baseWord: VocabItem) => Promise<VocabItem | null>;
  onDeleteWord?: (id: string) => Promise<boolean>;
  onUpdateWord?: (id: string, updates: Partial<VocabItem>) => Promise<VocabItem | null>;
  onActivateWord?: (id: string) => Promise<VocabItem | null>;
  onActivatePhrase?: (phraseId: string) => Promise<boolean>;
  onNavigateWord?: (direction: 'prev' | 'next') => void;
  hasPrev?: boolean;
  hasNext?: boolean;
  accentPreference?: 'US' | 'UK';
}

export function VocabDetailDrawer({
  vocab,
  isOpen,
  onClose,
  examples = [],
  allWords = [],
  onSelectWord,
  onCreateCardFromSense,
  onDeleteWord,
  onUpdateWord,
  onActivateWord,
  onActivatePhrase,
  onNavigateWord,
  hasPrev = false,
  hasNext = false,
  accentPreference = 'US',
}: VocabDetailDrawerProps) {
  const { audioService } = useAudio();
  const { cardRepo } = useDatabase();

  const [activeTab, setActiveTab] = useState<'senses' | 'grammar' | 'srs'>('senses');
  const [isPlayingNormal, setIsPlayingNormal] = useState(false);
  const [isPlayingSlow, setIsPlayingSlow] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [playingExampleId, setPlayingExampleId] = useState<string | null>(null);

  const handleSpeakExample = async (id: string, text: string) => {
    if (playingExampleId) return;
    try {
      setPlayingExampleId(id);
      await audioService.speak(text, 0.95);
    } finally {
      setPlayingExampleId(null);
    }
  };

  const [srsCard, setSrsCard] = useState<SrsCard | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editTranslation, setEditTranslation] = useState('');
  const [editDefinition, setEditDefinition] = useState('');
  const [editCefr, setEditCefr] = useState<CefrLevel>('B1');
  const [editIsFalseFriend, setEditIsFalseFriend] = useState(false);
  const [editFalseFriendNote, setEditFalseFriendNote] = useState('');
  const [showAllExamples, setShowAllExamples] = useState(false);
  const [creatingSenseKey, setCreatingSenseKey] = useState<string | null>(null);

  // Keep last non-null vocab during closing animation
  const [lastVocab, setLastVocab] = useState<VocabItem | null>(vocab);
  useEffect(() => {
    if (vocab) {
      setLastVocab(vocab);
    }
  }, [vocab]);

  const currentVocab = vocab ?? lastVocab;

  const findMatchingSenseCard = (sense: VocabSense, isPrimary: boolean) => {
    if (!currentVocab) return null;
    if (isPrimary) {
      return currentVocab;
    }
    const cleanWord = currentVocab.word.trim().toLowerCase();
    const cleanTrans = sense.translationEs.trim().toLowerCase();

    return allWords.find((w) => {
      if (w.word.trim().toLowerCase() !== cleanWord) return false;
      if (w.id === currentVocab.id) return false;
      const transMatch = w.translationEs.trim().toLowerCase() === cleanTrans;
      const domainMatch = Boolean(sense.domainCategory && w.domainCategory === sense.domainCategory);
      return transMatch || domainMatch;
    });
  };

  const handleCreateSenseCard = async (sense: VocabSense) => {
    if (!onCreateCardFromSense || !currentVocab) return;
    const key = sense.id || sense.translationEs;
    try {
      setCreatingSenseKey(key);
      await onCreateCardFromSense(sense, currentVocab);
    } finally {
      setCreatingSenseKey(null);
    }
  };

  // Fetch SRS Card details
  useEffect(() => {
    if (!currentVocab || !cardRepo) {
      setSrsCard(null);
      return;
    }
    cardRepo
      .getCardByTargetId(currentVocab.id, 'VOCAB')
      .then((card) => {
        setSrsCard(card);
      })
      .catch(() => {
        setSrsCard(null);
      });
  }, [currentVocab?.id, cardRepo]);

  // Synchronize edit inputs when vocab changes
  useEffect(() => {
    if (vocab) {
      setEditTranslation(vocab.translationEs);
      setEditDefinition(vocab.definitionEn);
      setEditCefr(vocab.cefrLevel);
      setEditIsFalseFriend(vocab.isFalseFriend);
      setEditFalseFriendNote(vocab.falseFriendNote || '');
      setIsEditing(false);
      setShowDeleteConfirm(false);
      setActiveTab('senses');
    }
  }, [vocab]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable;

      if (e.key === 'Escape') {
        if (showDeleteConfirm) {
          setShowDeleteConfirm(false);
        } else if (isEditing) {
          setIsEditing(false);
        } else {
          onClose();
        }
      } else if (!isInput && !isEditing) {
        if (e.key === 'ArrowLeft' && hasPrev && onNavigateWord) {
          e.preventDefault();
          onNavigateWord('prev');
        } else if (e.key === 'ArrowRight' && hasNext && onNavigateWord) {
          e.preventDefault();
          onNavigateWord('next');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, showDeleteConfirm, isEditing, onClose, hasPrev, hasNext, onNavigateWord]);

  if (!currentVocab) return null;

  const isPhrasalVerb =
    currentVocab.subcategory === 'PHRASAL_VERB' ||
    currentVocab.domainCategory === 'Phrasal Verb' ||
    (currentVocab.grammaticalDimension === 'CHUNK' && currentVocab.partOfSpeech === 'VERB');

  const handleSpeak = async (speed: 'normal' | 'slow') => {
    const isSlow = speed === 'slow';
    if (isSlow ? isPlayingSlow : isPlayingNormal) return;

    try {
      if (isSlow) setIsPlayingSlow(true);
      else setIsPlayingNormal(true);
      await audioService.speak(currentVocab.word, isSlow ? 0.75 : 1.0);
    } finally {
      if (isSlow) setIsPlayingSlow(false);
      else setIsPlayingNormal(false);
    }
  };

  const handleActivate = async () => {
    if (!onActivateWord || isActivating) return;
    try {
      setIsActivating(true);
      await onActivateWord(currentVocab.id);
    } finally {
      setIsActivating(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!onUpdateWord) return;
    try {
      setIsSavingEdit(true);
      await onUpdateWord(currentVocab.id, {
        translationEs: editTranslation.trim(),
        definitionEn: editDefinition.trim(),
        cefrLevel: editCefr,
        isFalseFriend: editIsFalseFriend,
        falseFriendNote: editIsFalseFriend ? editFalseFriendNote.trim() : null,
      });
      setIsEditing(false);
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDelete = async () => {
    if (!onDeleteWord) return;
    try {
      setIsDeleting(true);
      const ok = await onDeleteWord(currentVocab.id);
      if (ok) {
        onClose();
      }
    } finally {
      setIsDeleting(false);
    }
  };

  // Build list of senses
  const sensesList: VocabSense[] =
    currentVocab.sensesJson && currentVocab.sensesJson.length > 0
      ? currentVocab.sensesJson
      : [
          {
            translationEs: currentVocab.translationEs,
            definitionEn: currentVocab.definitionEn,
            partOfSpeech: currentVocab.partOfSpeech,
            cefrLevel: currentVocab.cefrLevel,
            collocations: currentVocab.collocationsJson || [],
          },
          ...(currentVocab.alternateSensesJson || []),
        ];

  // Collect sentence texts already rendered inside any sense block
  const displayedSentenceTexts = new Set<string>();
  for (const sense of sensesList) {
    if (sense.graduatedExamples?.sentenceBasicEn) {
      displayedSentenceTexts.add(sense.graduatedExamples.sentenceBasicEn.trim().toLowerCase());
    }
    if (sense.graduatedExamples?.sentenceAdvancedEn) {
      displayedSentenceTexts.add(sense.graduatedExamples.sentenceAdvancedEn.trim().toLowerCase());
    }
    if (sense.exampleSentenceEn) {
      displayedSentenceTexts.add(sense.exampleSentenceEn.trim().toLowerCase());
    }
    if (sense.additionalExamples) {
      for (const extra of sense.additionalExamples) {
        if (extra?.sentenceEn) {
          displayedSentenceTexts.add(extra.sentenceEn.trim().toLowerCase());
        }
      }
    }
  }

  // Only consider context examples that are not already part of any rendered sense
  const externalExamples = (examples || []).filter(
    (ex) => Boolean(ex?.sentenceEn) && !displayedSentenceTexts.has(ex.sentenceEn.trim().toLowerCase()),
  );

  // Check if word has verb tenses or phrasal verbs for Tab 2
  const hasVerbTenses = Boolean(currentVocab.verbTensesJson);
  const hasPhrasalVerbs = Boolean(currentVocab.phrasalVerbsJson && currentVocab.phrasalVerbsJson.length > 0);
  const hasGrammarTab = hasVerbTenses || hasPhrasalVerbs;

  const edEnding = currentVocab.phoneticEdEnding || currentVocab.verbTensesJson?.edPhoneticEnding;

  return (
    <Drawer
      isOpen={isOpen && Boolean(vocab)}
      onOpenChange={(open) => {
        if (!open) {
          setShowDeleteConfirm(false);
          setIsEditing(false);
          onClose();
        }
      }}
    >
      <DrawerTrigger className="hidden" aria-hidden="true" />
      <DrawerBackdrop
        variant="transparent"
        className="fixed inset-0 z-50 bg-black/45 backdrop-blur-xs transition-opacity duration-300"
      >
        <DrawerContent
          placement="right"
          className="fixed inset-0 z-50 flex justify-end pointer-events-none"
        >
          <DrawerDialog
            aria-label={`Ficha de Diccionario: ${currentVocab.word}`}
            className="relative pointer-events-auto p-0 m-0 w-full max-w-lg sm:max-w-xl lg:max-w-2xl bg-white dark:bg-[#0D111A] h-full shadow-2xl border-l border-gray-200/80 dark:border-white/[0.08] flex flex-col overflow-hidden outline-none rounded-none transition-all duration-300 font-sans"
          >
            {/* Header: Glassmorphism bar with Category Pill, Navigation & Actions */}
            <DrawerHeader className="p-3.5 px-6 border-b border-gray-100 dark:border-white/[0.06] flex flex-row items-center justify-between shrink-0 bg-white/80 dark:bg-[#0F1320]/80 backdrop-blur-md gap-0 mb-0 z-10">
              <div className="flex items-center gap-2.5">
                <span className="p-1.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 shrink-0">
                  <BookOpen className="w-4 h-4" />
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Ficha de Diccionario
                  </span>
                  {currentVocab.domainCategory && currentVocab.domainCategory !== 'Uso General' && currentVocab.domainCategory !== 'Phrasal Verb' && (
                    <>
                      <span className="text-gray-300 dark:text-gray-700">·</span>
                      <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                        {currentVocab.domainCategory}
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {onNavigateWord && (
                  <div className="flex items-center gap-1 mr-1 border-r border-gray-200 dark:border-white/[0.08] pr-2">
                    <button
                      type="button"
                      onClick={() => onNavigateWord('prev')}
                      disabled={!hasPrev}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-gray-800 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800/70 disabled:opacity-20 disabled:pointer-events-none transition-colors cursor-pointer"
                      title="Palabra anterior (←)"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onNavigateWord('next')}
                      disabled={!hasNext}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-gray-800 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800/70 disabled:opacity-20 disabled:pointer-events-none transition-colors cursor-pointer"
                      title="Palabra siguiente (→)"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setIsEditing(!isEditing)}
                  className={`p-2 rounded-xl transition-all cursor-pointer ${
                    isEditing
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800/70'
                  }`}
                  title={isEditing ? 'Cancelar edición' : 'Editar término'}
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800/70 transition-colors cursor-pointer"
                  title="Cerrar ficha (Esc)"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </DrawerHeader>

            {/* Scrollable Dictionary Body */}
            <DrawerBody className="!mt-0 m-0 flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6 text-inherit leading-normal">
              {/* Activation Notice if Inactive */}
              {currentVocab.masteryStatus === 'INACTIVE' && onActivateWord && (
                <div className="p-4 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/80 flex items-center justify-between gap-3 shadow-xs animate-in fade-in duration-200">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                      <p className="text-xs font-bold text-indigo-950 dark:text-indigo-200">
                        Término no activado en tu mazo de repaso
                      </p>
                    </div>
                    <p className="text-[11px] text-indigo-700 dark:text-indigo-300">
                      Actívalo para comenzar a repasar con el algoritmo FSRS.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onPress={handleActivate}
                    isDisabled={isActivating}
                    className="h-8 px-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-sm shadow-indigo-500/20 cursor-pointer shrink-0"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>{isActivating ? 'Activando...' : 'Activar para estudio'}</span>
                  </Button>
                </div>
              )}

              {/* SECCIÓN A: HEADWORD HERO WITH ACOUSTIC SUITE */}
              <div className="space-y-4 pb-5 border-b border-gray-100 dark:border-white/[0.06]">
                {/* Lexical Hero Tags Row (Categorías arriba) */}
                <div className="flex items-center gap-2 flex-wrap text-xs">
                  {/* CEFR Level Chip */}
                  <span
                    className={`px-3 py-1 rounded-xl font-mono text-xs font-semibold border ${
                      currentVocab.cefrLevel === 'A1' || currentVocab.cefrLevel === 'A2'
                        ? 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10'
                        : currentVocab.cefrLevel === 'B1' || currentVocab.cefrLevel === 'B2'
                        ? 'border-indigo-500/40 text-indigo-400 bg-indigo-500/10'
                        : 'border-purple-500/40 text-purple-400 bg-purple-500/10'
                    }`}
                  >
                    {currentVocab.cefrLevel}
                  </span>

                  {/* Part of Speech or Phrasal Verb Badge */}
                  {isPhrasalVerb ? (
                    <span className="px-3 py-1 rounded-xl font-medium text-xs bg-indigo-950/40 text-indigo-300 border border-indigo-500/40">
                      Phrasal Verb
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-xl bg-[#141824] text-slate-300 font-medium text-xs border border-white/[0.08]">
                      {PART_OF_SPEECH_LABELS_ES[currentVocab.partOfSpeech] ?? currentVocab.partOfSpeech}
                    </span>
                  )}

                  {/* Domain Category / Uso General */}
                  <span className="px-3 py-1 rounded-xl bg-indigo-950/40 text-indigo-300 font-medium text-xs border border-indigo-500/40">
                    {currentVocab.domainCategory && currentVocab.domainCategory !== 'Phrasal Verb'
                      ? currentVocab.domainCategory
                      : 'Uso General'}
                  </span>

                  {/* Grammatical Dimension / Contenido Léxico */}
                  <span className="px-3 py-1 rounded-xl bg-[#141824] text-slate-400 font-medium text-xs border border-white/[0.08]">
                    {currentVocab.grammaticalDimension === 'FUNCTION'
                      ? 'Palabra Funcional'
                      : currentVocab.grammaticalDimension === 'CHUNK'
                      ? 'Expresión / Frase'
                      : 'Contenido Léxico'}
                  </span>
                </div>

                {/* Headword & Phonetics */}
                <div className="space-y-1.5">
                  <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight font-sans">
                    {currentVocab.word}
                  </h1>

                  {/* Dual IPA transcription with regional flag badges */}
                  <div className="flex items-center gap-3 flex-wrap text-sm pt-0.5">
                    {currentVocab.ipaGeneralAmerican && (
                      <div className={`flex items-center gap-1.5 text-indigo-400 font-phonetic font-medium tracking-wide text-sm ${
                        accentPreference === 'US' ? 'opacity-100 font-semibold' : 'opacity-80'
                      }`}>
                        {currentVocab.ipaReceivedPronunciation && <span className="text-xs select-none">🇺🇸</span>}
                        <span>//{currentVocab.ipaGeneralAmerican}//</span>
                      </div>
                    )}

                    {currentVocab.ipaReceivedPronunciation && (
                      <>
                        <span className="text-gray-300 dark:text-gray-700 select-none">·</span>
                        <div className={`flex items-center gap-1.5 text-indigo-400 font-phonetic font-medium tracking-wide text-sm ${
                          accentPreference === 'UK' ? 'opacity-100 font-semibold' : 'opacity-80'
                        }`}>
                          <span className="text-xs select-none">🇬🇧</span>
                          <span>//{currentVocab.ipaReceivedPronunciation}//</span>
                        </div>
                      </>
                    )}

                    {/* Weak form reduction if present (RF-VOC-06) */}
                    {currentVocab.ipaWeakForm && (
                      <>
                        <span className="text-gray-300 dark:text-gray-700 select-none">·</span>
                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-indigo-950/40 border border-indigo-500/30 text-indigo-300 text-xs font-phonetic font-medium">
                          <span className="text-[10px] uppercase font-sans font-bold text-indigo-400">Débil (Schwa):</span>
                          <span>//{currentVocab.ipaWeakForm}//</span>
                        </div>
                      </>
                    )}

                    {/* Regular verb -ed ending alophone (RF-VOC-06) */}
                    {edEnding && (
                      <>
                        <span className="text-gray-300 dark:text-gray-700 select-none">·</span>
                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs font-mono font-medium">
                          <span className="text-[10px] uppercase font-sans font-bold text-emerald-400">-ed:</span>
                          <span>{edEnding}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Audio Reproduction Buttons (1.0x & 0.75x Lento) */}
                <div className="flex items-center gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => handleSpeak('normal')}
                    disabled={isPlayingNormal}
                    className={`flex-1 h-11 px-4 rounded-xl border border-white/[0.08] bg-[#101422] hover:bg-[#161B2E] transition-all flex items-center justify-center gap-2 text-xs sm:text-sm font-medium text-slate-200 cursor-pointer shadow-xs ${
                      isPlayingNormal ? 'ring-2 ring-indigo-500/50 bg-[#161B2E]' : ''
                    }`}
                    title="Pronunciación normal (1.0x)"
                  >
                    <Volume2 className={`w-4 h-4 text-slate-300 ${isPlayingNormal ? 'animate-pulse' : ''}`} />
                    <span>Pronunciación Normal (1.0x)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSpeak('slow')}
                    disabled={isPlayingSlow}
                    className={`h-11 px-4 rounded-xl border border-white/[0.08] bg-[#101422] hover:bg-[#161B2E] transition-all flex items-center justify-center gap-2 text-xs sm:text-sm font-medium text-slate-200 cursor-pointer shadow-xs shrink-0 ${
                      isPlayingSlow ? 'ring-2 ring-purple-500/50 bg-[#161B2E]' : ''
                    }`}
                    title="Escuchar a velocidad lenta (0.75x)"
                  >
                    <Volume1 className={`w-4 h-4 text-slate-300 ${isPlayingSlow ? 'animate-pulse' : ''}`} />
                    <span>0.75x Lento</span>
                  </button>
                </div>

                {/* Separable Phrasal Verb Strict Pronoun Rule Banner (RF-VOC-04) */}
                {currentVocab.isSeparable && (
                  <div className="p-3.5 rounded-2xl bg-indigo-500/10 dark:bg-indigo-950/40 border border-indigo-300/80 dark:border-indigo-700/60 space-y-1 shadow-2xs animate-in fade-in duration-200">
                    <div className="flex items-center gap-2 text-indigo-800 dark:text-indigo-200 font-bold text-xs">
                      <AlertCircle className="w-4 h-4 text-indigo-500 shrink-0" />
                      <span>Regla Estricta del Pronombre (Transitivo Separable)</span>
                    </div>
                    <p className="text-xs text-indigo-900/90 dark:text-indigo-200/90 leading-relaxed font-sans">
                      Los pronombres de objeto dividen la partícula obligatoriamente: ej. <strong className="text-emerald-600 dark:text-emerald-400 font-mono">turn it off</strong>, nunca <span className="line-through text-rose-500 dark:text-rose-400 font-mono">*turn off it</span>.
                    </p>
                  </div>
                )}

                {/* False Friend Alert Banner */}
                {currentVocab.isFalseFriend && (
                  <div className="p-3.5 rounded-2xl bg-amber-500/10 dark:bg-amber-950/40 border border-amber-300/80 dark:border-amber-700/60 space-y-1 shadow-2xs animate-in fade-in duration-200">
                    <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200 font-bold text-xs">
                      <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                      <span>Alerta de Interferencia L1 (Falso Amigo)</span>
                    </div>
                    <p className="text-xs text-amber-900/90 dark:text-amber-200/90 leading-relaxed font-sans">
                      {currentVocab.falseFriendNote ||
                        'Este término se asemeja ortográficamente a una palabra en español con un significado completamente distinto.'}
                    </p>
                  </div>
                )}
              </div>

              {/* Edit Mode Inline Panel */}
              {isEditing && (
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-indigo-50/50 via-white to-purple-50/30 dark:from-[#131726] dark:via-[#111420] dark:to-[#171328] border border-indigo-200/80 dark:border-indigo-800/60 space-y-3.5 shadow-md animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Edit3 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      <h3 className="text-xs font-bold text-indigo-950 dark:text-indigo-200 uppercase tracking-wider">
                        Editar Datos Léxicos
                      </h3>
                    </div>
                    <span className="text-[10px] text-gray-400 font-mono">Modo Edición</span>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-gray-700 dark:text-gray-300">
                      Traducción al Español:
                    </label>
                    <input
                      type="text"
                      value={editTranslation}
                      onChange={(e) => setEditTranslation(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#151928] border border-gray-300 dark:border-gray-700 text-xs font-semibold text-gray-900 dark:text-white shadow-2xs focus:border-indigo-500 outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-gray-700 dark:text-gray-300">
                      Definición en Inglés:
                    </label>
                    <textarea
                      rows={2}
                      value={editDefinition}
                      onChange={(e) => setEditDefinition(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#151928] border border-gray-300 dark:border-gray-700 text-xs text-gray-900 dark:text-white shadow-2xs focus:border-indigo-500 outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-gray-700 dark:text-gray-300">
                      Nivel CEFR:
                    </label>
                    <select
                      value={editCefr}
                      onChange={(e) => setEditCefr(e.target.value as CefrLevel)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#151928] border border-gray-300 dark:border-gray-700 text-xs text-gray-900 dark:text-white shadow-2xs focus:border-indigo-500 outline-none"
                    >
                      <option value="A1">A1</option>
                      <option value="A2">A2</option>
                      <option value="B1">B1</option>
                      <option value="B2">B2</option>
                      <option value="C1">C1</option>
                      <option value="C2">C2</option>
                    </select>
                  </div>

                  <div className="pt-1 space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-700 dark:text-gray-300">
                      <input
                        type="checkbox"
                        checked={editIsFalseFriend}
                        onChange={(e) => setEditIsFalseFriend(e.target.checked)}
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="font-semibold">¿Es un Falso Amigo?</span>
                    </label>
                    {editIsFalseFriend && (
                      <input
                        type="text"
                        value={editFalseFriendNote}
                        onChange={(e) => setEditFalseFriendNote(e.target.value)}
                        placeholder="Nota de advertencia (ej. no significa actualmente)"
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#151928] border border-amber-300 dark:border-amber-700 text-xs text-amber-900 dark:text-amber-200 shadow-2xs"
                      />
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-200/60 dark:border-white/[0.06]">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-3.5 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                    >
                      Cancelar
                    </button>
                    <Button
                      onPress={handleSaveEdit}
                      isDisabled={isSavingEdit || !editTranslation.trim()}
                      className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm shadow-indigo-500/20"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{isSavingEdit ? 'Guardando...' : 'Guardar Cambios'}</span>
                    </Button>
                  </div>
                </div>
              )}

              {/* SEGMENTED TAB NAVIGATION */}
              <div className="flex items-center gap-1 bg-gray-100/80 dark:bg-[#141826] p-1 rounded-2xl border border-gray-200/60 dark:border-white/[0.05] shadow-2xs">
                <button
                  type="button"
                  onClick={() => setActiveTab('senses')}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    activeTab === 'senses'
                      ? 'bg-white dark:bg-[#202638] text-indigo-600 dark:text-indigo-400 shadow-xs'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Acepciones y Ejemplos ({sensesList.length})</span>
                </button>

                {hasGrammarTab && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('grammar')}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      activeTab === 'grammar'
                        ? 'bg-white dark:bg-[#202638] text-indigo-600 dark:text-indigo-400 shadow-xs'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    <GraduationCap className="w-3.5 h-3.5" />
                    <span>Gramática y Formas</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setActiveTab('srs')}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    activeTab === 'srs'
                      ? 'bg-white dark:bg-[#202638] text-indigo-600 dark:text-indigo-400 shadow-xs'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <Brain className="w-3.5 h-3.5" />
                  <span>Retención FSRS</span>
                </button>
              </div>

              {/* TAB 1: ACEPCIONES Y EJEMPLOS */}
              {activeTab === 'senses' && (
                <div className="space-y-5 animate-in fade-in duration-150">
                  <div className="space-y-4">
                    {sensesList.map((sense, idx) => {
                      const isPrimary = idx === 0;
                      const matchingCard = findMatchingSenseCard(sense, isPrimary);
                      const senseKey = sense.id || sense.translationEs;
                      const isSelf = matchingCard?.id === currentVocab.id;
                      return (
                        <SenseBlock
                          key={sense.id || sense.senseId || `sense_${idx}`}
                          sense={sense}
                          senseNumber={idx + 1}
                          totalSenses={sensesList.length}
                          matchingCard={isSelf ? null : matchingCard}
                          onNavigateToCard={onSelectWord}
                          onCreateIndependentCard={handleCreateSenseCard}
                          isCreatingCard={creatingSenseKey === senseKey}
                        />
                      );
                    })}
                  </div>

                  {/* External Context Examples if provided and not already rendered in senses */}
                  {externalExamples && externalExamples.length > 0 && (
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center gap-2">
                        <span className="p-1 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                          <BookOpen className="w-3.5 h-3.5" />
                        </span>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                          Oraciones en Contexto ({externalExamples.length})
                        </h3>
                      </div>

                      <div className="space-y-2.5">
                        {(showAllExamples ? externalExamples : externalExamples.slice(0, 2)).map((ex) => (
                          <div
                            key={ex.id}
                            className="relative p-3.5 pr-11 rounded-2xl bg-white dark:bg-[#141824] border border-gray-200/70 dark:border-white/[0.06] space-y-1 shadow-2xs"
                          >
                            <p className="font-editorial text-xs sm:text-sm text-gray-900 dark:text-white italic leading-relaxed">
                              &ldquo;{ex.sentenceEn}&rdquo;
                            </p>
                            {ex.sentenceEs && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 font-sans">
                                {ex.sentenceEs}
                              </p>
                            )}
                            <button
                              type="button"
                              onClick={() => handleSpeakExample(ex.id, ex.sentenceEn)}
                              disabled={playingExampleId === ex.id}
                              className={`absolute right-3.5 top-1/2 -translate-y-1/2 p-1.5 rounded-xl text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all cursor-pointer ${
                                playingExampleId === ex.id ? 'text-indigo-500 animate-pulse' : ''
                              }`}
                              title="Escuchar oración"
                            >
                              <Volume2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>

                      {externalExamples.length > 2 && (
                        <button
                          type="button"
                          onClick={() => setShowAllExamples(!showAllExamples)}
                          className="w-full py-2 px-3 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors cursor-pointer"
                        >
                          {showAllExamples
                            ? 'Mostrar menos'
                            : `Mostrar ${externalExamples.length - 2} oraciones más`}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: GRAMÁTICA Y FORMAS */}
              {activeTab === 'grammar' && (
                <div className="space-y-5 animate-in fade-in duration-150">
                  {/* Verb conjugations table */}
                  {currentVocab.verbTensesJson && (
                    <div className="space-y-2">
                      <VerbTensesTable
                        tenses={currentVocab.verbTensesJson}
                        edEnding={edEnding}
                      />
                    </div>
                  )}

                  {/* Satellite Phrasal Verbs (RF-VOC-04) */}
                  {currentVocab.phrasalVerbsJson && currentVocab.phrasalVerbsJson.length > 0 && (
                    <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#141824] border border-gray-200/80 dark:border-white/[0.06] space-y-3 shadow-2xs">
                      <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-white/[0.06]">
                        <div className="flex items-center gap-2">
                          <span className="p-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                            <BookOpen className="w-3.5 h-3.5" />
                          </span>
                          <h4 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                            Verbos Frasales Satélites ({currentVocab.phrasalVerbsJson.length})
                          </h4>
                        </div>
                      </div>

                      <div className="space-y-2.5">
                        {currentVocab.phrasalVerbsJson.map((pv, idx) => {
                          const matchingPhraseWord = allWords.find(
                            (w) => (pv.id && w.id === pv.id) || w.word.toLowerCase() === pv.text.toLowerCase(),
                          );
                          const isPhraseActive = matchingPhraseWord
                            ? matchingPhraseWord.masteryStatus !== 'INACTIVE'
                            : false;
                          const phraseTargetId = pv.id || matchingPhraseWord?.id;

                          return (
                            <div
                              key={idx}
                              className="p-3.5 rounded-xl bg-gray-50/70 dark:bg-[#10131E] border border-gray-200/60 dark:border-white/[0.04] space-y-2"
                            >
                              <div className="flex items-center justify-between gap-2 flex-wrap">
                                <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400 font-mono">
                                  {pv.text}
                                </span>
                                <div className="flex items-center gap-1.5">
                                  <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-semibold bg-gray-200/60 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                                    {pv.cefrLevel}
                                  </span>
                                  <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60">
                                    {pv.type}
                                  </span>
                                </div>
                              </div>

                              <p className="text-xs font-medium text-gray-800 dark:text-gray-200">
                                {pv.meaningEs}
                              </p>

                              {pv.pronounMustSplit && (
                                <p className="text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                                  Separable: el pronombre divide obligatoriamente la partícula (ej. <em>turn it off</em>).
                                </p>
                              )}

                              {pv.example1 && (
                                <p className="text-[11px] font-editorial italic text-gray-500 dark:text-gray-400 pt-0.5">
                                  &ldquo;{pv.example1}&rdquo;
                                </p>
                              )}

                              {/* Action buttons: SRS status / Activation / Ver Ficha */}
                              <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-gray-100 dark:border-white/[0.04]">
                                <div>
                                  {isPhraseActive ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                                      <CheckCircle className="w-3 h-3 text-emerald-500" />
                                      <span>En Repaso SRS</span>
                                    </span>
                                  ) : (
                                    onActivatePhrase && phraseTargetId && (
                                      <button
                                        type="button"
                                        onClick={() => onActivatePhrase(phraseTargetId)}
                                        className="h-6 px-2.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700/60 text-[11px] font-medium flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                                        title="Activar en el mazo de repaso espaciado FSRS"
                                      >
                                        <PlusCircle className="w-3 h-3 text-indigo-500 dark:text-indigo-400" />
                                        <span>Activar en SRS</span>
                                      </button>
                                    )
                                  )}
                                </div>

                                {matchingPhraseWord && onSelectWord && (
                                  <button
                                    type="button"
                                    onClick={() => onSelectWord(matchingPhraseWord)}
                                    className="h-6 px-2 rounded-md hover:bg-gray-100 dark:hover:bg-white/[0.06] text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white text-[11px] font-medium flex items-center gap-1 cursor-pointer transition-colors"
                                    title="Ver ficha completa de este phrasal verb"
                                  >
                                    <span>Ver Ficha</span>
                                    <ExternalLink className="w-3 h-3 text-gray-400" />
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: RETENCIÓN FSRS (MEMORY INTELLIGENCE DASHBOARD) */}
              {activeTab === 'srs' && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-gray-50 via-white to-indigo-50/20 dark:from-[#131724] dark:via-[#10131E] dark:to-[#171328] border border-gray-200/80 dark:border-white/[0.08] space-y-5 shadow-xs">
                    <div className="flex items-center justify-between pb-3.5 border-b border-gray-200/60 dark:border-white/[0.06]">
                      <div className="flex items-center gap-3">
                        <span className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-2xs">
                          <Brain className="w-5 h-5" />
                        </span>
                        <div>
                          <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                            Estado del Algoritmo FSRS 5.0
                          </h4>
                          <p className="text-[11px] text-gray-500 dark:text-gray-400">
                            Cálculo de intervalos de memoria y consolidación a largo plazo
                          </p>
                        </div>
                      </div>

                      <span className="px-3 py-1 rounded-xl text-xs font-bold bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20 shadow-2xs">
                        {currentVocab.masteryStatus}
                      </span>
                    </div>

                    {/* Bento Metric Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-3.5 rounded-2xl bg-white dark:bg-[#191F2E] border border-gray-200/70 dark:border-white/[0.06] space-y-1 shadow-2xs">
                        <div className="flex items-center justify-between text-gray-400">
                          <span className="text-[10px] font-semibold uppercase tracking-wider">
                            Estabilidad
                          </span>
                          <Clock className="w-3 h-3 text-indigo-500" />
                        </div>
                        <span className="text-lg font-bold text-gray-900 dark:text-white font-mono block">
                          {srsCard ? `${srsCard.stability.toFixed(1)}d` : '—'}
                        </span>
                        <span className="text-[10px] text-gray-400 block">vida media memoria</span>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-white dark:bg-[#191F2E] border border-gray-200/70 dark:border-white/[0.06] space-y-1 shadow-2xs">
                        <div className="flex items-center justify-between text-gray-400">
                          <span className="text-[10px] font-semibold uppercase tracking-wider">
                            Dificultad
                          </span>
                          <Gauge className="w-3 h-3 text-amber-500" />
                        </div>
                        <span className="text-lg font-bold text-gray-900 dark:text-white font-mono block">
                          {srsCard ? `${srsCard.difficulty.toFixed(1)}/10` : '—'}
                        </span>
                        <span className="text-[10px] text-gray-400 block">curva de olvido</span>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-white dark:bg-[#191F2E] border border-gray-200/70 dark:border-white/[0.06] space-y-1 shadow-2xs">
                        <div className="flex items-center justify-between text-gray-400">
                          <span className="text-[10px] font-semibold uppercase tracking-wider">
                            Repasos
                          </span>
                          <Activity className="w-3 h-3 text-emerald-500" />
                        </div>
                        <span className="text-lg font-bold text-gray-900 dark:text-white font-mono block">
                          {srsCard ? srsCard.reps : 0}
                        </span>
                        <span className="text-[10px] text-gray-400 block">sesiones logradas</span>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-white dark:bg-[#191F2E] border border-gray-200/70 dark:border-white/[0.06] space-y-1 shadow-2xs">
                        <div className="flex items-center justify-between text-gray-400">
                          <span className="text-[10px] font-semibold uppercase tracking-wider">
                            Lapsos
                          </span>
                          <Sparkles className="w-3 h-3 text-rose-500" />
                        </div>
                        <span className="text-lg font-bold text-gray-900 dark:text-white font-mono block">
                          {srsCard ? srsCard.lapses : 0}
                        </span>
                        <span className="text-[10px] text-gray-400 block">repasos fallidos</span>
                      </div>
                    </div>

                    {srsCard?.scheduledFor && (
                      <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300 pt-1 bg-white/60 dark:bg-[#161B2A]/60 p-3 rounded-2xl border border-gray-200/50 dark:border-white/[0.04]">
                        <Calendar className="w-4 h-4 text-indigo-500 shrink-0" />
                        <span>
                          Próximo repaso agendado:{' '}
                          <strong className="text-gray-900 dark:text-white">
                            {new Date(srsCard.scheduledFor).toLocaleDateString()}
                          </strong>
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Danger Zone: Delete Word Action with Clean Card Presentation */}
              <div className="pt-6 border-t border-gray-100 dark:border-white/[0.06]">
                {showDeleteConfirm ? (
                  <div className="p-4 rounded-2xl bg-red-500/10 dark:bg-red-950/40 border border-red-300 dark:border-red-900/60 space-y-2.5 animate-in fade-in duration-150 shadow-xs">
                    <p className="text-xs font-bold text-red-900 dark:text-red-200">
                      ¿Seguro? Esta acción no se puede deshacer.
                    </p>
                    <p className="text-[11px] text-red-700 dark:text-red-300">
                      Se eliminará el término y su historial de repaso FSRS de tu catálogo personal.
                    </p>
                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setShowDeleteConfirm(false)}
                        className="px-3.5 py-1.5 rounded-xl border border-gray-300 dark:border-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                      >
                        Cancelar
                      </button>
                      <Button
                        onPress={handleDelete}
                        isDisabled={isDeleting}
                        className="px-4 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-xs cursor-pointer shadow-sm shadow-red-500/20"
                      >
                        {isDeleting ? 'Eliminando...' : 'Sí, eliminar'}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(true)}
                      className="text-xs font-semibold text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Eliminar término del catálogo</span>
                    </button>
                    <span className="text-[11px] text-gray-400 dark:text-gray-400 hidden sm:inline">
                      Presiona <kbd className="font-mono bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-[10px]">Esc</kbd> para cerrar
                    </span>
                  </div>
                )}
              </div>
            </DrawerBody>
          </DrawerDialog>
        </DrawerContent>
      </DrawerBackdrop>
    </Drawer>
  );
}
