import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  X,
  Sparkles,
  AlertCircle,
  Check,
  Loader2,
  AlertTriangle,
  SlidersHorizontal,
  BookOpen,
  Info,
  Layers,
  ArrowRight,
  CheckSquare,
  Square,
} from 'lucide-react';
import {
  CefrLevel,
  GrammaticalDimension,
  PartOfSpeech,
  PART_OF_SPEECH_LABELS_ES,
  VerbTenses,
  StructuredWordFamily,
  VocabSense,
  SpellingCorrectionInfo,
  VocabItem,
} from '@/core/types/vocab';
import { NewVocabPayload } from '../hooks/useVocabList';
import { useAiGateway } from '@/shared/hooks/useAiGateway';
import { StructuredFamilyCard } from './StructuredFamilyCard';

export interface AddVocabModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddWord: (payload: NewVocabPayload) => Promise<unknown>;
  onAddMultipleWords?: (payloads: NewVocabPayload[]) => Promise<unknown>;
  existingWords?: VocabItem[];
}

export function AddVocabModal({
  isOpen,
  onClose,
  onAddWord,
  onAddMultipleWords,
  existingWords = [],
}: AddVocabModalProps) {
  const { aiGateway, orchestrator } = useAiGateway();
  const isAiConnected = Boolean(
    orchestrator.getApiKeys().some((k) => k?.isActive && ((k?.secretKey?.trim()?.length ?? 0) > 0 || (k?.maskedKey?.trim()?.length ?? 0) > 0)),
  );

  const [word, setWord] = useState('');
  const [translationEs, setTranslationEs] = useState('');
  const [definitionEn, setDefinitionEn] = useState('');
  const [ipaGeneralAmerican, setIpaGeneralAmerican] = useState('');
  const [cefrLevel, setCefrLevel] = useState<CefrLevel>('B1');
  const [partOfSpeech, setPartOfSpeech] = useState<PartOfSpeech>('NOUN');
  const [grammaticalDimension, setGrammaticalDimension] = useState<GrammaticalDimension>('CONTENT');
  const [domainCategory, setDomainCategory] = useState('Uso General');
  const [exampleSentenceEn, setExampleSentenceEn] = useState('');
  const [exampleSentenceEs, setExampleSentenceEs] = useState('');
  const [isFalseFriend, setIsFalseFriend] = useState(false);
  const [falseFriendNote, setFalseFriendNote] = useState('');

  // Rich lexical data
  const [verbTenses, setVerbTenses] = useState<VerbTenses | null>(null);
  const [structuredFamily, setStructuredFamily] = useState<StructuredWordFamily | null>(null);
  const [morphologicalFamily, setMorphologicalFamily] = useState<string[]>([]);
  const [senses, setSenses] = useState<VocabSense[]>([]);
  const [selectedSenseIds, setSelectedSenseIds] = useState<string[]>([]);
  const [includePrimarySense, setIncludePrimarySense] = useState(true);

  // Spelling correction
  const [spellingCorrection, setSpellingCorrection] = useState<SpellingCorrectionInfo | null>(null);
  const [userOriginalWord, setUserOriginalWord] = useState<string>('');

  const [isEnriching, setIsEnriching] = useState(false);
  const [hasEnriched, setHasEnriched] = useState(false);
  const [activeTab, setActiveTab] = useState<'preview' | 'manual'>('preview');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Duplicate detection in existing words
  const duplicateMatches = useMemo(() => {
    const clean = (word || '').trim().toLowerCase();
    if (!clean) return [];
    return existingWords.filter((w) => (w?.word || '').trim().toLowerCase() === clean);
  }, [word, existingWords]);

  const resetForm = () => {
    setWord('');
    setTranslationEs('');
    setDefinitionEn('');
    setIpaGeneralAmerican('');
    setCefrLevel('B1');
    setPartOfSpeech('NOUN');
    setGrammaticalDimension('CONTENT');
    setDomainCategory('Uso General');
    setExampleSentenceEn('');
    setExampleSentenceEs('');
    setIsFalseFriend(false);
    setFalseFriendNote('');
    setVerbTenses(null);
    setStructuredFamily(null);
    setMorphologicalFamily([]);
    setSenses([]);
    setSelectedSenseIds([]);
    setIncludePrimarySense(true);
    setSpellingCorrection(null);
    setUserOriginalWord('');
    setHasEnriched(false);
    setActiveTab('preview');
    setErrorMsg(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleEnrichWord = async (customWord?: string) => {
    const targetWord = (customWord ?? word).trim();
    if (!targetWord) {
      setErrorMsg('Por favor escribe la palabra en inglés.');
      return;
    }

    if (!isAiConnected) {
      setErrorMsg(
        'No hay ninguna API Key de Google Gemini activa. Ve a la pestaña "Modelos de IA" para registrar tu clave antes de consultar a la IA.',
      );
      return;
    }

    setIsEnriching(true);
    setErrorMsg(null);
    setUserOriginalWord(targetWord);

    try {
      const data = await aiGateway.lookupVocabWord(targetWord);
      setWord(data.word || targetWord);
      setTranslationEs(data.translationEs);
      setDefinitionEn(data.definitionEn);
      setIpaGeneralAmerican(data.ipaGeneralAmerican);
      setCefrLevel(data.cefrLevel);
      setPartOfSpeech(data.partOfSpeech);
      setGrammaticalDimension(data.grammaticalDimension);
      setDomainCategory(data.domainCategory || 'Uso General');
      setExampleSentenceEn(data.exampleSentenceEn);
      setExampleSentenceEs(data.exampleSentenceEs);
      setIsFalseFriend(data.isFalseFriend);
      setFalseFriendNote(data.falseFriendNote || '');
      setVerbTenses(data.verbTenses ?? null);
      setStructuredFamily(data.structuredFamily ?? null);
      setMorphologicalFamily(data.morphologicalFamily || []);

      if (data.senses && data.senses.length > 0) {
        setSenses(data.senses);
        // By default, select all alternate senses too so user has full control
        setSelectedSenseIds(data.senses.map((s) => s.id));
      } else {
        setSenses([]);
        setSelectedSenseIds([]);
      }
      setIncludePrimarySense(true);

      if (data.spellingCorrection && data.spellingCorrection.hasCorrection) {
        setSpellingCorrection(data.spellingCorrection);
      } else {
        setSpellingCorrection(null);
      }

      setHasEnriched(true);
      setActiveTab('preview');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error al consultar a la IA');
    } finally {
      setIsEnriching(false);
    }
  };

  const handleRevertSpelling = () => {
    if (userOriginalWord) {
      setWord(userOriginalWord);
      setSpellingCorrection(null);
    }
  };

  const toggleSenseSelection = (senseId: string) => {
    setSelectedSenseIds((prev) =>
      prev.includes(senseId) ? prev.filter((id) => id !== senseId) : [...prev, senseId],
    );
  };

  const CEFR_ORDER: Record<CefrLevel, number> = {
    A1: 1,
    A2: 2,
    B1: 3,
    B2: 4,
    C1: 5,
    C2: 6,
  };

  const handleSelectByMaxCefr = (maxLevel: CefrLevel) => {
    const maxRank = CEFR_ORDER[maxLevel];
    const primaryRank = CEFR_ORDER[cefrLevel] || 3;
    setIncludePrimarySense(primaryRank <= maxRank);

    const matchingIds = senses
      .filter((s) => (CEFR_ORDER[s.cefrLevel] || 3) <= maxRank)
      .map((s) => s.id);
    setSelectedSenseIds(matchingIds);
  };

  const handleSelectOnlyPrimary = () => {
    setIncludePrimarySense(true);
    setSelectedSenseIds([]);
  };

  const handleSelectAllSenses = () => {
    if (selectedSenseIds.length === senses.length && includePrimarySense) {
      // Unselect alternates, keep primary
      setSelectedSenseIds([]);
    } else {
      setIncludePrimarySense(true);
      setSelectedSenseIds(senses.map((s) => s.id));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanWord = word.trim();
    if (!cleanWord) {
      setErrorMsg('Por favor escribe una palabra en inglés.');
      return;
    }

    let curWord = cleanWord;
    let curTranslation = translationEs.trim();
    let curDefinition = definitionEn.trim();
    let curIpa = ipaGeneralAmerican.trim();
    let curCefr = cefrLevel;
    let curPos = partOfSpeech;
    let curDim = grammaticalDimension;
    let curDomain = domainCategory;
    let curExEn = exampleSentenceEn.trim();
    let curExEs = exampleSentenceEs.trim();
    let curIsFalseFriend = isFalseFriend;
    let curFalseNote = falseFriendNote.trim();
    let curVerbTenses = verbTenses;
    let curStructuredFamily = structuredFamily;
    let curMorph = morphologicalFamily;
    let curSenses = senses;

    // If no translation yet, auto-enrich with AI
    if (!curTranslation) {
      if (!isAiConnected) {
        setErrorMsg(
          'Para autocompletar la palabra con IA debes registrar tu clave en "Modelos de IA". O puedes completar los campos manualmente en "Ajustes Manuales".',
        );
        setActiveTab('manual');
        return;
      }
      try {
        setIsEnriching(true);
        setErrorMsg(null);
        const data = await aiGateway.lookupVocabWord(cleanWord);
        curWord = data.word;
        curTranslation = data.translationEs;
        curDefinition = data.definitionEn;
        curIpa = data.ipaGeneralAmerican;
        curCefr = data.cefrLevel;
        curPos = data.partOfSpeech;
        curDim = data.grammaticalDimension;
        curDomain = data.domainCategory || 'Uso General';
        curExEn = data.exampleSentenceEn;
        curExEs = data.exampleSentenceEs;
        curIsFalseFriend = data.isFalseFriend;
        curFalseNote = data.falseFriendNote || '';
        curVerbTenses = data.verbTenses ?? null;
        curStructuredFamily = data.structuredFamily ?? null;
        curMorph = data.morphologicalFamily || [];
        curSenses = data.senses || [];
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : 'Error al consultar a la IA');
        setIsEnriching(false);
        return;
      } finally {
        setIsEnriching(false);
      }
    }

    try {
      setIsSubmitting(true);
      setErrorMsg(null);
      if (!curDefinition) {
        curDefinition = curTranslation || curWord;
      }

      // Check if user selected multiple senses to save
      const selectedAlternateSenses = curSenses.filter((s) => selectedSenseIds.includes(s.id));

      const payloadsToCreate: NewVocabPayload[] = [];

      // 1. Primary sense
      if (includePrimarySense) {
        payloadsToCreate.push({
          word: curWord,
          translationEs: curTranslation,
          definitionEn: curDefinition,
          ipaGeneralAmerican: curIpa || undefined,
          cefrLevel: curCefr,
          partOfSpeech: curPos,
          grammaticalDimension: curDim,
          domainCategory: curDomain,
          exampleSentenceEn: curExEn || undefined,
          exampleSentenceEs: curExEs || undefined,
          isFalseFriend: curIsFalseFriend,
          falseFriendNote: curIsFalseFriend ? curFalseNote : undefined,
          verbTenses: curVerbTenses,
          structuredFamily: curStructuredFamily,
          morphologicalFamily: curMorph,
          createSrsCard: true,
        });
      }

      // 2. Each selected alternate sense becomes its own atomic contextual card
      for (const sense of selectedAlternateSenses) {
        payloadsToCreate.push({
          word: curWord,
          translationEs: sense.translationEs,
          definitionEn: sense.definitionEn,
          ipaGeneralAmerican: curIpa || undefined,
          cefrLevel: sense.cefrLevel,
          partOfSpeech: sense.partOfSpeech,
          grammaticalDimension: curDim,
          domainCategory: sense.domainCategory,
          exampleSentenceEn: sense.exampleSentenceEn,
          exampleSentenceEs: sense.exampleSentenceEs,
          isFalseFriend: curIsFalseFriend,
          falseFriendNote: curIsFalseFriend ? curFalseNote : undefined,
          verbTenses: curVerbTenses,
          structuredFamily: curStructuredFamily,
          morphologicalFamily: curMorph,
          createSrsCard: true,
        });
      }

      if (payloadsToCreate.length === 0) {
        setErrorMsg('Debes seleccionar al menos una acepción para guardar.');
        setIsSubmitting(false);
        return;
      }

      if (payloadsToCreate.length > 1 && onAddMultipleWords) {
        await onAddMultipleWords(payloadsToCreate);
      } else {
        for (const p of payloadsToCreate) {
          await onAddWord(p);
        }
      }

      handleClose();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error al guardar la palabra');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitRef = useRef(handleSubmit);
  useEffect(() => {
    handleSubmitRef.current = handleSubmit;
  });

  const handleCloseRef = useRef(handleClose);
  useEffect(() => {
    handleCloseRef.current = handleClose;
  });

  // Keyboard navigation: Escape to close, Ctrl+Enter to submit
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleCloseRef.current();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSubmitRef.current(e as unknown as React.FormEvent);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const cefrLevels: CefrLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

  const getCefrBadgeStyle = (level: CefrLevel) => {
    switch (level) {
      case 'A1':
      case 'A2':
        return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800';
      case 'B1':
      case 'B2':
        return 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800';
      case 'C1':
      case 'C2':
        return 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-300 dark:border-purple-800';
    }
  };

  if (!isOpen) return null;

  const totalSelectedCount = (includePrimarySense ? 1 : 0) + selectedSenseIds.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl bg-white dark:bg-[#121622] rounded-3xl border border-gray-200/80 dark:border-white/[0.08] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-white/[0.06] flex items-center justify-between shrink-0 bg-gray-50/50 dark:bg-[#161B28]/50">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Sparkles className="w-4 h-4" />
            </span>
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-white font-sans">
                Agregar Término al Catálogo
              </h2>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                Escribe en inglés y la IA extraerá automáticamente acepciones, fonética, tiempos verbales y ejemplos.
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
            title="Cerrar (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto custom-scrollbar space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-xs text-rose-800 dark:text-rose-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Primary Word Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
              Palabra o Expresión en Inglés
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={word}
                onChange={(e) => {
                  setWord(e.target.value);
                  if (hasEnriched) setHasEnriched(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !hasEnriched) {
                    e.preventDefault();
                    handleEnrichWord();
                  }
                }}
                placeholder="ej: resilient, run, break, accommodation"
                required
                disabled={isEnriching || isSubmitting}
                className="flex-1 px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-[#161B28] border border-gray-200 dark:border-gray-700/70 text-sm font-semibold text-gray-900 dark:text-white placeholder-gray-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 transition-all font-sans"
              />
              <button
                type="button"
                onClick={() => handleEnrichWord()}
                disabled={!word.trim() || isEnriching || isSubmitting}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-xs shadow-sm transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                {isEnriching ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Analizando...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Consultar IA</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Real-time Duplicate Detection Banner */}
          {duplicateMatches.length > 0 && (
            <div className="p-3 rounded-2xl bg-amber-500/10 dark:bg-amber-950/30 border border-amber-300/80 dark:border-amber-700/60 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5 animate-in fade-in duration-200">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold">Coincidencia en Catálogo:</span>
                  <span>Ya tienes <strong>&ldquo;{duplicateMatches[0].word}&rdquo;</strong> registrado</span>
                  <span className="px-1.5 py-0.2 rounded bg-amber-200/60 dark:bg-amber-900/60 text-[10px] font-mono">
                    {duplicateMatches[0].domainCategory || 'General'}: {duplicateMatches[0].translationEs}
                  </span>
                </div>
                <p className="text-[11px] text-amber-700 dark:text-amber-300">
                  Puedes registrar un <strong>nuevo significado contextual</strong> (ej. acepción en otro dominio o categoría gramatical) o actualizar la tarjeta existente.
                </p>
              </div>
            </div>
          )}

          {/* Spelling Correction Banner ("Did you mean?") */}
          {spellingCorrection && spellingCorrection.hasCorrection && (
            <div className="p-3.5 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/80 text-xs space-y-2 animate-in fade-in duration-200">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="p-1 rounded-md bg-indigo-600 text-white">
                    <Sparkles className="w-3.5 h-3.5" />
                  </span>
                  <div>
                    <span className="font-bold text-indigo-950 dark:text-indigo-200">
                      Sugerencia Ortográfica Detectada:
                    </span>{' '}
                    <span className="text-gray-600 dark:text-gray-300">
                      Has escrito <code className="px-1.5 py-0.5 rounded bg-white dark:bg-[#121622] font-mono text-rose-600 line-through">{spellingCorrection.originalInput}</code>
                    </span>
                    <ArrowRight className="inline-block w-3 h-3 mx-1 text-indigo-500" />
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">
                      {spellingCorrection.correctedWord}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleRevertSpelling}
                  className="text-[11px] text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-300 underline cursor-pointer"
                >
                  Conservar grafía original
                </button>
              </div>

              {spellingCorrection.explanationEs && (
                <p className="text-[11px] text-indigo-700 dark:text-indigo-300 pl-7">
                  {spellingCorrection.explanationEs}
                </p>
              )}
            </div>
          )}

          {/* Loading Animation Box */}
          {isEnriching && (
            <div className="p-5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/50 flex items-center gap-3.5 animate-pulse">
              <div className="p-2.5 rounded-xl bg-indigo-600 text-white">
                <Sparkles className="w-4 h-4 animate-spin" />
              </div>
              <div className="text-xs">
                <p className="font-bold text-indigo-900 dark:text-indigo-200">
                  Analizando término con IA lexicográfica...
                </p>
                <p className="text-[11px] text-indigo-600 dark:text-indigo-400">
                  Categorizando dominios semánticos, conjugaciones verbales, fonética IPA y oraciones contextuales.
                </p>
              </div>
            </div>
          )}

          {/* PREVIEW EMPTY STATE: When user has not clicked Consultar IA yet */}
          {!hasEnriched && !isEnriching && activeTab === 'preview' && (
            <div className="p-8 rounded-3xl border border-dashed border-gray-200 dark:border-white/[0.08] bg-gray-50/40 dark:bg-[#151928]/40 text-center space-y-2">
              <div className="mx-auto w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Info className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">
                La vista previa se generará tras consultar a la IA
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 max-w-md mx-auto leading-relaxed">
                Escribe una palabra o expresión en el campo superior y presiona <strong>&ldquo;Consultar IA&rdquo;</strong> (o <kbd className="font-mono bg-gray-200 dark:bg-gray-800 px-1 py-0.5 rounded text-[10px]">Enter</kbd>). La IA extraerá automáticamente todas sus acepciones, categoría gramatical, tiempos verbales y pronunciación.
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('manual')}
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold cursor-pointer inline-flex items-center gap-1"
                >
                  <SlidersHorizontal className="w-3 h-3" />
                  <span>¿Prefieres rellenar los datos manualmente? Haz clic aquí</span>
                </button>
              </div>
            </div>
          )}

          {/* Enriched Content or Manual Configuration */}
          {(hasEnriched || activeTab === 'manual') && !isEnriching && (
            <div className="space-y-4 pt-1">
              {/* Tab selector */}
              <div className="flex items-center gap-2 border-b border-gray-100 dark:border-white/[0.06] pb-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('preview')}
                  className={`text-xs font-semibold px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                    activeTab === 'preview'
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
                      : 'text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                  }`}
                >
                  Vista Previa Enriquecida {hasEnriched && '✓'}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('manual')}
                  className={`text-xs font-semibold px-3 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'manual'
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
                      : 'text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                  }`}
                >
                  <SlidersHorizontal className="w-3 h-3" />
                  <span>Ajustes Manuales</span>
                </button>
              </div>

              {activeTab === 'preview' ? (
                <div className="space-y-4">
                  {/* Single Word Card (rendered ONLY when there is a single definition, no alternate senses) */}
                  {senses.length === 0 && (
                    <div className="p-4 rounded-2xl bg-gray-50/80 dark:bg-[#161B28]/80 border border-gray-200/80 dark:border-white/[0.08] space-y-3">
                      <div className="flex items-center justify-between flex-wrap gap-2 pb-2.5 border-b border-gray-200/60 dark:border-white/[0.06]">
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-bold text-gray-900 dark:text-white font-sans">
                            {word}
                          </span>
                          {ipaGeneralAmerican && (
                            <span
                              className="font-phonetic text-sm font-semibold text-indigo-600 dark:text-indigo-400"
                              style={{ fontFamily: 'var(--font-phonetic)' }}
                            >
                              /{ipaGeneralAmerican}/
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 flex-wrap">
                          {/* Automatic Domain Category Badge assigned by AI */}
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                            {domainCategory}
                          </span>
                          <span
                            className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-md border ${getCefrBadgeStyle(
                              cefrLevel,
                            )}`}
                          >
                            {cefrLevel}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-gray-200/70 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium">
                            {PART_OF_SPEECH_LABELS_ES[partOfSpeech] ?? partOfSpeech}
                          </span>
                        </div>
                      </div>

                      {/* Translation */}
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 block mb-1">
                          Traducción al Español:
                        </label>
                        <input
                          type="text"
                          value={translationEs}
                          onChange={(e) => setTranslationEs(e.target.value)}
                          placeholder="Traducción al español..."
                          className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-[#121622] border border-gray-200/80 dark:border-white/[0.08] text-xs font-semibold text-gray-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>

                      {/* English Definition */}
                      {definitionEn && (
                        <p className="text-xs text-gray-600 dark:text-gray-300 font-sans">
                          {definitionEn}
                        </p>
                      )}

                      {/* Context sentence for primary sense */}
                      {exampleSentenceEn && (
                        <div className="p-3 rounded-xl bg-white/80 dark:bg-[#121622]/80 border border-gray-200/60 dark:border-white/[0.06] text-xs space-y-1">
                          <div className="flex items-center gap-1 text-[10px] font-semibold text-indigo-600 dark:text-indigo-400">
                            <BookOpen className="w-3 h-3" />
                            <span>Ejemplo en Contexto Real:</span>
                          </div>
                          <p className="font-editorial italic text-gray-800 dark:text-gray-200 text-xs">
                            &ldquo;{exampleSentenceEn}&rdquo;
                          </p>
                          {exampleSentenceEs && (
                            <p className="text-[11px] text-gray-500 dark:text-gray-400">
                              {exampleSentenceEs}
                            </p>
                          )}
                        </div>
                      )}

                      {/* False friend notice if applicable */}
                      {isFalseFriend && (
                        <div className="p-2.5 rounded-xl bg-amber-500/10 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-700/50 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                          <div>
                            <strong className="font-semibold block text-[11px]">Falso Amigo:</strong>
                            <span className="text-[11px]">
                              {falseFriendNote || 'Presta atención a su significado real.'}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* False friend notice when multiple senses are present */}
                  {senses.length > 0 && isFalseFriend && (
                    <div className="p-3 rounded-2xl bg-amber-500/10 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-700/50 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="font-semibold block text-xs">Alerta de Falso Amigo:</strong>
                        <span className="text-xs">
                          {falseFriendNote || 'Presta atención al significado real en cada contexto.'}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Multiple Senses Selection Section (Automatic domain categories from AI) */}
                  {senses.length > 0 && (
                    <div className="p-4 rounded-2xl bg-indigo-50/40 dark:bg-[#141825] border border-indigo-100 dark:border-indigo-900/40 space-y-3">
                      <div className="flex items-center justify-between flex-wrap gap-2 pb-1 border-b border-indigo-100/60 dark:border-white/[0.06]">
                        <div className="flex items-center gap-2.5">
                          <span className="p-1.5 rounded-xl bg-indigo-600 text-white shrink-0">
                            <Layers className="w-4 h-4" />
                          </span>
                          <div>
                            <div className="flex items-baseline gap-2">
                              <h4 className="text-base font-bold tracking-tight text-gray-900 dark:text-white font-sans">
                                {word}
                              </h4>
                              {ipaGeneralAmerican && (
                                <span className="font-phonetic text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                                  /{ipaGeneralAmerican}/
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">
                              Acepciones y Significados Detectados ({senses.length + 1}) — Selecciona las que deseas registrar según tu nivel
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={handleSelectAllSenses}
                          className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold cursor-pointer shrink-0"
                        >
                          {selectedSenseIds.length === senses.length && includePrimarySense
                            ? 'Solo significado principal'
                            : 'Seleccionar todas'}
                        </button>
                      </div>

                      {/* CEFR Level Quick-Select Filter Bar */}
                      <div className="flex items-center gap-1.5 flex-wrap pt-0.5 text-xs">
                        <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 mr-0.5">
                          Selección por nivel:
                        </span>
                        <button
                          type="button"
                          onClick={handleSelectAllSenses}
                          className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border transition-colors cursor-pointer ${
                            selectedSenseIds.length === senses.length && includePrimarySense
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                              : 'bg-white dark:bg-[#10131D] text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                          }`}
                        >
                          Todas
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSelectByMaxCefr('A2')}
                          className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60 transition-colors cursor-pointer"
                        >
                          Hasta A2
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSelectByMaxCefr('B1')}
                          className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/60 transition-colors cursor-pointer"
                        >
                          Hasta B1
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSelectByMaxCefr('B2')}
                          className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/60 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 border border-purple-200/80 dark:border-purple-800/60 transition-colors cursor-pointer"
                        >
                          Hasta B2
                        </button>
                        <button
                          type="button"
                          onClick={handleSelectOnlyPrimary}
                          className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-750 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 transition-colors cursor-pointer"
                        >
                          Solo Principal
                        </button>
                      </div>

                      <div className="space-y-2">
                        {/* Primary sense checkbox item */}
                        <div
                          onClick={() => setIncludePrimarySense(!includePrimarySense)}
                          className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-2.5 ${
                            includePrimarySense
                              ? 'bg-white dark:bg-[#10131D] border-indigo-300 dark:border-indigo-700 shadow-xs'
                              : 'bg-gray-50/60 dark:bg-[#10131D]/40 border-gray-200 dark:border-gray-800 opacity-60'
                          }`}
                        >
                          <div className="mt-0.5 text-indigo-600 dark:text-indigo-400">
                            {includePrimarySense ? (
                              <CheckSquare className="w-4 h-4" />
                            ) : (
                              <Square className="w-4 h-4" />
                            )}
                          </div>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <span className="text-xs font-bold text-gray-900 dark:text-white">
                                1. {translationEs} (Principal)
                              </span>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span
                                  className={`text-[10px] font-bold font-mono px-1.5 py-0.5 rounded border ${getCefrBadgeStyle(
                                    cefrLevel,
                                  )}`}
                                >
                                  {cefrLevel}
                                </span>
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                                  {domainCategory}
                                </span>
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 font-medium">
                                  {PART_OF_SPEECH_LABELS_ES[partOfSpeech] ?? partOfSpeech}
                                </span>
                              </div>
                            </div>
                            <p className="text-[11px] text-gray-600 dark:text-gray-400">
                              {definitionEn}
                            </p>
                            {exampleSentenceEn && (
                              <p className="text-[11px] font-editorial italic text-gray-700 dark:text-gray-300">
                                &ldquo;{exampleSentenceEn}&rdquo;
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Alternate Senses */}
                        {senses.map((sense, idx) => {
                          const isSelected = selectedSenseIds.includes(sense.id);
                          return (
                            <div
                              key={sense.id}
                              onClick={() => toggleSenseSelection(sense.id)}
                              className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-2.5 ${
                                isSelected
                              ? 'bg-white dark:bg-[#10131D] border-indigo-300 dark:border-indigo-700 shadow-xs'
                              : 'bg-gray-50/60 dark:bg-[#10131D]/40 border-gray-200 dark:border-gray-800 opacity-60'
                              }`}
                            >
                              <div className="mt-0.5 text-indigo-600 dark:text-indigo-400">
                                {isSelected ? (
                                  <CheckSquare className="w-4 h-4" />
                                ) : (
                                  <Square className="w-4 h-4" />
                                )}
                              </div>
                              <div className="flex-1 space-y-1">
                                <div className="flex items-center justify-between gap-2 flex-wrap">
                                  <span className="text-xs font-bold text-gray-900 dark:text-white">
                                    {idx + 2}. {sense.translationEs}
                                  </span>
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span
                                      className={`text-[10px] font-bold font-mono px-1.5 py-0.5 rounded border ${getCefrBadgeStyle(
                                        sense.cefrLevel || 'B1',
                                      )}`}
                                    >
                                      {sense.cefrLevel || 'B1'}
                                    </span>
                                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                                      {sense.domainCategory}
                                    </span>
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 font-medium">
                                      {PART_OF_SPEECH_LABELS_ES[sense.partOfSpeech] ?? sense.partOfSpeech}
                                    </span>
                                  </div>
                                </div>
                                <p className="text-[11px] text-gray-600 dark:text-gray-400">
                                  {sense.definitionEn}
                                </p>
                                <p className="text-[11px] font-editorial italic text-gray-700 dark:text-gray-300">
                                  &ldquo;{sense.exampleSentenceEn}&rdquo;
                                </p>
                                {sense.exampleSentenceEs && (
                                  <p className="text-[10px] text-gray-500 dark:text-gray-400">
                                    {sense.exampleSentenceEs}
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Morphological Word Family Card */}
                  <StructuredFamilyCard
                    family={structuredFamily}
                    legacyFamily={morphologicalFamily}
                  />
                </div>
              ) : (
                /* MANUAL SETTINGS TAB */
                <div className="space-y-3 pt-1">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-300 mb-1">
                        Traducción al Español
                      </label>
                      <input
                        type="text"
                        value={translationEs}
                        onChange={(e) => setTranslationEs(e.target.value)}
                        placeholder="ej: resiliente"
                        className="w-full px-3 py-1.5 rounded-lg bg-gray-50 dark:bg-[#161B28] border border-gray-200 dark:border-gray-700 text-xs text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-300 mb-1">
                        Fonética IPA
                      </label>
                      <input
                        type="text"
                        value={ipaGeneralAmerican}
                        onChange={(e) => setIpaGeneralAmerican(e.target.value)}
                        placeholder="ej: /rɪˈzɪljənt/"
                        className="w-full px-3 py-1.5 rounded-lg bg-gray-50 dark:bg-[#161B28] border border-gray-200 dark:border-gray-700 text-xs font-mono text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>

                  {/* CEFR Level Segmented Pills */}
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-300 mb-1.5">
                      Nivel CEFR
                    </label>
                    <div className="flex items-center gap-1.5">
                      {cefrLevels.map((lvl) => {
                        const isSel = cefrLevel === lvl;
                        return (
                          <button
                            key={lvl}
                            type="button"
                            onClick={() => setCefrLevel(lvl)}
                            className={`flex-1 py-1 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer border ${
                              isSel
                                ? getCefrBadgeStyle(lvl) + ' ring-2 ring-indigo-500'
                                : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700'
                            }`}
                          >
                            {lvl}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-300 mb-1">
                        Categoría Gramatical
                      </label>
                      <select
                        value={partOfSpeech}
                        onChange={(e) => setPartOfSpeech(e.target.value as PartOfSpeech)}
                        className="w-full px-3 py-1.5 rounded-lg bg-gray-50 dark:bg-[#161B28] border border-gray-200 dark:border-gray-700 text-xs text-gray-900 dark:text-white"
                      >
                        <option value="NOUN">Sustantivo</option>
                        <option value="VERB">Verbo</option>
                        <option value="ADJECTIVE">Adjetivo</option>
                        <option value="ADVERB">Adverbio</option>
                        <option value="PREPOSITION">Preposición</option>
                        <option value="CONJUNCTION">Conjunción</option>
                        <option value="ARTICLE_DETERMINER">Artículo / Det.</option>
                        <option value="PRONOUN">Pronombre</option>
                        <option value="INTERJECTION">Interjección</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-300 mb-1">
                        Dimensión
                      </label>
                      <select
                        value={grammaticalDimension}
                        onChange={(e) => setGrammaticalDimension(e.target.value as GrammaticalDimension)}
                        className="w-full px-3 py-1.5 rounded-lg bg-gray-50 dark:bg-[#161B28] border border-gray-200 dark:border-gray-700 text-xs text-gray-900 dark:text-white"
                      >
                        <option value="CONTENT">Contenido Léxico</option>
                        <option value="FUNCTION">Palabra Funcional</option>
                        <option value="CHUNK">Expresión / Frase</option>
                      </select>
                    </div>
                  </div>

                  {/* Domain Category Input */}
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-300 mb-1">
                      Categoría Semántica / Dominio
                    </label>
                    <input
                      type="text"
                      value={domainCategory}
                      onChange={(e) => setDomainCategory(e.target.value)}
                      placeholder="ej: Finanzas, Informática, Uso General"
                      className="w-full px-3 py-1.5 rounded-lg bg-gray-50 dark:bg-[#161B28] border border-gray-200 dark:border-gray-700 text-xs text-gray-900 dark:text-white"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-300">
                      Oración de Ejemplo (Inglés y Español)
                    </label>
                    <input
                      type="text"
                      value={exampleSentenceEn}
                      onChange={(e) => setExampleSentenceEn(e.target.value)}
                      placeholder="Oración en inglés"
                      className="w-full px-3 py-1.5 rounded-lg bg-gray-50 dark:bg-[#161B28] border border-gray-200 dark:border-gray-700 text-xs text-gray-900 dark:text-white"
                    />
                    <input
                      type="text"
                      value={exampleSentenceEs}
                      onChange={(e) => setExampleSentenceEs(e.target.value)}
                      placeholder="Traducción de la oración al español"
                      className="w-full px-3 py-1.5 rounded-lg bg-gray-50 dark:bg-[#161B28] border border-gray-200 dark:border-gray-700 text-xs text-gray-900 dark:text-white"
                    />
                  </div>

                  {/* False friend toggle */}
                  <div className="pt-1">
                    <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-700 dark:text-gray-300">
                      <input
                        type="checkbox"
                        checked={isFalseFriend}
                        onChange={(e) => setIsFalseFriend(e.target.checked)}
                        className="rounded text-indigo-600"
                      />
                      <span>¿Es un Falso Amigo (palabra engañosa en español)?</span>
                    </label>
                    {isFalseFriend && (
                      <input
                        type="text"
                        value={falseFriendNote}
                        onChange={(e) => setFalseFriendNote(e.target.value)}
                        placeholder="Nota aclaratoria (ej. No significa 'actualmente')"
                        className="mt-1.5 w-full px-3 py-1.5 rounded-lg bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 text-xs text-amber-900 dark:text-amber-200"
                      />
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-3 border-t border-gray-100 dark:border-white/[0.06] flex items-center justify-between gap-2.5">
            <span className="text-[10px] text-gray-400 hidden sm:inline">
              Tip: Presiona <kbd className="font-mono bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">Ctrl+Enter</kbd> para guardar
            </span>

            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={handleClose}
                className="px-3.5 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 text-xs font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting || isEnriching || !word.trim()}
                className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Guardando...</span>
                  </>
                ) : hasEnriched ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>
                      {totalSelectedCount > 1
                        ? `Guardar ${totalSelectedCount} Acepciones`
                        : 'Guardar Término'}
                    </span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Autocompletar y Guardar</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
