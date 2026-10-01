import React, { useState } from 'react';
import {
  X,
  Sparkles,
  AlertCircle,
  Check,
  Loader2,
  AlertTriangle,
  SlidersHorizontal,
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
  const { aiGateway, orchestrator } = useAiGateway();
  const isAiConnected = orchestrator.getApiKeys().some((k) => k.isActive && k.secretKey.trim().length > 0);

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
  const [activeTab, setActiveTab] = useState<'preview' | 'manual'>('preview');
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
        'No hay ninguna API Key de Google Gemini activa. Ve a la pestaña "Modelos de IA" para registrar tu clave antes de consultar a la IA.'
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
          'Para autocompletar la palabra con IA debes registrar tu clave en "Modelos de IA". O puedes completar los campos manualmente.'
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
        createSrsCard,
      });

      handleClose();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error al guardar la palabra');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCefrBadgeStyle = (level: CefrLevel) => {
    switch (level) {
      case 'A1':
      case 'A2':
        return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      case 'B1':
      case 'B2':
        return 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800';
      case 'C1':
      case 'C2':
        return 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200 dark:border-purple-800';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-xl bg-white dark:bg-[#121622] rounded-3xl border border-gray-200/80 dark:border-gray-800 shadow-2xl overflow-hidden flex flex-col max-h-[88vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Sparkles className="w-4 h-4" />
            </span>
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-white">
                Agregar Término al Catálogo
              </h2>
              <p className="text-[11px] text-gray-400">
                Escribe la palabra en inglés; la IA extraerá fonética, traducción, nivel CEFR y ejemplos.
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
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
                className="flex-1 px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-[#161B28] border border-gray-200 dark:border-gray-700/70 text-sm font-semibold text-gray-900 dark:text-white placeholder-gray-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 transition-all"
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
              <div className="flex items-center gap-2 border-b border-gray-100 dark:border-gray-800/80 pb-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('preview')}
                  className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                    activeTab === 'preview'
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
                      : 'text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                  }`}
                >
                  Vista Rápida {hasEnriched && '✓'}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('manual')}
                  className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
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
                <div className="p-4 rounded-2xl bg-gray-50/70 dark:bg-[#161B28]/70 border border-gray-200/60 dark:border-gray-800/80 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2 pb-2.5 border-b border-gray-200/60 dark:border-gray-800/60">
                    <div className="flex items-baseline gap-2">
                      <span className="text-lg font-bold text-gray-900 dark:text-white">
                        {word}
                      </span>
                      {ipaGeneralAmerican && (
                        <span
                          className="font-phonetic text-xs text-indigo-600 dark:text-indigo-400"
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
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-gray-200/60 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium">
                        {partOfSpeech}
                      </span>
                    </div>
                  </div>

                  {/* Translation */}
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
                      Traducción al Español:
                    </label>
                    <input
                      type="text"
                      value={translationEs}
                      onChange={(e) => setTranslationEs(e.target.value)}
                      placeholder="Traducción al español..."
                      className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-[#121622] border border-gray-200/80 dark:border-gray-700 text-xs font-semibold text-gray-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  {/* Context sentence */}
                  {exampleSentenceEn && (
                    <div className="p-2.5 rounded-xl bg-white/70 dark:bg-[#121622]/70 border border-gray-200/60 dark:border-gray-800/60 text-xs space-y-0.5">
                      <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 block">
                        Ejemplo:
                      </span>
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
                    <div className="p-2.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-1.5">
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

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-300 mb-1">
                        Nivel CEFR
                      </label>
                      <select
                        value={cefrLevel}
                        onChange={(e) => setCefrLevel(e.target.value as CefrLevel)}
                        className="w-full px-3 py-1.5 rounded-lg bg-gray-50 dark:bg-[#161B28] border border-gray-200 dark:border-gray-700 text-xs text-gray-900 dark:text-white"
                      >
                        <option value="A1">A1 - Inicial</option>
                        <option value="A2">A2 - Elemental</option>
                        <option value="B1">B1 - Intermedio</option>
                        <option value="B2">B2 - Intermedio Alto</option>
                        <option value="C1">C1 - Avanzado</option>
                        <option value="C2">C2 - Dominio</option>
                      </select>
                    </div>

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

          {/* Quick SRS Card Checkbox */}
          <label className="flex items-center gap-2.5 p-3 rounded-xl bg-gray-50 dark:bg-[#161B28] border border-gray-200/60 dark:border-gray-800 cursor-pointer">
            <input
              type="checkbox"
              checked={createSrsCard}
              onChange={(e) => setCreateSrsCard(e.target.checked)}
              className="rounded text-indigo-600"
            />
            <div className="text-xs">
              <span className="font-semibold text-gray-800 dark:text-gray-200 block">
                Crear tarjeta de repaso espaciado (SRS) de inmediato
              </span>
              <span className="text-[11px] text-gray-400">
                Se programará automáticamente en tu próxima sesión de estudio con FSRS v5.
              </span>
            </div>
          </label>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-gray-100 dark:border-gray-800/80 flex items-center justify-end gap-2.5">
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
        </form>
      </div>
    </div>
  );
}
