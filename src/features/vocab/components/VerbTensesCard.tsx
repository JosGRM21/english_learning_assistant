import { useState } from 'react';
import { Volume2, Sparkles, HelpCircle } from 'lucide-react';
import { VerbTenses } from '@/core/types/vocab';
import { useAudio } from '@/shared/hooks/useAudio';

export interface VerbTensesCardProps {
  tenses: VerbTenses;
  compact?: boolean;
}

export function VerbTensesCard({ tenses, compact = false }: VerbTensesCardProps) {
  const { audioService } = useAudio();
  const [playingKey, setPlayingKey] = useState<string | null>(null);

  const handleSpeak = async (key: string, text: string) => {
    if (playingKey) return;
    try {
      setPlayingKey(key);
      await audioService.speak(text, 0.95);
    } finally {
      setPlayingKey(null);
    }
  };

  const getEdRuleExplanation = (rule?: '/t/' | '/d/' | '/ɪd/' | null) => {
    switch (rule) {
      case '/t/':
        return 'Sonido sordo /t/: se pronuncia sin vibrar las cuerdas vocales (tras consonantes sordas como p, k, s, ch, sh, f). No añade una sílaba.';
      case '/d/':
        return 'Sonido sonoro /d/: las cuerdas vocales vibran (tras vocales o consonantes sonoras como b, g, v, z, m, n, l, r). No añade una sílaba.';
      case '/ɪd/':
        return 'Sonido /ɪd/: añade una sílaba extra. Ocurre obligatoriamente cuando el verbo en forma base termina en sonido "t" o "d" (ej. want → wanted).';
      default:
        return 'Regla de pronunciación fonética estándar para la terminación -ed.';
    }
  };

  const tenseItems = [
    { key: 'inf', label: 'Infinitivo / Base', value: tenses.infinitive, tag: 'V1' },
    { key: 'third', label: '3ª Persona Sing.', value: tenses.thirdPersonPresent, tag: 'He/She/It' },
    { key: 'past', label: 'Past Simple', value: tenses.pastSimple, tag: 'V2' },
    { key: 'part', label: 'Past Participle', value: tenses.pastParticiple, tag: 'V3' },
    { key: 'gerund', label: 'Gerundio / Cont.', value: tenses.gerund, tag: '-ing' },
  ];

  if (compact) {
    return (
      <div className="p-3 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/50 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900 dark:text-indigo-200">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Tiempos Verbales</span>
          </div>
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
              tenses.isIrregular
                ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700/60'
                : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700/60'
            }`}
          >
            {tenses.isIrregular ? 'Irregular' : 'Regular'}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {tenseItems.map((item) => (
            <div
              key={item.key}
              className="p-2 rounded-xl bg-white/80 dark:bg-[#161B28] border border-gray-100 dark:border-white/[0.04] flex items-center justify-between gap-1.5"
            >
              <div className="min-w-0">
                <span className="text-[9px] uppercase tracking-wider text-gray-400 block font-semibold truncate">
                  {item.tag}
                </span>
                <span className="text-xs font-bold text-gray-800 dark:text-gray-100 truncate block">
                  {item.value}
                </span>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSpeak(item.key, item.value);
                }}
                disabled={playingKey === item.key}
                className="p-1 rounded-lg text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors shrink-0 cursor-pointer"
                title={`Pronunciar ${item.value}`}
              >
                <Volume2 className={`w-3 h-3 ${playingKey === item.key ? 'animate-pulse text-indigo-600' : ''}`} />
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50/70 to-purple-50/40 dark:from-[#151928] dark:to-[#171328] border border-indigo-100 dark:border-indigo-900/50 space-y-3.5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-indigo-100/80 dark:border-white/[0.06]">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-600 text-white shadow-xs">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-950 dark:text-indigo-200">
              Conjugación & Tiempos Verbales
            </h4>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">
              Formas nucleares para fluidez y precisión gramatical
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`text-xs font-bold px-2.5 py-0.5 rounded-lg border font-mono ${
              tenses.isIrregular
                ? 'bg-amber-500/10 text-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-700/60'
                : 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700/60'
            }`}
          >
            {tenses.isIrregular ? 'Verbo Irregular' : 'Verbo Regular (-ed)'}
          </span>

          {!tenses.isIrregular && tenses.edPhoneticEnding && (
            <span
              className="text-xs font-bold px-2.5 py-0.5 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 font-phonetic flex items-center gap-1"
              title={getEdRuleExplanation(tenses.edPhoneticEnding)}
            >
              <span>-ed: {tenses.edPhoneticEnding}</span>
              <HelpCircle className="w-3 h-3 text-purple-400" />
            </span>
          )}
        </div>
      </div>

      {/* Grid of Tenses - Responsive auto-wrapping to prevent overflow with long verb forms */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
        {tenseItems.map((item) => {
          const isPlayingThis = playingKey === item.key;
          return (
            <div
              key={item.key}
              className="p-3 rounded-xl bg-white/90 dark:bg-[#121520] border border-gray-200/80 dark:border-white/[0.06] shadow-xs flex flex-col justify-between hover:border-indigo-300 dark:hover:border-indigo-700 transition-all group min-w-0"
            >
              <div className="space-y-0.5">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[10px] font-mono font-bold text-indigo-600 dark:text-indigo-400 shrink-0">
                    {item.tag}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSpeak(item.key, item.value);
                    }}
                    disabled={isPlayingThis}
                    className="p-1 rounded-lg text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors cursor-pointer shrink-0"
                    title={`Escuchar "${item.value}"`}
                  >
                    <Volume2 className={`w-3 h-3 ${isPlayingThis ? 'animate-pulse text-indigo-600' : ''}`} />
                  </button>
                </div>
                <span
                  className="text-[10px] text-gray-400 dark:text-gray-500 block truncate font-medium"
                  title={item.label}
                >
                  {item.label}
                </span>
              </div>

              <div className="pt-2 min-w-0">
                <p
                  className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white tracking-tight break-words"
                  title={item.value}
                >
                  {item.value}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Explanatory banner for -ed pronunciation rule for Spanish speakers */}
      {!tenses.isIrregular && tenses.edPhoneticEnding && (
        <div className="p-2.5 rounded-xl bg-purple-50/70 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/40 text-[11px] text-purple-900 dark:text-purple-200 flex items-start gap-2">
          <HelpCircle className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Fonética L1 (-ed):</strong> {getEdRuleExplanation(tenses.edPhoneticEnding)}
          </p>
        </div>
      )}
    </div>
  );
}
