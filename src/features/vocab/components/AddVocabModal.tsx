import React, { useState } from 'react';
import {
  X,
  Sparkles,
  AlertCircle,
  Check,
  Loader2,
  ChevronDown,
  ChevronUp,
  Volume2,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@heroui/react';
import { CefrLevel, GrammaticalDimension, PartOfSpeech } from '@/core/types/vocab';
import { NewVocabPayload } from '../hooks/useVocabList';
import { useAiGateway } from '@/shared/hooks/useAiGateway';

export interface AddVocabModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddWord: (payload: NewVocabPayload) => Promise<unknown>;
}

export function AddVocabModal({ isOpen, onClose, onAddWord }: AddVocabModalProps) {
  const { aiGateway } = useAiGateway();

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
  const [createSrsCard, setCreateSrsCard] = useState(true);

  const [isEnriching, setIsEnriching] = useState(false);
  const [hasEnriched, setHasEnriched] = useState(false);
  const [showManualEdit, setShowManualEdit] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

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
    setShowManualEdit(false);
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

    // If the user hasn't queried the AI yet, enrich automatically now
    if (!curTranslation || !curDefinition) {
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
        createSrsCard,
      });

      handleClose();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error al guardar la palabra');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCefrBadgeColor = (level: CefrLevel) => {
    switch (level) {
      case 'A1':
      case 'A2':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800';
      case 'B1':
      case 'B2':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800';
      case 'C1':
      case 'C2':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-300 dark:border-purple-800';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl bg-white dark:bg-[#131722] rounded-3xl border border-gray-200 dark:border-gray-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Sparkles className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                Agregar Palabra con IA
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Escribe únicamente la palabra; la IA extraerá traducción, fonética, nivel CEFR y ejemplos.
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-800 dark:text-rose-200 flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Primary Word Input & AI Action */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
              Palabra o Frase en Inglés <span className="text-indigo-600 dark:text-indigo-400">*</span>
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
                placeholder="e.g. resilient, breakthrough, seldom, look forward to"
                required
                disabled={isEnriching || isSubmitting}
                className="flex-1 px-4 py-3 rounded-2xl bg-gray-50 dark:bg-[#181D2A] border border-gray-200 dark:border-gray-700/80 text-base font-medium text-gray-900 dark:text-white placeholder-gray-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 transition-all"
              />
              <Button
                type="button"
                onPress={() => handleEnrichWord()}
                isDisabled={!word.trim() || isEnriching || isSubmitting}
                className="px-4 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md shadow-indigo-500/20 transition-all flex items-center gap-2 cursor-pointer shrink-0"
              >
                {isEnriching ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Consultando IA...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Autocompletar con IA</span>
                  </>
                )}
              </Button>
            </div>
            <p className="text-[11px] text-gray-400 dark:text-gray-500 flex items-center gap-1.5">
              <span>💡 Presiona Enter o clic en "Autocompletar con IA" para que la IA investigue la palabra.</span>
            </p>
          </div>

          {/* Loading Animation Card */}
          {isEnriching && (
            <div className="p-5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/70 dark:border-indigo-900/60 flex items-center gap-4 animate-pulse">
              <div className="p-3 rounded-2xl bg-indigo-600 text-white">
                <Sparkles className="w-6 h-6 animate-spin" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-indigo-900 dark:text-indigo-200">
                  Analizando término con la IA lingüística...
                </h4>
                <p className="text-xs text-indigo-700 dark:text-indigo-300">
                  Extrayendo fonética IPA General American, nivel CEFR pedagógico, traducción precisa, oraciones y falsos amigos.
                </p>
              </div>
            </div>
          )}

          {/* AI Enriched Result Preview */}
          {hasEnriched && !isEnriching && (
            <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/60 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Información generada por la IA con éxito</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowManualEdit(!showManualEdit)}
                  className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  {showManualEdit ? 'Ocultar edición de campos' : 'Editar campos manualmente'}
                  {showManualEdit ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Summary Card */}
              <div className="p-5 rounded-2xl bg-gray-50 dark:bg-[#181D2A] border border-gray-200 dark:border-gray-800 space-y-4">
                {/* Word, IPA & Badges */}
                <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-gray-200 dark:border-gray-800">
                  <div className="flex items-baseline gap-3">
                    <span className="text-xl font-bold text-gray-900 dark:text-white">
                      {word}
                    </span>
                    {ipaGeneralAmerican && (
                      <span className="text-sm font-mono text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-0.5 rounded-lg border border-indigo-200 dark:border-indigo-800/60 flex items-center gap-1.5">
                        <Volume2 className="w-3.5 h-3.5" />
                        {ipaGeneralAmerican}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-xl border ${getCefrBadgeColor(
                        cefrLevel,
                      )}`}
                    >
                      {cefrLevel}
                    </span>
                    <span className="text-xs font-medium px-2.5 py-1 rounded-xl bg-gray-200/80 dark:bg-gray-700/60 text-gray-700 dark:text-gray-300">
                      {partOfSpeech}
                    </span>
                    <span className="text-xs font-medium px-2.5 py-1 rounded-xl bg-gray-200/80 dark:bg-gray-700/60 text-gray-700 dark:text-gray-300">
                      {grammaticalDimension === 'CONTENT' ? 'Léxico' : grammaticalDimension === 'FUNCTION' ? 'Funcional' : 'Chunk'}
                    </span>
                  </div>
                </div>

                {/* Translation & Definition */}
                <div className="space-y-2">
                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                      Traducción al Español
                    </span>
                    <p className="text-base font-semibold text-gray-900 dark:text-white">
                      {translationEs}
                    </p>
                  </div>

                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 flex items-center gap-1">
                      <BookOpen className="w-3 h-3" />
                      Definición en Inglés
                    </span>
                    <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed italic">
                      "{definitionEn}"
                    </p>
                  </div>
                </div>

                {/* Example sentence */}
                {exampleSentenceEn && (
                  <div className="p-3.5 rounded-xl bg-white dark:bg-[#131722] border border-gray-200 dark:border-gray-800 space-y-1">
                    <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 block">
                      Oración de Ejemplo en Contexto
                    </span>
                    <p className="text-xs font-medium text-gray-900 dark:text-gray-200">
                      {exampleSentenceEn}
                    </p>
                    {exampleSentenceEs && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {exampleSentenceEs}
                      </p>
                    )}
                  </div>
                )}

                {/* False Friend Alert Box */}
                {isFalseFriend && (
                  <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-900/60 flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                    <div>
                      <strong className="font-bold block">Falso Amigo (False Cognate / Falso Cognado)</strong>
                      <span>{falseFriendNote || "Ten precaución: se parece a una palabra en español con significado muy distinto."}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Manual Editing Fields (if toggled or before enrichment if user wants to fill manually) */}
          {(!hasEnriched && !isEnriching) && (
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowManualEdit(!showManualEdit)}
                className="text-xs font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 flex items-center gap-1 cursor-pointer transition-colors"
              >
                {showManualEdit ? 'Ocultar campos manuales' : 'O rellenar todos los campos manualmente'}
                {showManualEdit ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>
          )}

          {showManualEdit && (
            <div className="space-y-4 pt-2 border-t border-gray-100 dark:border-gray-800 animate-in fade-in duration-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Traducción al Español <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={translationEs}
                    onChange={(e) => setTranslationEs(e.target.value)}
                    placeholder="e.g. resiliente"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-[#181D2A] border border-gray-200 dark:border-gray-700/80 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Fonética IPA (General American)
                  </label>
                  <input
                    type="text"
                    value={ipaGeneralAmerican}
                    onChange={(e) => setIpaGeneralAmerican(e.target.value)}
                    placeholder="e.g. /rɪˈzɪljənt/"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-[#181D2A] border border-gray-200 dark:border-gray-700/80 text-sm font-mono text-gray-900 dark:text-white placeholder-gray-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Nivel CEFR
                  </label>
                  <select
                    value={cefrLevel}
                    onChange={(e) => setCefrLevel(e.target.value as CefrLevel)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-[#181D2A] border border-gray-200 dark:border-gray-700/80 text-sm text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer"
                  >
                    <option value="A1">A1 - Principiante</option>
                    <option value="A2">A2 - Elemental</option>
                    <option value="B1">B1 - Intermedio</option>
                    <option value="B2">B2 - Intermedio Alto</option>
                    <option value="C1">C1 - Avanzado</option>
                    <option value="C2">C2 - Dominio Experto</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Categoría Gramatical
                  </label>
                  <select
                    value={partOfSpeech}
                    onChange={(e) => setPartOfSpeech(e.target.value as PartOfSpeech)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-[#181D2A] border border-gray-200 dark:border-gray-700/80 text-sm text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer"
                  >
                    <option value="NOUN">Sustantivo (Noun)</option>
                    <option value="VERB">Verbo (Verb)</option>
                    <option value="ADJECTIVE">Adjetivo (Adjective)</option>
                    <option value="ADVERB">Adverbio (Adverb)</option>
                    <option value="PREPOSITION">Preposición (Preposition)</option>
                    <option value="CONJUNCTION">Conjunción (Conjunction)</option>
                    <option value="ARTICLE_DETERMINER">Artículo / Determinante</option>
                    <option value="PRONOUN">Pronombre (Pronoun)</option>
                    <option value="INTERJECTION">Interjección (Interjection)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Definición en Inglés <span className="text-rose-500">*</span>
                </label>
                <textarea
                  value={definitionEn}
                  onChange={(e) => setDefinitionEn(e.target.value)}
                  placeholder="e.g. Able to withstand or recover quickly from difficult conditions."
                  rows={2}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-[#181D2A] border border-gray-200 dark:border-gray-700/80 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 transition-all resize-none"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Oración de Ejemplo (Inglés y Español)
                </label>
                <input
                  type="text"
                  value={exampleSentenceEn}
                  onChange={(e) => setExampleSentenceEn(e.target.value)}
                  placeholder="Oración en inglés"
                  className="w-full px-3.5 py-2 rounded-xl bg-gray-50 dark:bg-[#181D2A] border border-gray-200 dark:border-gray-700/80 text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 transition-all"
                />
                <input
                  type="text"
                  value={exampleSentenceEs}
                  onChange={(e) => setExampleSentenceEs(e.target.value)}
                  placeholder="Traducción de la oración al español"
                  className="w-full px-3.5 py-2 rounded-xl bg-gray-50 dark:bg-[#181D2A] border border-gray-200 dark:border-gray-700/80 text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 transition-all"
                />
              </div>

              {/* False Friend Checkbox */}
              <div className="space-y-2 pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={isFalseFriend}
                    onChange={(e) => setIsFalseFriend(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                  <span>¿Es un Falso Amigo (False Friend / Falso Cognado)?</span>
                </label>

                {isFalseFriend && (
                  <input
                    type="text"
                    value={falseFriendNote}
                    onChange={(e) => setFalseFriendNote(e.target.value)}
                    placeholder="Nota aclaratoria (ej. No significa 'actualmente', sino 'en realidad')"
                    className="w-full px-3.5 py-2 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/60 text-xs text-amber-900 dark:text-amber-200 placeholder-amber-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500 transition-all"
                  />
                )}
              </div>
            </div>
          )}

          {/* Create SRS Card Checkbox */}
          <label className="flex items-center gap-2.5 p-3.5 rounded-2xl bg-gray-50 dark:bg-[#181D2A] border border-gray-200 dark:border-gray-700/80 cursor-pointer">
            <input
              type="checkbox"
              checked={createSrsCard}
              onChange={(e) => setCreateSrsCard(e.target.checked)}
              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            />
            <div className="text-xs">
              <span className="font-semibold text-gray-800 dark:text-gray-200 block">
                Crear tarjeta de repaso espaciado (SRS) de inmediato
              </span>
              <span className="text-gray-500 dark:text-gray-400 text-[11px]">
                La palabra se programará para tu próxima sesión de estudio con FSRS v5.
              </span>
            </div>
          </label>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 text-xs font-semibold hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <Button
              type="submit"
              isDisabled={isSubmitting || isEnriching || !word.trim()}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md shadow-indigo-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : isEnriching ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Consultando IA...</span>
                </>
              ) : hasEnriched ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Guardar Palabra</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generar y Guardar con IA</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
