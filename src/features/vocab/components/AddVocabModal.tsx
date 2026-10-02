import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Sparkles,
  AlertCircle,
  Check,
  Loader2,
  AlertTriangle,
  SlidersHorizontal,
  BookOpen,
} from 'lucide-react';
import { Button } from '@heroui/react';
import {
  CefrLevel,
  GrammaticalDimension,
  PartOfSpeech,
  PART_OF_SPEECH_LABELS_ES,
} from '@/core/types/vocab';
import { NewVocabPayload } from '../hooks/useVocabList';
import { useAiGateway } from '@/shared/hooks/useAiGateway';

export interface AddVocabModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddWord: (payload: NewVocabPayload) => Promise<unknown>;
}

export function AddVocabModal({ isOpen, onClose, onAddWord }: AddVocabModalProps) {
  const { aiGateway, orchestrator } = useAiGateway();
  const isAiConnected = Boolean(
    orchestrator.getApiKeys().some((k) => k?.isActive && (k?.secretKey?.trim()?.length ?? 0) > 0),
  );

  const [word, setWord] = useState('');
  const [translationEs, setTranslationEs] = useState('');
  const [definitionEn, setDefinitionEn] = useState('');
  const [ipaGeneralAmerican, setIpaGeneralAmerican] = useState('');
  const [cefrLevel, setCefrLevel] = useState<CefrLevel>('B1');
  const [partOfSpeech, setPartOfSpeech] = useState<PartOfSpeech>('NOUN');
  const [grammaticalDimension, setGrammaticalDimension] = useState<GrammaticalDimension>('CONTENT');
  const [exampleSentenceEn, setExampleSentenceEn] = useState('');
  const [exampleSentenceEs, setExampleSentenceEs] = useState('');
  const [isFalseFriend, setIsFalseFriend] = useState(false);
  const [falseFriendNote, setFalseFriendNote] = useState('');

  const [isEnriching, setIsEnriching] = useState(false);
  const [hasEnriched, setHasEnriched] = useState(false);
  const [activeTab, setActiveTab] = useState<'preview' | 'manual'>('preview');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const resetForm = () => {
    setWord('');
    setTranslationEs('');
    setDefinitionEn('');
    setIpaGeneralAmerican('');
    setCefrLevel('B1');
    setPartOfSpeech('NOUN');
    setGrammaticalDimension('CONTENT');
    setExampleSentenceEn('');
    setExampleSentenceEs('');
    setIsFalseFriend(false);
    setFalseFriendNote('');
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

    try {
      const data = await aiGateway.lookupVocabWord(targetWord);
      setWord(data.word);
      setTranslationEs(data.translationEs);
      setDefinitionEn(data.definitionEn);
      setIpaGeneralAmerican(data.ipaGeneralAmerican);
      setCefrLevel(data.cefrLevel);
      setPartOfSpeech(data.partOfSpeech);
      setGrammaticalDimension(data.grammaticalDimension);
      setExampleSentenceEn(data.exampleSentenceEn);
      setExampleSentenceEs(data.exampleSentenceEs);
      setIsFalseFriend(data.isFalseFriend);
      setFalseFriendNote(data.falseFriendNote || '');
      setHasEnriched(true);
      setActiveTab('preview');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error al consultar a la IA');
    } finally {
      setIsEnriching(false);
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
    let curExEn = exampleSentenceEn.trim();
    let curExEs = exampleSentenceEs.trim();
    let curIsFalseFriend = isFalseFriend;
    let curFalseNote = falseFriendNote.trim();

    // If no translation yet, auto-enrich with AI
    if (!curTranslation) {
      if (!isAiConnected) {
        setErrorMsg(
          'Para autocompletar la palabra con IA debes registrar tu clave en "Modelos de IA". O puedes completar los campos manualmente.',
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
        curExEn = data.exampleSentenceEn;
        curExEs = data.exampleSentenceEs;
        curIsFalseFriend = data.isFalseFriend;
        curFalseNote = data.falseFriendNote || '';
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
      await onAddWord({
        word: curWord,
        translationEs: curTranslation,
        definitionEn: curDefinition,
        ipaGeneralAmerican: curIpa || undefined,
        cefrLevel: curCefr,
        partOfSpeech: curPos,
        grammaticalDimension: curDim,
        exampleSentenceEn: curExEn || undefined,
        exampleSentenceEs: curExEs || undefined,
        isFalseFriend: curIsFalseFriend,
        falseFriendNote: curIsFalseFriend ? curFalseNote : undefined,
        createSrsCard: true,
      });

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

  // Keyboard navigation: Escape to close, Ctrl+Enter to submit (fresh closure guaranteed)
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-xl bg-white dark:bg-[#121622] rounded-3xl border border-gray-200/80 dark:border-white/[0.08] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
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
                Escribe en inglés y la IA extraerá fonética, traducción, nivel y ejemplos.
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
                placeholder="ej: resilient, breakthrough, look forward to"
                required
                disabled={isEnriching || isSubmitting}
                className="flex-1 px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-[#161B28] border border-gray-200 dark:border-gray-700/70 text-sm font-semibold text-gray-900 dark:text-white placeholder-gray-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 transition-all font-sans"
              />
              <Button
                type="button"
                onPress={() => handleEnrichWord()}
                isDisabled={!word.trim() || isEnriching || isSubmitting}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-sm transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
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
              </Button>
            </div>
          </div>

          {/* Loading Animation Box */}
          {isEnriching && (
            <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/50 flex items-center gap-3 animate-pulse">
              <div className="p-2.5 rounded-xl bg-indigo-600 text-white">
                <Sparkles className="w-4 h-4 animate-spin" />
              </div>
              <div className="text-xs">
                <p className="font-bold text-indigo-900 dark:text-indigo-200">
                  Extrayendo análisis lingüístico con IA...
                </p>
                <p className="text-[11px] text-indigo-600 dark:text-indigo-400">
                  Calculando fonética IPA General American, nivel pedagógico CEFR y oraciones contextuales.
                </p>
              </div>
            </div>
          )}

          {/* Enriched Content or Manual Configuration */}
          {(hasEnriched || word.trim().length > 0) && !isEnriching && (
            <div className="space-y-3 pt-1">
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
                  Vista Previa {hasEnriched && '✓'}
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
                <div className="p-4 rounded-2xl bg-gray-50/80 dark:bg-[#161B28]/80 border border-gray-200/80 dark:border-white/[0.08] space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2 pb-2.5 border-b border-gray-200/60 dark:border-white/[0.06]">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl font-bold text-gray-900 dark:text-white font-sans">
                        {word}
                      </span>
                      {ipaGeneralAmerican && (
                        <span
                          className="font-phonetic text-xs font-semibold text-indigo-600 dark:text-indigo-400"
                          style={{ fontFamily: 'var(--font-phonetic)' }}
                        >
                          /{ipaGeneralAmerican}/
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
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

                  {/* Context sentence */}
                  {exampleSentenceEn && (
                    <div className="p-3 rounded-xl bg-white/80 dark:bg-[#121622]/80 border border-gray-200/60 dark:border-white/[0.06] text-xs space-y-1">
                      <div className="flex items-center gap-1 text-[10px] font-semibold text-indigo-600 dark:text-indigo-400">
                        <BookOpen className="w-3 h-3" />
                        <span>Ejemplo Sugerido:</span>
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
              ) : (
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
              <Button
                type="submit"
                isDisabled={isSubmitting || isEnriching || !word.trim()}
                className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Guardando...</span>
                  </>
                ) : hasEnriched ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Guardar Término</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Autocompletar y Guardar</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
