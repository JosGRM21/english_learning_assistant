import {
  AudioWaveform,
  Construction,
  Sparkles,
  Headphones,
  Waves,
  Zap,
} from 'lucide-react';
import { PageHeader } from '@/shared/ui/PageHeader';

export function PhoneticsLabView() {
  const upcomingFeatures = [
    {
      title: 'Decodificación de Habla Rápida (Fast Speech)',
      icon: Zap,
      description:
        'Drills de discriminación auditiva y retos de "¿Qué dijo realmente el nativo?" para superar el filtro silábico del español.',
    },
    {
      title: 'Enlaces Fonéticos (Linking & Glides)',
      icon: AudioWaveform,
      description:
        'Entrenamiento fonotáctico en catenación C-V, semivocales de transición /j/ y /w/, y enlaces suaves entre palabras contiguas.',
    },
    {
      title: 'Reducción & Elisión (Schwa & Lost Sounds)',
      icon: Waves,
      description:
        'Identificación activa de formas débiles, elisión de /t/ y /d/ en clusters consonánticos y reducción vocálica natural.',
    },
    {
      title: 'Shadowing Gradual & Pares Mínimos',
      icon: Headphones,
      description:
        'Estudio de shadowing asistido (0.75x a 1.0x) y discriminación de contrastes vocálicos críticos (/iː/ vs /ɪ/, /b/ vs /v/).',
    },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-2 animate-in fade-in duration-200">
      <PageHeader
        title="Laboratorio de Fonética y Habla Conectada"
        description="Connected Speech & Pronunciation Lab: Decodificación auditiva, enlaces suprasegmentales y ritmo acentual"
        icon={AudioWaveform}
        badge={
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center gap-1.5">
            <Construction className="w-3.5 h-3.5" />
            <span>En Construcción</span>
          </span>
        }
      />

      {/* Main Announcement Card */}
      <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-[#131722] border border-gray-200 dark:border-gray-800 p-8 sm:p-10 shadow-sm text-center">
        {/* Decorative background glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl mx-auto space-y-4">
          <div className="inline-flex p-4 rounded-3xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 mb-2 shadow-inner">
            <AudioWaveform className="w-10 h-10 animate-pulse" />
          </div>

          <h3 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Módulo en Construcción
          </h3>

          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed font-sans">
            El <strong>Laboratorio de Fonética y Habla Conectada</strong> está actualmente en fase de diseño pedagógico y desarrollo de ejercicios según la especificación funcional{' '}
            <code className="text-xs px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 font-mono text-indigo-600 dark:text-indigo-400">
              08_phonetics_connected_speech_lab.md
            </code>
            .
          </p>

          <p className="text-xs text-gray-400 dark:text-gray-500 max-w-lg mx-auto">
            Pronto podrás entrenar la percepción y producción de fenómenos suprasegmentales, ritmo rítmico acentual (*stress-timed rhythm*) y bucles de repetición con voz neuronal nativa.
          </p>
        </div>

        {/* Feature roadmap preview */}
        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-4 mt-10 text-left">
          {upcomingFeatures.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-gray-50/80 dark:bg-[#181D2D]/60 border border-gray-200/70 dark:border-gray-800/80 space-y-2"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 shrink-0">
                    <Icon className="w-4 h-4" />
                  </div>
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                    {feat.title}
                  </h4>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                  {feat.description}
                </p>
              </div>
            );
          })}
        </div>

        <div className="relative z-10 flex items-center justify-center gap-2 pt-8 text-xs text-gray-400 dark:text-gray-500 font-medium">
          <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
          <span>Integración futura con FSRS 5.0 bajo el perfil PHONETIC_ACUITY</span>
        </div>
      </div>
    </div>
  );
}
