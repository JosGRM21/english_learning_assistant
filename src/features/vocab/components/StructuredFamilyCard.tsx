import { Layers, Network } from 'lucide-react';
import { StructuredWordFamily } from '@/core/types/vocab';

export interface StructuredFamilyCardProps {
  family?: StructuredWordFamily | null;
  legacyFamily?: string[] | null;
  compact?: boolean;
}

export function StructuredFamilyCard({
  family,
  legacyFamily,
  compact = false,
}: StructuredFamilyCardProps) {
  const hasStructured =
    family &&
    ((family.nouns && family.nouns.length > 0) ||
      (family.verbs && family.verbs.length > 0) ||
      (family.adjectives && family.adjectives.length > 0) ||
      (family.adverbs && family.adverbs.length > 0));

  const hasLegacy = legacyFamily && legacyFamily.length > 0;

  if (!hasStructured && !hasLegacy) {
    return null;
  }

  if (!hasStructured && hasLegacy) {
    return (
      <div className="rounded-2xl border border-gray-200/80 dark:border-white/[0.08] bg-white dark:bg-[#121622] p-4 space-y-2.5 shadow-2xs">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
          <span className="p-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
            <Layers className="w-3.5 h-3.5" />
          </span>
          <span>Familia Léxica</span>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
          {legacyFamily?.map((item, idx) => (
            <span
              key={idx}
              className="text-xs px-2.5 py-1 rounded-lg bg-purple-500/10 text-purple-700 dark:text-purple-300 font-mono border border-purple-500/20 shadow-2xs hover:border-purple-400 transition-colors"
            >
              {item}
            </span>
          ))}
        </div>
      </div>
    );
  }

  const sections = [
    {
      title: 'Sustantivos (Nouns)',
      badge: 'Nouns',
      items: family?.nouns || [],
      color: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20',
      tagColor: 'bg-blue-50/80 dark:bg-blue-950/40 text-blue-800 dark:text-blue-200 border-blue-200/60 dark:border-blue-900/40',
    },
    {
      title: 'Verbos (Verbs)',
      badge: 'Verbs',
      items: family?.verbs || [],
      color: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20',
      tagColor: 'bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 border-emerald-200/60 dark:border-emerald-900/40',
    },
    {
      title: 'Adjetivos (Adj.)',
      badge: 'Adj.',
      items: family?.adjectives || [],
      color: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/20',
      tagColor: 'bg-indigo-50/80 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-200 border-indigo-200/60 dark:border-indigo-900/40',
    },
    {
      title: 'Adverbios (Adv.)',
      badge: 'Adv.',
      items: family?.adverbs || [],
      color: 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20',
      tagColor: 'bg-purple-50/80 dark:bg-purple-950/40 text-purple-800 dark:text-purple-200 border-purple-200/60 dark:border-purple-900/40',
    },
  ].filter((s) => s.items.length > 0);

  if (compact) {
    return (
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-700 dark:text-gray-300">
          <Layers className="w-3.5 h-3.5 text-purple-500" />
          <span>Familia de Palabras</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {sections.flatMap((sec) =>
            sec.items.map((word, idx) => (
              <span
                key={`${sec.title}-${idx}`}
                className={`text-[10px] px-2 py-0.5 rounded-md font-mono border ${sec.color} shadow-2xs`}
              >
                {word}
              </span>
            )),
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#121622] border border-gray-200/80 dark:border-white/[0.08] space-y-3.5 shadow-xs">
      <div className="flex items-center gap-2.5">
        <span className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-200/50 dark:border-purple-800/50 shadow-2xs">
          <Network className="w-4 h-4" />
        </span>
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-white">
            Familia de Palabras (Derivación Morfológica)
          </h4>
          <p className="text-[11px] text-gray-500 dark:text-gray-400">
            Aprende raíces compartidas para transferir significado y multiplicar tu vocabulario
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-0.5">
        {sections.map((sec) => (
          <div
            key={sec.title}
            className="p-3 rounded-xl bg-gray-50/80 dark:bg-[#171B2A] border border-gray-200/60 dark:border-white/[0.06] space-y-2 shadow-2xs"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 dark:text-gray-400">
                {sec.title}
              </span>
              <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded font-mono ${sec.color}`}>
                {sec.items.length}
              </span>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {sec.items.map((item, idx) => (
                <span
                  key={idx}
                  className={`text-xs px-2.5 py-1 rounded-lg font-mono border ${sec.tagColor} shadow-2xs hover:scale-102 transition-transform cursor-default`}
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
