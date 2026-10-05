import { useState, useEffect } from 'react';
import {
  X,
  Volume2,
  Volume1,
  AlertTriangle,
  BookOpen,
  Brain,
  Trash2,
  Edit3,
  Check,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  Drawer,
  DrawerTrigger,
  DrawerBackdrop,
  DrawerContent,
  DrawerDialog,
  DrawerHeader,
  DrawerBody,
  DrawerFooter,
  Button,
} from '@heroui/react';
import {
  VocabItem,
  VocabContextExample,
  CefrLevel,
  PART_OF_SPEECH_LABELS_ES,
  GRAMMATICAL_DIMENSION_LABELS_ES,
} from '@/core/types/vocab';
import { SrsCard } from '@/core/types/srs';
import { useAudio } from '@/shared/hooks/useAudio';
import { useDatabase } from '@/shared/hooks/useDatabase';
import { VerbTensesCard } from './VerbTensesCard';
import { StructuredFamilyCard } from './StructuredFamilyCard';

export interface VocabDetailDrawerProps {
  vocab: VocabItem | null;
  isOpen: boolean;
  onClose: () => void;
  examples?: VocabContextExample[];
  onDeleteWord?: (id: string) => Promise<boolean>;
  onUpdateWord?: (id: string, updates: Partial<VocabItem>) => Promise<VocabItem | null>;
  onNavigateWord?: (direction: 'prev' | 'next') => void;
  hasPrev?: boolean;
  hasNext?: boolean;
}

