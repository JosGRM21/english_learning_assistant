import {
  AudioWaveform,
  Headphones,
  Volume2,
  Sparkles,
  Construction,
  BookOpen,
  ArrowRight,
} from 'lucide-react';
import { PageHeader } from '@/shared/ui/PageHeader';
import { AppTab } from '@/shared/constants/app-tabs';

export interface PhoneticsLabViewProps {
  onNavigateTab?: (tab: AppTab) => void;
}

export function PhoneticsLabView({ onNavigateTab }: PhoneticsLabViewProps) {
  const highlights = [
    {
      title: 'Discriminación auditiva',
      icon: Headphones,
      description:
        'Aprende a diferenciar sonidos y reconocer palabras en conversaciones cotidianas.',
    },
    {
      title: 'Habla conectada',
      icon: Volume2,
      description:
        'Descubre cómo se enlazan las palabras y se suavizan los sonidos al hablar a velocidad normal.',
    },
    {
      title: 'Práctica guiada',
      icon: Sparkles,
      description:
        'Entrena tu ritmo y pronunciación con ejercicios interactivos paso a paso.',
    },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-2 animate-in fade-in duration-300">
      <PageHeader
        title="Laboratorio de Fonética"
        description="Entrenamiento de pronunciación y comprensión auditiva natural"
        icon={AudioWaveform}
        badge={
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 inline-flex items-center gap-1.5">
            <Construction className="w-3.5 h-3.5" />
            <span>En construcción</span>
          </span>
        }
      />

      {/* Main Minimalist Aesthetic Card */}
      <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-[#131722] border border-gray-200/80 dark:border-gray-800/80 p-8 sm:p-12 shadow-sm text-center">
        {/* Soft atmospheric gradient orbs */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 right-1/4 w-72 h-72 bg-purple-500/10 dark:bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-xl mx-auto space-y-4">
          {/* Aesthetic Icon & Soundwave visual */}
          <div className="relative inline-flex items-center justify-center">
            <div className="absolute inset-0 rounded-3xl bg-indigo-500/20 blur-xl animate-pulse" />
            <div className="relative p-5 rounded-3xl bg-gradient-to-b from-indigo-50 to-indigo-100/60 dark:from-indigo-950/80 dark:to-indigo-900/40 border border-indigo-200/60 dark:border-indigo-800/60 text-indigo-600 dark:text-indigo-400 shadow-inner">
              <AudioWaveform className="w-10 h-10" />
            </div>
          </div>

          {/* Sound wave simulation */}
          <div className="flex items-center justify-center gap-1.5 h-6">
            <span className="w-1 bg-indigo-300 dark:bg-indigo-600 rounded-full h-2.5 animate-pulse" />
            <span className="w-1 bg-indigo-400 dark:bg-indigo-500 rounded-full h-4 animate-pulse [animation-delay:150ms]" />
            <span className="w-1 bg-indigo-600 dark:bg-indigo-400 rounded-full h-6 animate-pulse [animation-delay:300ms]" />
            <span className="w-1 bg-indigo-500 dark:bg-indigo-500 rounded-full h-3.5 animate-pulse [animation-delay:450ms]" />
            <span className="w-1 bg-indigo-400 dark:bg-indigo-400 rounded-full h-5 animate-pulse [animation-delay:200ms]" />
            <span className="w-1 bg-indigo-300 dark:bg-indigo-600 rounded-full h-2.5 animate-pulse [animation-delay:350ms]" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              Módulo en construcción
            </h2>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed font-sans">
              Estamos preparando este espacio para ayudarte a afinar tu oído, perfeccionar tu pronunciación y comprender el inglés hablado natural con mayor facilidad.
            </p>
          </div>
        </div>

        {/* Feature previews for end-user */}
        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-4 mt-10 text-left max-w-3xl mx-auto">
          {highlights.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-gray-50/70 dark:bg-[#181D2D]/60 border border-gray-200/60 dark:border-gray-800/80 space-y-2 transition-all hover:border-indigo-200 dark:hover:border-indigo-900/50"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 shrink-0">
                    <Icon className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                    {feat.title}
                  </h3>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                  {feat.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Navigation shortcuts if onNavigateTab is provided */}
        {onNavigateTab && (
          <div className="relative z-10 mt-10 pt-6 border-t border-gray-100 dark:border-gray-800/80 max-w-xl mx-auto">
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
              Mientras preparamos este laboratorio, puedes seguir practicando con los otros módulos:
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => onNavigateTab('vocab')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 transition-colors cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Explorar Vocabulario</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigateTab('srs')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-500/20 transition-colors cursor-pointer"
              >
                <span>Repasar Tarjetas</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
