import { Layers } from 'lucide-react';
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
      <div className="space-y-1.5 pt-1">
        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
          <Layers className="w-3.5 h-3.5 text-purple-500" />
          <span>Familia Léxica</span>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {legacyFamily?.map((item, idx) => (
            <span
              key={idx}
              className="text-xs px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-mono border border-purple-200/50 dark:border-purple-900/40"
            >
              {item}
            </span>
          ))}
        </div>
      </div>
    );
  }

  const sections = [
    { title: 'Sustantivos (Nouns)', items: family?.nouns || [], color: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200/60 dark:border-blue-900/40' },
    { title: 'Verbos (Verbs)', items: family?.verbs || [], color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-900/40' },
    { title: 'Adjetivos (Adj.)', items: family?.adjectives || [], color: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border-indigo-200/60 dark:border-indigo-900/40' },
    { title: 'Adverbios (Adv.)', items: family?.adverbs || [], color: 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200/60 dark:border-purple-900/40' },
  ].filter((s) => s.items.length > 0);

  if (compact) {
    return (
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-700 dark:text-gray-300">
          <Layers className="w-3 h-3 text-purple-500" />
          <span>Familia de Palabras</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {sections.flatMap((sec) =>
            sec.items.map((word, idx) => (
              <span
                key={`${sec.title}-${idx}`}
                className={`text-[10px] px-2 py-0.5 rounded-md font-mono border ${sec.color}`}
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
    <div className="p-4 rounded-2xl bg-gray-50/70 dark:bg-[#141824] border border-gray-200/70 dark:border-white/[0.06] space-y-3">
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
          <Layers className="w-3.5 h-3.5" />
        </div>
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-white">
            Familia de Palabras (Derivación Morfológica)
          </h4>
          <p className="text-[11px] text-gray-500 dark:text-gray-400">
            Aprende raíces compartidas para transferir significado y multiplicar tu vocabulario
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
        {sections.map((sec) => (
          <div
            key={sec.title}
            className="p-2.5 rounded-xl bg-white dark:bg-[#10131B] border border-gray-100 dark:border-white/[0.04] space-y-1.5"
          >
            <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 block">
              {sec.title}
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {sec.items.map((item, idx) => (
                <span
                  key={idx}
                  className={`text-xs px-2 py-0.5 rounded-md font-mono border ${sec.color}`}
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