export function VocabDetailDrawer({
  vocab,
  isOpen,
  onClose,
  examples = [],
  onDeleteWord,
  onUpdateWord,
  onNavigateWord,
  hasPrev = false,
  hasNext = false,
}: VocabDetailDrawerProps) {
  const { audioService } = useAudio();
  const { cardRepo } = useDatabase();

  const [isPlayingNormal, setIsPlayingNormal] = useState(false);
  const [isPlayingSlow, setIsPlayingSlow] = useState(false);
  const [playingExampleId, setPlayingExampleId] = useState<string | null>(null);

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

  // Keep last non-null vocab during closing transition
  const [lastVocab, setLastVocab] = useState<VocabItem | null>(vocab);
  useEffect(() => {
    if (vocab) {
      setLastVocab(vocab);
    }
  }, [vocab]);

  const currentVocab = vocab ?? lastVocab;

  // Fetch SRS Card details when vocab changes
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
    }
  }, [vocab]);

  // Keyboard navigation: Escape to close, Left/Right arrows to navigate
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

  const handleSpeakExample = async (example: VocabContextExample) => {
    if (playingExampleId === example.id) return;
    try {
      setPlayingExampleId(example.id);
      await audioService.speak(example.sentenceEn, 0.95);
    } finally {
      setPlayingExampleId(null);
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

  const getCefrBadgeStyle = (level: string) => {
    switch (level) {
      case 'A1':
      case 'A2':
        return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/80';
      case 'B1':
      case 'B2':
        return 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/80';
      case 'C1':
      case 'C2':
        return 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800/80';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700';
    }
  };

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
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs"
      >
        <DrawerContent
          placement="right"
          className="fixed inset-0 z-50 flex justify-end pointer-events-none"
        >
          <DrawerDialog
            aria-label={`Inspector Léxico: ${currentVocab.word}`}
            className="relative pointer-events-auto p-0 m-0 w-full max-w-lg sm:max-w-xl lg:max-w-2xl bg-white dark:bg-[#0E111A] h-full shadow-2xl border-l border-y-0 border-r-0 border-gray-200/80 dark:border-white/[0.08] flex flex-col overflow-hidden outline-none rounded-none transition-all duration-300"
          >
            {/* Drawer Header */}
            <DrawerHeader className="p-4 px-6 border-b border-gray-100 dark:border-white/[0.06] flex flex-row items-center justify-between shrink-0 bg-gray-50/50 dark:bg-[#121622]/50 gap-0 mb-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 shrink-0">
                  <BookOpen className="w-4 h-4" />
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-600 dark:text-indigo-400">
                      Inspector Léxico
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium truncate">
                    Desglose fonético, semántico y retención
                  </p>
                </div>
              </div>

              {/* Header Actions: Sequential Navigation & Edit & Close */}
              <div className="flex items-center gap-1">
                {onNavigateWord && (
                  <div className="flex items-center gap-0.5 mr-1 border-r border-gray-200 dark:border-white/[0.08] pr-1.5">
                    <button
                      type="button"
                      onClick={() => onNavigateWord('prev')}
                      disabled={!hasPrev}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-25 disabled:pointer-events-none transition-colors cursor-pointer"
                      title="Palabra anterior (tecla ←)"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onNavigateWord('next')}
                      disabled={!hasNext}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-25 disabled:pointer-events-none transition-colors cursor-pointer"
                      title="Palabra siguiente (tecla →)"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setIsEditing(!isEditing)}
                  className={`p-2 rounded-xl transition-colors cursor-pointer ${
                    isEditing
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                  title={isEditing ? 'Cancelar edición' : 'Editar término'}
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                  title="Cerrar inspector (Esc)"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </DrawerHeader>

            {/* Scrollable Content */}
            <DrawerBody className="!mt-0 m-0 flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6 text-inherit leading-normal">
              {/* Main Word Section */}
              <div className="space-y-3 pb-3 border-b border-gray-100 dark:border-white/[0.06]">
                {/* Horizontal Categories Bar */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`px-2.5 py-0.5 rounded-md font-mono text-xs font-bold border shrink-0 ${getCefrBadgeStyle(
                      currentVocab.cefrLevel,
                    )}`}
                  >
                    {currentVocab.cefrLevel}
                  </span>

                  <span className="px-2.5 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-xs text-gray-700 dark:text-gray-300 font-medium shrink-0">
                    {PART_OF_SPEECH_LABELS_ES[currentVocab.partOfSpeech] ?? currentVocab.partOfSpeech}
                  </span>

                  {currentVocab.domainCategory && (
                    <span className="px-2.5 py-0.5 rounded-md font-sans text-xs font-bold bg-indigo-50/80 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/60 shrink-0">
                      {currentVocab.domainCategory}
                    </span>
                  )}

                  <span className="px-2.5 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800/80 text-xs text-gray-600 dark:text-gray-400 font-medium shrink-0">
                    {GRAMMATICAL_DIMENSION_LABELS_ES[currentVocab.grammaticalDimension] ?? currentVocab.grammaticalDimension}
                  </span>

                  {currentVocab.subcategory && (
                    <span className="px-2.5 py-0.5 rounded-md bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 text-xs font-medium border border-indigo-100 dark:border-indigo-900/40 shrink-0">
                      {currentVocab.subcategory}
                    </span>
                  )}
                </div>

                {/* Word & Phonetics */}
                <div>
                  <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight font-sans">
                    {currentVocab.word}
                  </h1>

                  {/* Phonetics row */}
                  <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                    {currentVocab.ipaGeneralAmerican && (
                      <span
                        className="font-phonetic text-base font-semibold text-indigo-600 dark:text-indigo-400 tracking-wide"
                        title="General American IPA"
                      >
                        /{currentVocab.ipaGeneralAmerican}/
                      </span>
                    )}
                    {currentVocab.ipaReceivedPronunciation && (
                      <span
                        className="font-phonetic text-xs text-purple-600 dark:text-purple-400 tracking-wide"
                        title="Received Pronunciation (UK) IPA"
                      >
                        UK: /{currentVocab.ipaReceivedPronunciation}/
                      </span>
                    )}
                  </div>
                </div>

                {/* Pronunciation Audio Bar */}
                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => handleSpeak('normal')}
                    disabled={isPlayingNormal}
                    className={`flex-1 py-2 px-3 rounded-xl border border-gray-200/80 dark:border-white/[0.08] bg-gray-50/80 dark:bg-[#161B28] hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:border-indigo-300 dark:hover:border-indigo-700/60 transition-all flex items-center justify-center gap-2 cursor-pointer text-xs font-semibold ${
                      isPlayingNormal ? 'text-indigo-600 dark:text-indigo-400 ring-2 ring-indigo-500/30' : 'text-gray-700 dark:text-gray-200'
                    }`}
                  >
                    <Volume2 className={`w-4 h-4 ${isPlayingNormal ? 'animate-pulse text-indigo-600' : ''}`} />
                    <span>Pronunciación Normal (1.0x)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSpeak('slow')}
                    disabled={isPlayingSlow}
                    className={`py-2 px-3 rounded-xl border border-gray-200/80 dark:border-white/[0.08] bg-gray-50/80 dark:bg-[#161B28] hover:bg-purple-50 dark:hover:bg-purple-950/40 hover:border-purple-300 dark:border-purple-700/60 transition-all flex items-center justify-center gap-1.5 cursor-pointer text-xs font-semibold ${
                      isPlayingSlow ? 'text-purple-600 dark:text-purple-400 ring-2 ring-purple-500/30' : 'text-gray-600 dark:text-gray-300'
                    }`}
                    title="Escuchar a velocidad lenta (0.75x) para entrenamiento auditivo"
                  >
                    <Volume1 className={`w-3.5 h-3.5 ${isPlayingSlow ? 'animate-pulse text-purple-600' : ''}`} />
                    <span>0.75x Lento</span>
                  </button>
                </div>
              </div>

              {/* Edit Form or Meanings Section */}
              {isEditing ? (
                <div className="p-4 rounded-2xl bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/50 space-y-3 animate-in fade-in duration-200">
                  <h3 className="text-xs font-bold text-indigo-900 dark:text-indigo-200 uppercase tracking-wider">
                    Editar Datos Léxicos
                  </h3>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-gray-700 dark:text-gray-300">
                      Traducción al Español:
                    </label>
                    <input
                      type="text"
                      value={editTranslation}
                      onChange={(e) => setEditTranslation(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-[#121622] border border-gray-300 dark:border-gray-700 text-xs font-semibold text-gray-900 dark:text-white"
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
                      className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-[#121622] border border-gray-300 dark:border-gray-700 text-xs text-gray-900 dark:text-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-gray-700 dark:text-gray-300">
                      Nivel CEFR:
                    </label>
                    <select
                      value={editCefr}
                      onChange={(e) => setEditCefr(e.target.value as CefrLevel)}
                      className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-[#121622] border border-gray-300 dark:border-gray-700 text-xs text-gray-900 dark:text-white"
                    >
                      <option value="A1">A1</option>
                      <option value="A2">A2</option>
                      <option value="B1">B1</option>
                      <option value="B2">B2</option>
                      <option value="C1">C1</option>
                      <option value="C2">C2</option>
                    </select>
                  </div>

                  <div className="pt-1">
                    <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-700 dark:text-gray-300">
                      <input
                        type="checkbox"
                        checked={editIsFalseFriend}
                        onChange={(e) => setEditIsFalseFriend(e.target.checked)}
                        className="rounded text-indigo-600"
                      />
                      <span>¿Es un Falso Amigo?</span>
                    </label>
                    {editIsFalseFriend && (
                      <input
                        type="text"
                        value={editFalseFriendNote}
                        onChange={(e) => setEditFalseFriendNote(e.target.value)}
                        placeholder="Nota de advertencia (ej. no significa actualmente)"
                        className="mt-1.5 w-full px-3 py-1.5 rounded-lg bg-white dark:bg-[#121622] border border-amber-300 dark:border-amber-700 text-xs text-amber-900 dark:text-amber-200"
                      />
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <Button
                      onPress={handleSaveEdit}
                      isDisabled={isSavingEdit || !editTranslation.trim()}
                      className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{isSavingEdit ? 'Guardando...' : 'Guardar Cambios'}</span>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Meaning in Spanish */}
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 block mb-1">
                      Traducción al Español
                    </span>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">
                      {currentVocab.translationEs}
                    </p>
                  </div>

                  {/* Definition in English */}
                  {currentVocab.definitionEn && (
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 block mb-1">
                        Definición en Inglés
                      </span>
                      <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed font-sans">
                        {currentVocab.definitionEn}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* False Friend Warning Banner */}
              {currentVocab.isFalseFriend && (
                <div className="p-4 rounded-2xl bg-amber-500/10 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/60 space-y-1.5">
                  <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300 font-bold text-xs">
                    <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                    <span>Alerta de Interferencia L1 (Falso Amigo)</span>
                  </div>
                  <p className="text-xs text-amber-900 dark:text-amber-200/90 leading-relaxed">
                    {currentVocab.falseFriendNote ||
                      'Este término se asemeja ortográficamente a una palabra en español con un significado completamente distinto. Evita la traducción literal.'}
                  </p>
                </div>
              )}

              {/* Authentic Context Examples */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="p-1 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                      <BookOpen className="w-3.5 h-3.5" />
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                      Oraciones en Contexto ({examples.length})
                    </span>
                  </div>
                </div>

                {examples.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">No hay oraciones registradas para este término.</p>
                ) : (
                  <div className="space-y-2.5">
                    {examples.map((ex) => {
                      const isPlayingEx = playingExampleId === ex.id;
                      return (
                        <div
                          key={ex.id}
                          className="group/ex p-3.5 rounded-2xl bg-gray-50/80 dark:bg-[#141824] border border-gray-200/60 dark:border-white/[0.06] space-y-1.5 transition-colors hover:border-indigo-200 dark:hover:border-indigo-800/60"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-editorial text-sm text-gray-900 dark:text-white italic leading-relaxed flex-1">
                              &ldquo;{ex.sentenceEn}&rdquo;
                            </p>
                            <button
                              type="button"
                              onClick={() => handleSpeakExample(ex)}
                              disabled={isPlayingEx}
                              className={`p-1.5 rounded-lg border border-transparent hover:border-gray-200 dark:hover:border-gray-700 hover:bg-white dark:hover:bg-gray-800 transition-colors cursor-pointer shrink-0 ${
                                isPlayingEx ? 'text-indigo-600 animate-pulse' : 'text-gray-400 hover:text-indigo-600'
                              }`}
                              title="Escuchar oración completa"
                            >
                              <Volume2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          {ex.sentenceEs && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {ex.sentenceEs}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Verb Tenses (for verbs) */}
              {currentVocab.partOfSpeech === 'VERB' && currentVocab.verbTensesJson && (
                <div className="pt-1">
                  <VerbTensesCard tenses={currentVocab.verbTensesJson} />
                </div>
              )}

              {/* Morphological Word Family */}
              <StructuredFamilyCard
                family={currentVocab.structuredFamilyJson}
                legacyFamily={currentVocab.morphologicalFamilyJson}
              />

              {/* SRS Retention Status Box */}
              <div className="p-4 rounded-2xl bg-gray-50/70 dark:bg-[#121622] border border-gray-200/80 dark:border-white/[0.08] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="p-1 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                      <Brain className="w-3.5 h-3.5" />
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                      Estado de Retención FSRS
                    </span>
                  </div>
                  {srsCard && (
                    <span className="text-[10px] px-2 py-0.5 rounded-md font-mono font-bold bg-emerald-100/80 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      {srsCard.state}
                    </span>
                  )}
                </div>

                {srsCard ? (
                  <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                    <div className="p-2 rounded-xl bg-white dark:bg-[#161B28] border border-gray-100 dark:border-white/[0.04]">
                      <span className="text-[10px] text-gray-400 block">Estabilidad</span>
                      <span className="text-xs font-bold text-gray-800 dark:text-gray-200 font-mono">
                        {srsCard.stability.toFixed(1)}d
                      </span>
                    </div>
                    <div className="p-2 rounded-xl bg-white dark:bg-[#161B28] border border-gray-100 dark:border-white/[0.04]">
                      <span className="text-[10px] text-gray-400 block">Dificultad</span>
                      <span className="text-xs font-bold text-gray-800 dark:text-gray-200 font-mono">
                        {srsCard.difficulty.toFixed(1)}/10
                      </span>
                    </div>
                    <div className="p-2 rounded-xl bg-white dark:bg-[#161B28] border border-gray-100 dark:border-white/[0.04]">
                      <span className="text-[10px] text-gray-400 block">Repasos</span>
                      <span className="text-xs font-bold text-gray-800 dark:text-gray-200 font-mono">
                        {srsCard.reps}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Esta palabra aún no cuenta con tarjeta asociada en el algoritmo de repetición espaciada.
                  </p>
                )}
              </div>
            </DrawerBody>

            {/* Drawer Footer Actions */}
            <DrawerFooter className="!mt-0 m-0 p-4 px-6 border-t border-gray-100 dark:border-white/[0.06] bg-gray-50/50 dark:bg-[#121622]/50 flex flex-row items-center justify-between shrink-0 gap-0">
              {showDeleteConfirm ? (
                <div className="flex items-center justify-between w-full gap-2">
                  <span className="text-xs text-rose-600 dark:text-rose-400 font-semibold">
                    ¿Eliminar {currentVocab.word}?
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(false)}
                      className="px-2.5 py-1 rounded-lg border border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-600 dark:text-gray-400 cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold cursor-pointer"
                    >
                      {isDeleting ? 'Eliminando...' : 'Sí, eliminar'}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="text-xs text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Eliminar término</span>
                  </button>

                  <Button
                    onPress={onClose}
                    className="px-4 py-1.5 rounded-xl bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold text-xs cursor-pointer"
                  >
                    Cerrar
                  </Button>
                </>
              )}
            </DrawerFooter>
          </DrawerDialog>
        </DrawerContent>
      </DrawerBackdrop>
    </Drawer>
  );
}
