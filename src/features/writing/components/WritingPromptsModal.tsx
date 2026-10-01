import { useState, useMemo } from 'react';
import {
  X,
  BookOpen,
  Target,
  ArrowRight,
  Filter,
} from 'lucide-react';
import {
  WRITING_PROMPTS_CATALOG,
  WritingPromptItem,
  WritingTopicCategory,
} from '@/data/writing-prompts-catalog';

export interface WritingPromptsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPrompt: (prompt: WritingPromptItem) => void;
}

const CATEGORY_FILTERS: { key: WritingTopicCategory | 'ALL'; label: string }[] = [
  { key: 'ALL', label: 'Todos los Temas' },
  { key: 'L1_INTERFERENCE_CHALLENGES', label: 'Trampas L1' },
  { key: 'WORK_BUSINESS', label: 'Trabajo & Standup' },
  { key: 'TECHNOLOGY', label: 'Tecnología' },
  { key: 'DAILY_LIFE', label: 'Vida Diaria' },
  { key: 'OPINION_ARGUMENT', label: 'Opinión' },
];

export function WritingPromptsModal({
  isOpen,
  onClose,
  onSelectPrompt,
}: WritingPromptsModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<WritingTopicCategory | 'ALL'>('ALL');
  const [selectedCefr, setSelectedCefr] = useState<string | 'ALL'>('ALL');

  const filteredPrompts = useMemo(() => {
    return WRITING_PROMPTS_CATALOG.filter((p) => {
      const matchCat = selectedCategory === 'ALL' || p.category === selectedCategory;
      const matchCefr = selectedCefr === 'ALL' || p.cefrLevel === selectedCefr;
      return matchCat && matchCefr;
    });
  }, [selectedCategory, selectedCefr]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#131722] border border-gray-200 dark:border-gray-800 rounded-3xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 dark:border-gray-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <BookOpen className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Banco de Prompts Situacionales
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Selecciona un escenario contextual con vocabulario y objetivos CEFR recomendados
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters */}
        <div className="px-6 py-3.5 bg-gray-50/50 dark:bg-[#181D2A]/50 border-b border-gray-100 dark:border-gray-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Filter className="w-3.5 h-3.5 text-gray-400 mr-1" />
            {CATEGORY_FILTERS.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setSelectedCategory(cat.key)}
                className={`px-3 py-1.5 rounded-xl font-medium transition-all cursor-pointer ${
                  selectedCategory === cat.key
                    ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                    : 'bg-white dark:bg-[#181D2A] text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200/80 dark:border-gray-700/60'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* CEFR filter */}
          <div className="flex items-center gap-1">
            <span className="text-gray-400 text-[11px] mr-1">Nivel:</span>
            {['ALL', 'A2', 'B1', 'B2', 'C1'].map((lvl) => (
              <button
                key={lvl}
                onClick={() => setSelectedCefr(lvl)}
                className={`px-2 py-1 rounded-lg font-mono text-[11px] font-semibold transition-all cursor-pointer ${
                  selectedCefr === lvl
                    ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                    : 'text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-800'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>

        {/* Cards Grid */}
        <div className="p-6 overflow-y-auto custom-scrollbar space-y-4 flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredPrompts.map((prompt) => (
              <div
                key={prompt.id}
                className="p-5 rounded-2xl bg-white dark:bg-[#181D2A] border border-gray-200/80 dark:border-gray-800/80 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all flex flex-col justify-between group shadow-xs hover:shadow-md"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60">
                      {prompt.categoryLabelEs}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                        {prompt.cefrLevel}
                      </span>
                      <span className="text-[11px] text-gray-400 flex items-center gap-1">
                        <Target className="w-3 h-3 text-emerald-500" />
                        {prompt.suggestedWordRange.min}-{prompt.suggestedWordRange.max} pal.
                      </span>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white text-sm group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {prompt.title}
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 leading-relaxed">
                      {prompt.promptText}
                    </p>
                  </div>

                  {/* Vocabulary suggestions */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {prompt.suggestedVocabulary.slice(0, 4).map((vocab, vIdx) => (
                      <span
                        key={vIdx}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-gray-50 dark:bg-[#131722] text-gray-600 dark:text-gray-400 border border-gray-200/60 dark:border-gray-800"
                      >
                        {vocab}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-4 mt-3 border-t border-gray-100 dark:border-gray-800/60 flex items-center justify-between">
                  <span className="text-[10px] text-gray-400 italic line-clamp-1 max-w-[200px]">
                    {prompt.pedagogicalFocusEs}
                  </span>
                  <button
                    onClick={() => {
                      onSelectPrompt(prompt);
                      onClose();
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                  >
                    <span>Cargar Prompt</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
