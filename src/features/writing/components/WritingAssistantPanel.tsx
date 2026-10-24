import { useState, useEffect } from 'react';
import {
  Compass,
  Target,
  Volume2,
  Plus,
  CheckCircle2,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { Button, Card, CardHeader, CardContent } from '@heroui/react';
import { ReadingItem, WritingMission } from '@/data/reading-to-write-catalog';
import { TargetWordItem } from '../store/writingStore';
import {
  CefrLevel,
  DISCOURSE_CONNECTORS,
} from '../data/discourseConnectors';

export interface WritingAssistantPanelProps {
  targetCefr: CefrLevel;
  targetWords?: TargetWordItem[];
  selectedReading?: ReadingItem | null;
  selectedMission?: WritingMission | null;
  isPlayingTts?: boolean;
  onInsertText: (phrase: string) => void;
  onReplaceTargetWord?: (index: number) => void;
  onPlayTts?: (text: string) => void;
}

type AssistantTabKey = 'CONNECTORS' | 'VOCAB' | 'READING';

export function WritingAssistantPanel({
  targetCefr,
  targetWords = [],
  selectedReading,
  isPlayingTts = false,
  onInsertText,
  onReplaceTargetWord,
  onPlayTts,
}: WritingAssistantPanelProps) {
  // If reading is selected, default to reading tab; otherwise connectors
  const [activeTab, setActiveTab] = useState<AssistantTabKey>(
    selectedReading ? 'READING' : 'CONNECTORS',
  );

  useEffect(() => {
    if (selectedReading) {
      setActiveTab('READING');
    } else {
      setActiveTab('CONNECTORS');
    }
  }, [selectedReading]);

  const effectiveTab = !selectedReading && activeTab === 'READING' ? 'CONNECTORS' : activeTab;

  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  const connectors = (DISCOURSE_CONNECTORS[targetCefr] ?? DISCOURSE_CONNECTORS.B1) || [];
  const categories = Array.from(new Set(connectors.map((c) => c.category)));
  const filteredConnectors =
    categoryFilter === 'ALL'
      ? connectors
      : connectors.filter((c) => c.category === categoryFilter);

  return (
    <Card className="rounded-3xl bg-white dark:bg-[#131722] border border-gray-200/90 dark:border-gray-800 shadow-xs overflow-hidden transition-all">
      {/* Header with Navigation Tabs */}
      <CardHeader className="p-3 sm:p-4 border-b border-gray-100 dark:border-gray-800/80 flex flex-col gap-2.5">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Compass className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">
              Asistente de Redacción
            </span>
          </div>

          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900/40">
            Nivel {targetCefr}
          </span>
        </div>

        {/* Tab Switcher Grid: only Reading (if selected), Connectors, and Vocab */}
        <div
          className={`grid gap-1 p-1 bg-gray-100/90 dark:bg-[#181D2A] rounded-xl text-xs w-full ${
            selectedReading ? 'grid-cols-3' : 'grid-cols-2'
          }`}
        >
          {selectedReading && (
            <button
              type="button"
              onClick={() => setActiveTab('READING')}
              className={`py-1.5 px-1 rounded-lg font-semibold transition-all cursor-pointer text-center truncate ${
                effectiveTab === 'READING'
                  ? 'bg-white dark:bg-[#121620] text-emerald-600 dark:text-emerald-400 shadow-2xs font-bold'
                  : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              Lectura
            </button>
          )}

          <button
            type="button"
            onClick={() => setActiveTab('CONNECTORS')}
            aria-label={`Conectores (${targetCefr})`}
            title={`Conectores (${targetCefr})`}
            className={`py-1.5 px-1 rounded-lg font-semibold transition-all cursor-pointer text-center truncate ${
              effectiveTab === 'CONNECTORS'
                ? 'bg-white dark:bg-[#121620] text-indigo-600 dark:text-indigo-400 shadow-2xs font-bold'
                : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            Conectores
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('VOCAB')}
            className={`py-1.5 px-1 rounded-lg font-semibold transition-all cursor-pointer text-center truncate ${
              effectiveTab === 'VOCAB'
                ? 'bg-white dark:bg-[#121620] text-indigo-600 dark:text-indigo-400 shadow-2xs font-bold'
                : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            Vocabulario
            {targetWords.length > 0 && (
              <span className="ml-1 text-[10px] font-mono opacity-80">
                ({targetWords.length})
              </span>
            )}
          </button>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-5 space-y-4">
        {/* ========================================================================= */}
        {/* TAB 1: READING COMPANION (When Reading is Selected) */}
        {/* ========================================================================= */}
        {effectiveTab === 'READING' && selectedReading && (
          <div className="space-y-3 animate-in fade-in duration-150">
            <div className="flex items-center justify-between gap-2 pb-2 border-b border-gray-100 dark:border-gray-800/80">
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
                  Lectura Base • {selectedReading.cefrLevel}
                </span>
                <h4 className="text-xs font-bold text-gray-900 dark:text-white truncate">
                  {selectedReading.title}
                </h4>
              </div>

              {onPlayTts && (
                <Button
                  size="sm"
                  variant="ghost"
                  onPress={() => onPlayTts(selectedReading.readingTextEn)}
                  isDisabled={isPlayingTts}
                  className="h-7 px-2 text-xs text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-lg cursor-pointer shrink-0"
                  aria-label="Reproducir narración en inglés"
                >
                  <Volume2 className={`w-3.5 h-3.5 mr-1 ${isPlayingTts ? 'animate-pulse text-indigo-600' : ''}`} />
                  <span>Escuchar</span>
                </Button>
              )}
            </div>

            {/* Reading Full Text View */}
            <div className="max-h-[340px] overflow-y-auto custom-scrollbar pr-1.5 space-y-2 text-xs font-editorial leading-relaxed text-gray-800 dark:text-gray-200">
              <p className="whitespace-pre-line">{selectedReading.readingTextEn}</p>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: DISCOURSE CONNECTORS (Categorized by CEFR level) */}
        {/* ========================================================================= */}
        {effectiveTab === 'CONNECTORS' && (
          <div className="space-y-3 animate-in fade-in duration-150">
            {/* Category Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 text-xs">
              <button
                type="button"
                onClick={() => setCategoryFilter('ALL')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer shrink-0 ${
                  categoryFilter === 'ALL'
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200'
                }`}
              >
                Todos ({connectors.length})
              </button>

              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer shrink-0 ${
                    categoryFilter === cat
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Connectors List with Insertion Actions */}
            <div className="space-y-1.5 max-h-[340px] overflow-y-auto custom-scrollbar pr-1">
              {filteredConnectors.map((conn, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => onInsertText(conn.phrase)}
                  className="w-full p-2.5 rounded-xl bg-gray-50/70 dark:bg-[#181D2A] hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-gray-200/70 dark:border-gray-800 hover:border-indigo-200 dark:hover:border-indigo-800 transition-all cursor-pointer flex items-center justify-between text-left group"
                  title={`Insertar "${conn.phrase}" en tu borrador`}
                >
                  <div className="min-w-0 pr-2">
                    <div className="font-mono text-xs font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 flex items-center gap-1.5">
                      <span>{conn.phrase}</span>
                      <span className="text-[10px] font-sans font-normal text-gray-400">
                        ({conn.category})
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                      {conn.labelEs}
                    </p>
                  </div>

                  <div className="w-6 h-6 rounded-lg bg-gray-100 dark:bg-gray-800 group-hover:bg-indigo-600 text-gray-400 group-hover:text-white flex items-center justify-center shrink-0 transition-colors">
                    <Plus className="w-3.5 h-3.5" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: SRS WEAK VOCABULARY TARGETS */}
        {/* ========================================================================= */}
        {effectiveTab === 'VOCAB' && (
          <div className="space-y-3 animate-in fade-in duration-150">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-indigo-500" />
                <span>Palabras a Activar en Memoria</span>
              </span>
              {targetWords.length > 0 && (
                <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
                  {targetWords.filter((w) => w.isUsed).length} / {targetWords.length} usadas
                </span>
              )}
            </div>

            {targetWords.length === 0 ? (
              <div className="p-4 rounded-2xl bg-gray-50 dark:bg-[#181D2A] text-center space-y-1.5 border border-dashed border-gray-200 dark:border-gray-800">
                <Sparkles className="w-5 h-5 text-indigo-400 mx-auto" />
                <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  ¡No tienes palabras débiles pendientes!
                </p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  A medida que repases en el mazo SRS, las palabras que requieran refuerzo aparecerán aquí automáticamente.
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[340px] overflow-y-auto custom-scrollbar pr-1">
                {targetWords.map((item, idx) => (
                  <div
                    key={idx}
                    className={`p-2.5 rounded-xl border transition-all flex items-center justify-between gap-2 ${
                      item.isUsed
                        ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                        : 'bg-gray-50/70 dark:bg-[#181D2A] border-gray-200 dark:border-gray-800 text-gray-800 dark:text-gray-200'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-bold">{item.word}</span>
                        {item.partOfSpeech && (
                          <span className="text-[9px] uppercase font-mono px-1 py-0.2 rounded bg-black/5 dark:bg-white/5 opacity-70">
                            {item.partOfSpeech.slice(0, 3)}
                          </span>
                        )}
                        {item.isUsed && (
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-0.5">
                            <CheckCircle2 className="w-3 h-3" /> Usada
                          </span>
                        )}
                      </div>
                      {item.translationEs && (
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                          {item.translationEs}
                        </p>
                      )}
                      {item.recommendedContext && (
                        <p
                          className="text-[10px] text-indigo-600/90 dark:text-indigo-400/90 italic truncate max-w-[200px]"
                          title={`Contexto recomendado: ${item.recommendedContext}`}
                        >
                          💡 {item.recommendedContext}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {!item.isUsed && onReplaceTargetWord && (
                        <Button
                          size="sm"
                          variant="ghost"
                          isIconOnly
                          onPress={() => onReplaceTargetWord(idx)}
                          className="w-7 h-7 rounded-lg text-gray-400 hover:text-indigo-600 cursor-pointer"
                          aria-label="Cambiar por otra palabra débil del mazo"
                        >
                          <RefreshCw className="w-3 h-3" />
                        </Button>
                      )}

                      <Button
                        size="sm"
                        variant={item.isUsed ? 'ghost' : 'primary'}
                        isIconOnly
                        onPress={() => onInsertText(item.word)}
                        className={`w-7 h-7 rounded-lg cursor-pointer ${
                          item.isUsed ? 'text-emerald-600' : 'bg-indigo-600 text-white'
                        }`}
                        aria-label={`Insertar "${item.word}" en el borrador`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
