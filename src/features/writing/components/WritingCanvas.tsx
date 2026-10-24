import {
  Sparkles,
  Target,
  Volume2,
} from 'lucide-react';
import { Button, Chip, Card, CardHeader, CardContent, CardFooter, ProgressBar } from '@heroui/react';
import { ReadingItem, WritingMission } from '@/data/reading-to-write-catalog';

export interface WritingCanvasProps {
  draft: string;
  selectedReading?: ReadingItem | null;
  selectedMission?: WritingMission | null;
  isLoading: boolean;
  isPlayingTts?: boolean;
  onDraftChange: (text: string) => void;
  onInsertText: (phrase: string) => void;
  onPlayTts?: (text: string) => void;
  onRequestSocratic: () => void;
}

export function WritingCanvas({
  draft,
  selectedReading,
  selectedMission,
  isLoading,
  isPlayingTts = false,
  onDraftChange,
  onInsertText,
  onPlayTts,
  onRequestSocratic,
}: WritingCanvasProps) {
  const words = draft.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const charCount = draft.replace(/\s/g, '').length;

  const targetMin = selectedReading && selectedMission
    ? selectedMission.suggestedWordRange.min
    : 40;

  const targetMax = selectedReading && selectedMission
    ? selectedMission.suggestedWordRange.max
    : 120;

  const isWordTargetMet = wordCount >= targetMin && wordCount <= targetMax;
  const isWordTargetExceeded = wordCount > targetMax;
  const wordProgressRatio = Math.min(100, Math.round((wordCount / targetMax) * 100));

  return (
    <Card className="rounded-3xl bg-white dark:bg-[#131722] border border-gray-200/90 dark:border-gray-800 shadow-xs overflow-hidden transition-all">
      {/* Contextual Mission Banner (If Reading or Mission is active) */}
      {selectedMission && (
        <CardHeader className="p-4 sm:p-5 bg-gradient-to-r from-indigo-50/70 via-blue-50/40 to-transparent dark:from-indigo-950/40 dark:via-blue-950/20 dark:to-transparent border-b border-gray-100 dark:border-gray-800/80 flex flex-col gap-2">
          <div className="flex items-center justify-between gap-3 w-full">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-xl bg-indigo-600 text-white shrink-0 shadow-2xs">
                <Target className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  Misión de Redacción
                </span>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white leading-tight">
                  {selectedMission.titleEs}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {selectedReading && onPlayTts && (
                <Button
                  size="sm"
                  variant="ghost"
                  onPress={() => onPlayTts(selectedReading.readingTextEn)}
                  isDisabled={isPlayingTts}
                  className="h-8 px-2.5 text-xs text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100/60 dark:hover:bg-indigo-900/40 rounded-xl cursor-pointer"
                  aria-label="Escuchar narración de la lectura base"
                >
                  <Volume2 className={`w-3.5 h-3.5 mr-1 ${isPlayingTts ? 'animate-pulse text-indigo-600' : ''}`} />
                  <span className="hidden sm:inline">Audio</span>
                </Button>
              )}

              <Chip
                size="sm"
                variant="soft"
                color="accent"
                className="font-mono text-[11px] h-6 px-2 bg-indigo-100/70 dark:bg-indigo-900/40 text-indigo-800 dark:text-indigo-200"
              >
                Meta: {targetMin}–{targetMax} palabras
              </Chip>
            </div>
          </div>

          <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed pl-7">
            {selectedMission.instructionsEs}
          </p>

          {selectedMission.suggestedOpening && !draft && (
            <div className="pl-7 pt-1">
              <button
                type="button"
                onClick={() => {
                  if (selectedMission?.suggestedOpening) {
                    onInsertText(selectedMission.suggestedOpening);
                  }
                }}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer font-medium"
              >
                <span>💡 Usar inicio sugerido: &ldquo;{selectedMission.suggestedOpening}&rdquo;</span>
              </button>
            </div>
          )}
        </CardHeader>
      )}

      <CardContent className="p-5 sm:p-6 space-y-4">
        {/* Primary Writing Area Textarea */}
        <div className="relative">
          <textarea
            rows={13}
            value={draft}
            onChange={(e) => onDraftChange(e.target.value)}
            placeholder={
              selectedMission?.suggestedOpening
                ? `Escribe tu redacción aquí... (Sugerencia de inicio: "${selectedMission.suggestedOpening}")`
                : 'Escribe tu borrador en inglés aquí. Puedes redactar libremente, apoyarte en los conectores del panel lateral o cumplir la misión sugerida...'
            }
            spellCheck={false}
            autoCorrect="off"
            autoCapitalize="off"
            className="w-full p-5 rounded-2xl bg-gray-50/50 dark:bg-[#181D2A]/70 border border-gray-200/90 dark:border-gray-800/90 text-gray-900 dark:text-white text-base focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 focus:outline-hidden transition-all leading-relaxed placeholder:text-gray-400 custom-scrollbar font-sans"
          />
        </div>

        {/* Live Metrics: Word counter, character count, and dynamic progress bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 text-xs">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-gray-400 font-medium">Palabras:</span>
              <span
                className={`font-mono font-bold text-sm ${
                  isWordTargetMet
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : isWordTargetExceeded
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-gray-800 dark:text-gray-200'
                }`}
              >
                {wordCount}
              </span>
              <span className="text-gray-400 font-mono text-[11px]">
                / meta {targetMin}–{targetMax}
              </span>
            </div>

            {/* Visual Word Progress Bar */}
            <div className="w-28 sm:w-36">
              <ProgressBar
                value={wordProgressRatio}
                color={isWordTargetMet ? 'success' : isWordTargetExceeded ? 'warning' : 'accent'}
                className="h-2"
                aria-label="Progreso de palabras"
              />
            </div>

            {isWordTargetMet && (
              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                ✓ Meta alcanzada
              </span>
            )}
          </div>

          <div className="text-gray-400 font-mono text-[11px] self-end sm:self-auto">
            {charCount} caracteres
          </div>
        </div>
      </CardContent>

      {/* Primary Action Button Footer */}
      <CardFooter className="p-4 sm:p-5 pt-0">
        <Button
          size="lg"
          variant="primary"
          onPress={onRequestSocratic}
          isDisabled={isLoading || !draft.trim()}
          className="w-full py-4 h-12 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white font-semibold text-sm shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 animate-spin" />
              <span>Analizando borrador con IA...</span>
            </span>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Solicitar Pistas de Mejora</span>
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
