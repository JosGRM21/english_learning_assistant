import { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Volume2,
  Copy,
  Check,
  Split,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { NoticingTheGapItem } from '@/infrastructure/ai/schemas';

export interface DoubleRecastPanelProps {
  cleanStructuralVersion: string;
  nativeRecastVersion: string;
  noticingContrasts: NoticingTheGapItem[];
  userDraft?: string;
  onPlayTts?: (text: string) => void;
  isPlayingTts?: boolean;
}

export function DoubleRecastPanel({
  cleanStructuralVersion,
  nativeRecastVersion,
  noticingContrasts,
  userDraft,
  onPlayTts,
  isPlayingTts = false,
}: DoubleRecastPanelProps) {
  const [copiedType, setCopiedType] = useState<'CLEAN' | 'NATIVE' | null>(null);
  const copyTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    };
  }, []);

  const handleCopy = (text: string, type: 'CLEAN' | 'NATIVE') => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    copyTimeoutRef.current = setTimeout(() => setCopiedType(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Natural Heading */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-indigo-50/80 via-purple-50/40 to-transparent dark:from-indigo-950/40 dark:via-purple-950/20 dark:to-transparent border border-indigo-100 dark:border-indigo-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-indigo-600 text-white shrink-0 shadow-xs">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block">
              Versiones de Referencia
            </span>
            <h3 className="text-base font-bold text-gray-900 dark:text-white leading-tight">
              De la Corrección Gramatical a la Fluidez Nativa
            </h3>
          </div>
        </div>

        <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
          Compara cómo evolucionan tus oraciones sin alterar tu mensaje
        </span>
      </div>

      {/* 2-Column Split: Grammatical Correction vs Natural Native */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
        {/* Clean Structural Version */}
        <section
          aria-label="Versión con corrección gramatical"
          className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#131722] border border-gray-200/90 dark:border-gray-800 shadow-xs flex flex-col justify-between space-y-4"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2 pb-2 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                  <ShieldCheck className="w-4 h-4" />
                </span>
                <div>
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                    Corrección Gramatical
                  </h4>
                  <span className="text-[11px] text-gray-400 block">
                    Manteniendo tus palabras
                  </span>
                </div>
              </div>

              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-semibold">
                Gramática correcta
              </span>
            </div>

            <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-snug">
              Conserva tu vocabulario y orden de ideas, reparando únicamente concordancias y normas gramaticales.
            </p>

            <div className="p-4 rounded-2xl bg-gray-50/70 dark:bg-[#181D2A] border border-gray-100 dark:border-gray-800 text-sm font-sans text-gray-800 dark:text-gray-100 leading-relaxed font-medium">
              &ldquo;{cleanStructuralVersion || userDraft || 'Sin cambios gramaticales necesarios.'}&rdquo;
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={() => handleCopy(cleanStructuralVersion || userDraft || '', 'CLEAN')}
              className="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {copiedType === 'CLEAN' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>¡Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-gray-400" />
                  <span>Copiar texto corregido</span>
                </>
              )}
            </button>
          </div>
        </section>

        {/* Native Recast Version with TTS Audio */}
        <section
          aria-label="Versión nativa natural"
          className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#131722] border-2 border-emerald-500/40 dark:border-emerald-500/30 shadow-xs flex flex-col justify-between space-y-4 relative overflow-hidden"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2 pb-2 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                </span>
                <div>
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                    Versión Nativa Natural
                  </h4>
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 block font-medium">
                    Expresión idiomática
                  </span>
                </div>
              </div>

              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold">
                Fluidez nativa
              </span>
            </div>

            <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-snug">
              Reescribe tus ideas con frases auténticas y transiciones naturales como las usaría un hablante anglófono fluido.
            </p>

            <div className="p-4 rounded-2xl bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 text-sm sm:text-base font-sans text-gray-900 dark:text-emerald-50 leading-relaxed font-semibold">
              &ldquo;{nativeRecastVersion || 'Generando versión nativa natural...'}&rdquo;
            </div>
          </div>

          {/* Action Toolbar for Level 2 (TTS & Copy) */}
          {/* Action Toolbar for Native Version (TTS & Copy) */}
          <div className="pt-2 flex items-center justify-between gap-2 flex-wrap">
            {onPlayTts && (
              <button
                type="button"
                onClick={() => onPlayTts(nativeRecastVersion)}
                disabled={isPlayingTts || !nativeRecastVersion}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold shadow-xs shadow-emerald-600/25 transition-all inline-flex items-center gap-2 cursor-pointer"
                title="Escuchar pronunciación y cadencia natural"
                aria-label="Escuchar versión nativa natural"
              >
                <Volume2 className={`w-4 h-4 ${isPlayingTts ? 'animate-pulse text-white' : ''}`} />
                <span>{isPlayingTts ? 'Reproduciendo audio...' : 'Escuchar en inglés'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => handleCopy(nativeRecastVersion, 'NATIVE')}
              className="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {copiedType === 'NATIVE' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>¡Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-gray-400" />
                  <span>Copiar versión nativa</span>
                </>
              )}
            </button>
          </div>
        </section>
      </div>

      {/* PANEL 3: Expression Contrast (Noticing the Gap) */}
      {noticingContrasts && noticingContrasts.length > 0 && (
        <section
          aria-label="Comparativa de naturalidad"
          className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-[#131722] border border-gray-200/90 dark:border-gray-800 shadow-xs space-y-4"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
                <Split className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 block">
                  Comparativa de Expresión
                </span>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  Cómo sonar más natural ({noticingContrasts.length})
                </h3>
              </div>
            </div>

            <span className="text-xs text-gray-400">
              Observa cómo se formula la misma idea de forma más fluida
            </span>
          </div>

          <div className="space-y-3">
            {noticingContrasts.map((item, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-gray-50/70 dark:bg-[#181D2A] border border-gray-200/80 dark:border-gray-800/80 space-y-3 shadow-2xs"
              >
                {/* Side-by-side Snippets */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-center">
                  <div className="p-3 rounded-xl bg-white dark:bg-[#131722] border border-gray-200/70 dark:border-gray-800 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                      Tu frase original:
                    </span>
                    <span className="font-mono text-xs sm:text-sm text-rose-700 dark:text-rose-400 font-semibold line-through">
                      &ldquo;{item.user_fragment}&rdquo;
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-800/60 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block">
                      Forma natural en inglés:
                    </span>
                    <span className="font-mono text-xs sm:text-sm text-emerald-800 dark:text-emerald-200 font-bold flex items-center gap-1.5">
                      <ArrowRight className="w-3.5 h-3.5 text-emerald-600 shrink-0 hidden sm:inline" />
                      &ldquo;{item.native_fragment}&rdquo;
                    </span>
                  </div>
                </div>

                {/* Explanatory Micro-Note */}
                <div className="flex items-start gap-2 text-xs text-gray-700 dark:text-gray-300 font-sans leading-relaxed pt-1">
                  <BookOpen className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
                  <p>
                    <strong className="text-gray-900 dark:text-white font-semibold">
                      Nota de uso:{' '}
                    </strong>
                    {item.noticing_note_es}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
