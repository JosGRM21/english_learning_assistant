import { useState, useMemo } from 'react';
import { Sparkles, Check, Clock, FileText, Target } from 'lucide-react';
import { Button, Chip } from '@heroui/react';
import { ReadingItem, WritingMission } from '@/data/reading-to-write-catalog';

export interface CustomReadingTabProps {
  onApplyCustomReading: (reading: ReadingItem, mission: WritingMission) => void;
}

export function CustomReadingTab({ onApplyCustomReading }: CustomReadingTabProps) {
  const [customTitle, setCustomTitle] = useState('');
  const [customText, setCustomText] = useState('');
  const [customCefr, setCustomCefr] = useState<'A1' | 'A2' | 'B1' | 'B2' | 'C1'>('B1');
  const [customMissionType, setCustomMissionType] = useState<'SUMMARY' | 'OPINION'>('SUMMARY');

  const wordCount = useMemo(() => {
    return customText.trim().split(/\s+/).filter(Boolean).length;
  }, [customText]);

  const estimatedReadingTime = useMemo(() => {
    return Math.max(1, Math.round(wordCount / 130));
  }, [wordCount]);

  const handleSubmit = () => {
    if (!customText.trim()) return;

    const mission: WritingMission = {
      type: customMissionType,
      titleEs: customMissionType === 'SUMMARY' ? 'Misión: Resumen' : 'Misión: Opinión y Reflexión',
      instructionsEs:
        customMissionType === 'SUMMARY'
          ? 'Resume los puntos principales del texto con tus propias palabras.'
          : 'Expresa tu postura u opinión personal respecto a lo leído.',
      suggestedOpening:
        customMissionType === 'SUMMARY'
          ? 'In summary, the text describes how...'
          : 'From my perspective regarding this topic...',
      suggestedWordRange:
        customMissionType === 'SUMMARY'
          ? { min: 40, max: 95 }
          : { min: 50, max: 110 },
    };

    const readingItem: ReadingItem = {
      id: `custom_read_${Date.now()}`,
      title: customTitle.trim() || 'Texto Personalizado',
      cefrLevel: customCefr,
      category: 'SHORT_STORIES',
      categoryLabelEs: 'Lectura Personalizada',
      readingTimeMin: estimatedReadingTime,
      wordCount,
      readingTextEn: customText.trim(),
      readingSummaryEs: 'Lectura proporcionada por el estudiante.',
      keyVocabulary: [],
      comprehensionQuestions: [],
      writingMissions: [mission],
    };

    onApplyCustomReading(readingItem, mission);
  };

  return (
    <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-5 max-w-3xl mx-auto w-full">
      {/* Intro Banner */}
      <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 text-xs text-indigo-900 dark:text-indigo-200 flex items-start gap-3 shadow-2xs">
        <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5">
          <Sparkles className="w-4 h-4" />
        </div>
        <div className="space-y-1">
          <h4 className="font-bold text-sm text-indigo-950 dark:text-indigo-100">
            Escribe a partir de lo que estás leyendo en tu día a día
          </h4>
          <p className="leading-relaxed text-indigo-800/90 dark:text-indigo-300">
            Pega cualquier artículo de Medium, tweet, documentación técnica, noticia o fragmento de libro en inglés.
            El taller adaptará tu sesión de escritura a partir de este material.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Title Input */}
        <div>
          <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1.5">
            Título o Fuente del Texto (opcional):
          </label>
          <input
            type="text"
            value={customTitle}
            onChange={(e) => setCustomTitle(e.target.value)}
            placeholder="Ej: Artículo de Medium sobre arquitectura de software"
            className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50/80 dark:bg-[#181D2A] border border-gray-200 dark:border-gray-800 text-xs text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 outline-hidden transition-all shadow-2xs"
          />
        </div>

        {/* Text Area with Live Stats Header */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
              Texto en Inglés Leído:
            </label>

            {/* Live Stats Badges */}
            <div className="flex items-center gap-1.5">
              <Chip
                size="sm"
                variant="soft"
                className={`text-[10px] font-mono font-bold h-5 px-2 ${
                  wordCount > 0
                    ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                }`}
              >
                <FileText className="w-2.5 h-2.5 inline mr-1" />
                {wordCount} palabras
              </Chip>

              {wordCount > 0 && (
                <Chip
                  size="sm"
                  variant="soft"
                  className="text-[10px] font-mono h-5 px-2 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300"
                >
                  <Clock className="w-2.5 h-2.5 inline mr-1 text-amber-500" />
                  ~{estimatedReadingTime} min de lectura
                </Chip>
              )}
            </div>
          </div>

          <textarea
            rows={8}
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            placeholder="Pega aquí el texto en inglés que leíste..."
            className="w-full p-4 rounded-2xl bg-gray-50/80 dark:bg-[#181D2A] border border-gray-200 dark:border-gray-800 text-xs sm:text-sm text-gray-900 dark:text-white font-editorial leading-relaxed focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 outline-hidden transition-all shadow-2xs custom-scrollbar"
          />
        </div>

        {/* Level and Mission Selectors in responsive grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          {/* CEFR Level Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block">
              Nivel CEFR aproximado del texto:
            </label>
            <div className="grid grid-cols-5 gap-1.5">
              {(['A1', 'A2', 'B1', 'B2', 'C1'] as const).map((lvl) => {
                const isSelected = customCefr === lvl;
                return (
                  <Button
                    key={lvl}
                    size="sm"
                    variant={isSelected ? 'primary' : 'outline'}
                    onPress={() => setCustomCefr(lvl)}
                    className={`py-2 rounded-xl font-mono text-xs font-bold cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
                    }`}
                  >
                    {lvl}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Mission Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block">
              Misión de Redacción Deseada:
            </label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                size="sm"
                variant={customMissionType === 'SUMMARY' ? 'primary' : 'outline'}
                onPress={() => setCustomMissionType('SUMMARY')}
                className={`py-2 px-3 rounded-xl text-xs font-semibold cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
                  customMissionType === 'SUMMARY'
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
                }`}
              >
                <Target className="w-3.5 h-3.5" />
                <span>Resumen</span>
              </Button>

              <Button
                size="sm"
                variant={customMissionType === 'OPINION' ? 'primary' : 'outline'}
                onPress={() => setCustomMissionType('OPINION')}
                className={`py-2 px-3 rounded-xl text-xs font-semibold cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
                  customMissionType === 'OPINION'
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Opinión</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Submit Action Button */}
        <div className="pt-3">
          <Button
            size="lg"
            variant="primary"
            onPress={handleSubmit}
            isDisabled={!customText.trim()}
            className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            aria-label="Cargar Texto e Iniciar Redacción"
          >
            <Check className="w-4 h-4" />
            <span>Cargar Texto e Iniciar Redacción</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
