import { useState } from 'react';
import { Volume2, HelpCircle, BookA } from 'lucide-react';
import { VerbTenses } from '@/core/types/vocab';
import { useAudio } from '@/shared/hooks/useAudio';
import { getVoiceForAccent } from '@/infrastructure/audio/AudioService';

export interface VerbTensesTableProps {
  tenses: VerbTenses;
  edEnding?: '/t/' | '/d/' | '/ɪd/' | null;
  accentPreference?: 'US' | 'UK';
}

export function VerbTensesTable({ tenses, edEnding, accentPreference = 'US' }: VerbTensesTableProps) {
  const { audioService } = useAudio();
  const [playingKey, setPlayingKey] = useState<string | null>(null);

  const handleSpeak = async (key: string, text: string) => {
    if (playingKey || !text) return;
    try {
      setPlayingKey(key);
      await audioService.speak(text, 0.95, getVoiceForAccent(accentPreference));
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

  const rows = [
    {
      key: 'base',
      code: 'V1',
      label: 'Base Form (Infinitivo)',
      value: tenses.infinitive,
      hasPhoneticEd: false,
    },
    {
      key: 'past',
      code: 'V2',
      label: 'Past Simple (Pasado Simple)',
      value: tenses.pastSimple,
      hasPhoneticEd: !tenses.isIrregular && Boolean(finalEd),
    },
    {
      key: 'part',
      code: 'V3',
      label: 'Past Participle (Participio)',
      value: tenses.pastParticiple,
      hasPhoneticEd: !tenses.isIrregular && Boolean(finalEd),
    },
    {
      key: 'third',
      code: '3ª SG',
      label: '3ª Persona Singular (he / she / it)',
      value: tenses.thirdPersonPresent,
      hasPhoneticEd: false,
    },
    {
      key: 'gerund',
      code: '-ING',
      label: 'Gerund (Gerundio / Participio)',
      value: tenses.gerund,
      hasPhoneticEd: false,
    },
  ].filter((item) => Boolean(item.value));

  return (
    <div className="rounded-3xl border border-indigo-100 dark:border-indigo-950/60 bg-gradient-to-br from-indigo-50/40 via-white to-purple-50/20 dark:from-[#131726] dark:via-[#10131E] dark:to-[#171328] p-4 sm:p-5 space-y-4 shadow-xs">
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

      {/* Vertical List of Verb Forms */}
      <div className="space-y-2">
        {rows.map((row) => {
          const isPlaying = playingKey === row.key;
          return (
            <div
              key={row.key}
              className="p-3 sm:px-4 rounded-2xl bg-white/95 dark:bg-[#161B28]/90 border border-gray-200/80 dark:border-white/[0.08] flex items-center justify-between gap-3 shadow-2xs hover:border-indigo-400/60 dark:hover:border-indigo-600/60 hover:shadow-xs transition-all group"
            >
              {/* Left Column: Code Badge + Label */}
              <div className="flex items-center gap-2.5 min-w-0 sm:min-w-[200px]">
                <span className="w-10 sm:w-12 text-center py-0.5 rounded-md font-mono text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60 shrink-0">
                  {row.code}
                </span>
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 truncate">
                  {row.label}
                </span>
              </div>

              {/* Middle Column: Conjugated Verb Form + Optional -ed ending */}
              <div className="flex items-center gap-2 flex-1 justify-start min-w-0 pl-1">
                <span className="text-sm sm:text-base font-bold text-gray-900 dark:text-white truncate font-sans tracking-tight">
                  {row.value}
                </span>

                {row.hasPhoneticEd && (
                  <span
                    className="hidden sm:inline-block px-2 py-0.2 rounded text-[10px] font-bold font-phonetic bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60 shrink-0"
                    title={getEdRuleExplanation(finalEd)}
                  >
                    {finalEd}
                  </span>
                )}
              </div>

              {/* Right Column: Audio Button */}
              <button
                type="button"
                onClick={() => handleSpeak(row.key, row.value)}
                disabled={isPlaying}
                className={`p-1.5 rounded-xl text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer shrink-0 ${
                  isPlaying ? 'text-indigo-600 dark:text-indigo-400 animate-pulse bg-indigo-50 dark:bg-indigo-950/40' : ''
                }`}
                title={`Escuchar "${row.value}"`}
              >
                <Volume2 className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Phonetic -ed rule reminder note if regular */}
      {!tenses.isIrregular && finalEd && (
        <div className="flex items-center gap-2 text-xs text-purple-700 dark:text-purple-300 p-2.5 px-3.5 rounded-xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200/60 dark:border-purple-800/40">
          <HelpCircle className="w-4 h-4 shrink-0" />
          <span className="text-[11px] leading-relaxed">{getEdRuleExplanation(finalEd)}</span>
        </div>
      )}
    </div>
  );
}
