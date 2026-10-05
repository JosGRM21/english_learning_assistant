import { useState, useMemo } from 'react';
import { BookOpen, Search, X } from 'lucide-react';
import { CardWithTarget } from '@/core/types/srs';
import { PART_OF_SPEECH_LABELS_ES } from '@/core/types/vocab';

export interface SrsDeckDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  deckCards: CardWithTarget[];
  activeCardId: string | null;
  onSelectCard: (card: CardWithTarget) => void;
}

export function SrsDeckDrawer({
  isOpen,
  onClose,
  deckCards,
  activeCardId,
  onSelectCard,
}: SrsDeckDrawerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterState, setFilterState] = useState<'ALL' | 'NEW' | 'DUE' | 'REVIEW'>('ALL');

  const filteredCards = useMemo(() => {
    const now = new Date().toISOString();
    return deckCards.filter((item) => {
      // Filter by state
      if (filterState === 'NEW' && item.card.state !== 'NEW') return false;
      if (filterState === 'DUE') {
        const isDue = item.card.state !== 'NEW' && item.card.scheduledFor <= now;
        if (!isDue) return false;
      }
      if (filterState === 'REVIEW' && item.card.state !== 'REVIEW') return false;

      // Filter by search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const wordMatch = item.vocab?.word?.toLowerCase().includes(q);
        const transMatch = item.vocab?.translationEs?.toLowerCase().includes(q);
        const defMatch = item.vocab?.definitionEn?.toLowerCase().includes(q);
        const domainMatch = item.vocab?.domainCategory?.toLowerCase().includes(q);
        const posLabel = item.vocab?.partOfSpeech ? (PART_OF_SPEECH_LABELS_ES[item.vocab.partOfSpeech] ?? item.vocab.partOfSpeech) : '';
        const posMatch = posLabel.toLowerCase().includes(q);
        if (!wordMatch && !transMatch && !defMatch && !domainMatch && !posMatch) return false;
      }

      return true;
    });
  }, [deckCards, filterState, searchQuery]);

  if (!isOpen) return null;

  const getStateBadge = (state: string, scheduledFor: string) => {
    const now = new Date().toISOString();
    if (state === 'NEW') {
      return (
        <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/50">
          Nueva
        </span>
      );
    }
    if (scheduledFor <= now) {
      return (
        <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/50">
          Para Hoy
        </span>
      );
    }
    return (
      <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-bold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
        En Repaso
      </span>
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex justify-end animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md h-full bg-white dark:bg-[#121622] border-l border-gray-200/80 dark:border-gray-800 p-6 flex flex-col justify-between shadow-2xl animate-in slide-in-from-right duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          {/* Drawer Header */}
          <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-500" />
              <h3 className="font-bold text-sm text-gray-900 dark:text-white">
                Explorador de Mazo ({deckCards.length})
              </h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar término en el mazo..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-gray-50 dark:bg-[#161B28] border border-gray-200 dark:border-gray-700/70 text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Quick Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            <button
              type="button"
              onClick={() => setFilterState('ALL')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer shrink-0 ${
                filterState === 'ALL'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              Todas ({deckCards.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterState('DUE')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer shrink-0 ${
                filterState === 'DUE'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              Para Hoy
            </button>
            <button
              type="button"
              onClick={() => setFilterState('NEW')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer shrink-0 ${
                filterState === 'NEW'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              Nuevas
            </button>
            <button
              type="button"
              onClick={() => setFilterState('REVIEW')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer shrink-0 ${
                filterState === 'REVIEW'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              En Repaso
            </button>
          </div>

          {/* Cards list */}
          <div className="flex-1 overflow-y-auto custom-scrollbar-thin space-y-1.5 pr-1.5 divide-y divide-gray-100 dark:divide-gray-800/60">
            {filteredCards.length === 0 ? (
              <div className="py-12 text-center text-xs text-gray-400">
                No se encontraron tarjetas con este filtro.
              </div>
            ) : (
              filteredCards.map((item) => {
                const isCurrent = activeCardId === item.card.id;
                return (
                  <div
                    key={item.card.id}
                    onClick={() => {
                      onSelectCard(item);
                      onClose();
                    }}
                    className={`p-3 rounded-xl transition-all cursor-pointer flex items-center justify-between ${
                      isCurrent
                        ? 'bg-indigo-50/80 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-800/60'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                    }`}
                  >
                    <div className="space-y-1 flex-1 pr-2 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-xs text-gray-900 dark:text-white">
                          {item.vocab?.word || 'Palabra'}
                        </span>
                        {item.vocab?.partOfSpeech && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                            {PART_OF_SPEECH_LABELS_ES[item.vocab.partOfSpeech] ?? item.vocab.partOfSpeech}
                          </span>
                        )}
                        {item.vocab?.domainCategory && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded font-semibold bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200/50 dark:border-purple-800/50">
                            {item.vocab.domainCategory}
                          </span>
                        )}
                        {item.vocab?.cefrLevel && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded font-mono font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/40 dark:border-indigo-800/40">
                            {item.vocab.cefrLevel}
                          </span>
                        )}
                        {getStateBadge(item.card.state, item.card.scheduledFor)}
                      </div>
                      <p className="text-[11px] text-gray-600 dark:text-gray-300 flex items-baseline gap-1.5 flex-wrap">
                        <strong className="font-semibold text-gray-900 dark:text-gray-100">
                          {item.vocab?.translationEs}
                        </strong>
                        {item.vocab?.definitionEn && (
                          <span className="text-gray-400 dark:text-gray-500 font-normal line-clamp-1">
                            — {item.vocab.definitionEn}
                          </span>
                        )}
                      </p>
                    </div>

                    {item.vocab?.ipaGeneralAmerican && (
                      <span
                        className="text-xs font-phonetic text-indigo-600/80 dark:text-indigo-400/80"
                        style={{ fontFamily: 'var(--font-phonetic)' }}
                      >
                        /{item.vocab.ipaGeneralAmerican}/
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="pt-3 border-t border-gray-100 dark:border-gray-800 text-[11px] text-gray-400 text-center">
          Haz clic en cualquier tarjeta para repasarla de inmediato.
        </div>
      </div>
    </div>
  );
}
