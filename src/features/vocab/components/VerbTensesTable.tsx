import { useState } from 'react';
import { Volume2, HelpCircle, BookA } from 'lucide-react';
import { VerbTenses } from '@/core/types/vocab';
import { useAudio } from '@/shared/hooks/useAudio';

export interface VerbTensesTableProps {
  tenses: VerbTenses;
  edEnding?: '/t/' | '/d/' | '/ɪd/' | null;
}

export function VerbTensesTable({ tenses, edEnding }: VerbTensesTableProps) {
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
        return 'Sonido sordo /t/: tras consonantes sordas (p, k, s, ch, sh, f). No añade sílaba.';
      case '/d/':
        return 'Sonido sonoro /d/: las cuerdas vocales vibran (tras vocales o b, g, v, z, m, n, l, r). No añade sílaba.';
      case '/ɪd/':
        return 'Sonido /ɪd/: añade una sílaba obligatoria tras verbos terminados en sonido "t" o "d" (want → wanted).';
      default:
        return 'Regla de pronunciación fonética estándar para la terminación regular -ed.';
    }
  };

  const finalEd = edEnding || tenses.edPhoneticEnding;

  const columns = [
    { key: 'base', label: 'Base Form (V1)', shortLabel: 'V1', value: tenses.infinitive },
    { key: 'past', label: 'Past Simple (V2)', shortLabel: 'V2', value: tenses.pastSimple },
    { key: 'part', label: 'Past Participle (V3)', shortLabel: 'V3', value: tenses.pastParticiple },
    { key: 'gerund', label: 'Gerund (-ing)', shortLabel: '-ing', value: tenses.gerund },
  ];

  return (
    <div className="rounded-2xl border border-indigo-100 dark:border-indigo-950/60 bg-gradient-to-br from-indigo-50/40 via-white to-purple-50/20 dark:from-[#131726] dark:via-[#10131E] dark:to-[#171328] p-4 sm:p-5 space-y-3.5 shadow-xs">
      {/* Header Bar */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/50 shadow-2xs">
            <BookA className="w-4 h-4" />
          </span>
          <div>
            <h5 className="text-xs font-bold uppercase tracking-wider text-indigo-950 dark:text-indigo-200">
              Conjugación y Formas Verbales
            </h5>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">
              {tenses.isIrregular ? 'Formas irregulares esenciales' : 'Patrón regular con flexión temporal'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`text-[11px] font-bold px-2.5 py-0.5 rounded-lg border font-mono shadow-2xs ${
              tenses.isIrregular
                ? 'bg-amber-500/10 text-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-700/60'
                : 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700/60'
            }`}
          >
            {tenses.isIrregular ? 'Verbo Irregular' : 'Verbo Regular'}
          </span>

          {!tenses.isIrregular && finalEd && (
            <span
              className="text-[11px] font-bold px-2.5 py-0.5 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 font-phonetic shadow-2xs"
              title={getEdRuleExplanation(finalEd)}
            >
              -ed: {finalEd}
            </span>
          )}
        </div>
      </div>

      {/* 4-column tense cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {columns.map((col) => {
          const isPlaying = playingKey === col.key;
          return (
            <div
              key={col.key}
              className="p-3 rounded-xl bg-white/90 dark:bg-[#161B28]/90 border border-gray-200/70 dark:border-white/[0.08] flex flex-col justify-between gap-1.5 shadow-2xs hover:border-indigo-400/60 dark:hover:border-indigo-600/60 hover:shadow-xs transition-all group"
            >
              <div className="flex items-center justify-between gap-1">
                <span className="text-[10px] font-mono font-bold text-gray-400 dark:text-gray-400 tracking-wider">
                  {col.label}
                </span>
                <button
                  type="button"
                  onClick={() => handleSpeak(col.key, col.value)}
                  disabled={isPlaying}
                  className={`p-1 rounded-md text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer shrink-0 ${
                    isPlaying ? 'text-indigo-600 dark:text-indigo-400 animate-pulse bg-indigo-50 dark:bg-indigo-950/40' : ''
                  }`}
                  title={`Escuchar "${col.value}"`}
                >
                  <Volume2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-sm font-bold text-gray-900 dark:text-white truncate font-sans tracking-tight">
                {col.value}
              </p>
            </div>
          );
        })}
      </div>

      {/* 3rd person note & -ed reminder */}
      <div className="flex items-center justify-between gap-3 text-xs text-gray-500 dark:text-gray-400 pt-1 flex-wrap border-t border-indigo-100/60 dark:border-white/[0.04]">
        {tenses.thirdPersonPresent && (
          <div className="flex items-center gap-1.5">
            <span className="text-gray-400 text-[11px]">3ª Persona Sing.:</span>
            <span className="px-2 py-0.5 rounded-md bg-white dark:bg-[#161B28] font-bold text-gray-800 dark:text-gray-200 border border-gray-200/60 dark:border-white/[0.06] text-xs shadow-2xs">
              {tenses.thirdPersonPresent}
            </span>
          </div>
        )}

        {!tenses.isIrregular && finalEd && (
          <div className="flex items-center gap-1.5 text-purple-700 dark:text-purple-300 text-[11px] ml-auto">
            <HelpCircle className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate max-w-xs sm:max-w-md">{getEdRuleExplanation(finalEd)}</span>
          </div>
        )}
      </div>
    </div>
  );
}
