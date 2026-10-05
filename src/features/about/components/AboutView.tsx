import { useState, useEffect } from 'react';
import {
  Sparkles,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  BookOpen,
  Cpu,
  Database,
  Layers,
  ShieldCheck,
  Volume2,
  PenTool,
  BrainCircuit,
  Terminal,
  Heart,
  Code2,
} from 'lucide-react';
import { useUpdater } from '@/shared/hooks/useUpdater';
import { UpdateModal } from '@/shared/ui/UpdateModal';

export function AboutView() {
  const [appVersion, setAppVersion] = useState<string>('1.0.3');

  const {
    status,
    updateInfo,
    errorMessage,
    downloadProgress,
    checkForUpdates,
    downloadAndInstallUpdate,
    dismissModal,
  } = useUpdater();

  useEffect(() => {
    let isMounted = true;
    async function loadVersion() {
      try {
        const { getVersion } = await import('@tauri-apps/api/app');
        const v = await getVersion();
        if (isMounted && v) {
          setAppVersion(v);
        }
      } catch {
        // En entorno no-Tauri o pruebas, mantiene '1.0.3'
      }
    }
    loadVersion();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleOpenLink = async (url: string) => {
    try {
      const { openUrl } = await import('@tauri-apps/plugin-opener');
      await openUrl(url);
    } catch {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const coreFeatures = [
    {
      title: 'SRS Adaptativo FSRS v5',
      icon: BrainCircuit,
      color: 'text-indigo-600 dark:text-indigo-400',
      bg: 'bg-indigo-50 dark:bg-indigo-950/40',
      description:
        'Motor de repetición espaciada de última generación basado en el modelo DSR (Dificultad, Estabilidad y Retención) con calibración continua contra una retención objetivo del 90%.',
    },
    {
      title: 'Fonología & Connected Speech',
      icon: Volume2,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-950/40',
      description:
        'Transcripción fonética precisa en AFI (General American) con análisis de enlaces fonéticos (linking), elisiones vocálicas/consonánticas y reducciones rítmicas.',
    },
    {
      title: 'Taller de Redacción Socrático',
      icon: PenTool,
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-50 dark:bg-amber-950/40',
      description:
        'Práctica guiada en tres fases pedagógicas: redacción libre, andamiaje socrático asistido por IA (Zona de Desarrollo Próximo) y evaluación holística con feedback constructivo.',
    },
    {
      title: 'Matriz Multimodelo de IA',
      icon: Cpu,
      color: 'text-purple-600 dark:text-purple-400',
      bg: 'bg-purple-50 dark:bg-purple-950/40',
      description:
        'Compatibilidad con la familia Google Gemini (3.8, 3.7 y 3.6 Flash, además de 3.5 Flash Lite), admitiendo hasta 560 peticiones diarias por clave API con monitoreo de RPM/RPD.',
    },
    {
      title: 'Arquitectura Local-First',
      icon: Database,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-950/40',
      description:
        'Tu progreso, tarjetas, vocabulario y redacciones residen 100% en tu equipo mediante SQLite local. Incluye copias de seguridad portátiles en formato JSON.',
    },
    {
      title: 'Privacidad y Alto Rendimiento',
      icon: ShieldCheck,
      color: 'text-teal-600 dark:text-teal-400',
      bg: 'bg-teal-50 dark:bg-teal-950/40',
      description:
        'Construido sobre Tauri v2 con backend ultraligero en Rust y frontend reactivo, garantizando consumo mínimo de memoria RAM y cero telemetría externa.',
    },
  ];

  const techStack = [
    { label: 'Framework de Escritorio', val: 'Tauri v2 (Rust)' },
    { label: 'Frontend', val: 'React 19 + TypeScript' },
    { label: 'Estilos & UI', val: 'Tailwind CSS' },
    { label: 'Persistencia Local', val: 'SQLite (sql.js / Tauri SQL)' },
    { label: 'Modelos de Lenguaje', val: 'Google Gemini Flash Series' },
    { label: 'Algoritmo de Memoria', val: 'FSRS v5 (Free Spaced Repetition)' },
  ];

  return (
    <div className="space-y-6 pb-10">
      {/* Hero / Header Card */}
      <div className="bg-white dark:bg-[#131722] rounded-3xl p-6 md:p-8 border border-gray-200/80 dark:border-gray-800/80 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-2xl shadow-xl shadow-indigo-500/25 shrink-0">
              ELA
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                  English Learning Assistant
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  v{appVersion}
                </span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-2xl leading-relaxed">
                Plataforma integral para el dominio avanzado del inglés que combina ciencia cognitiva, análisis fonético de habla conectada, redacción socrática e inteligencia artificial.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Software Updates Card (Featured Section) */}
      <div className="bg-white dark:bg-[#131722] rounded-3xl p-6 border border-gray-200/80 dark:border-gray-800/80 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <RefreshCw className={`w-5 h-5 ${status === 'checking' ? 'animate-spin' : ''}`} />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                Actualizaciones del Programa
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Versión instalada actualmente: <strong className="font-mono text-gray-800 dark:text-gray-200">v{appVersion}</strong>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => checkForUpdates(true)}
            disabled={status === 'checking'}
            className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-xs shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer self-start sm:self-auto shrink-0"
          >
            <RefreshCw className={`w-4 h-4 ${status === 'checking' ? 'animate-spin' : ''}`} />
            <span>
              {status === 'checking' ? 'Buscando actualizaciones...' : 'Buscar actualizaciones'}
            </span>
          </button>
        </div>

        {/* Status notifications */}
        {status === 'up-to-date' && (
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/80 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div>
              <p className="font-bold">¡Tienes la versión más reciente instalada!</p>
              <p className="text-[11px] text-emerald-700/80 dark:text-emerald-300/80 mt-0.5">
                No hay actualizaciones pendientes disponibles en este momento.
              </p>
            </div>
          </div>
        )}

        {status === 'available' && updateInfo && (
          <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-xs text-indigo-900 dark:text-indigo-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <div>
                <p className="font-bold">¡Nueva versión v{updateInfo.version} disponible!</p>
                <p className="text-[11px] text-indigo-700 dark:text-indigo-300 mt-0.5">
                  Una versión más reciente está lista para descargarse e instalarse.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={downloadAndInstallUpdate}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition-colors cursor-pointer"
            >
              Instalar Actualización
            </button>
          </div>
        )}

        {status === 'error' && errorMessage && (
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-300 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Error al buscar actualizaciones</p>
              <p className="text-[11px] text-rose-700/90 dark:text-rose-300/90 mt-0.5 font-mono">
                {errorMessage}
              </p>
            </div>
          </div>
        )}

        {status === 'idle' && (
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
            Las actualizaciones comprueban directamente los lanzamientos oficiales en GitHub Releases y aplican mejoras de forma segura sin perder tus datos de estudio.
          </p>
        )}
      </div>

      {/* Core Features Bento Grid */}
      <div className="space-y-3">
        <div>
          <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-500" />
            <span>Módulos y Capacidades del Sistema</span>
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Arquitectura pedagógica diseñada para cubrir la comprensión, retención a largo plazo y producción activa.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {coreFeatures.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-white dark:bg-[#131722] border border-gray-200/80 dark:border-gray-800/80 shadow-xs hover:border-indigo-300 dark:hover:border-indigo-700 transition-all space-y-2.5"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${feat.bg} ${feat.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-sm text-gray-900 dark:text-white">
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
      </div>

      {/* Technical Specifications & Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tech Stack Card */}
        <div className="bg-white dark:bg-[#131722] rounded-3xl p-6 border border-gray-200/80 dark:border-gray-800/80 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Code2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-gray-900 dark:text-white">
                Ficha Técnica & Arquitectura
              </h3>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                Componentes de software y estándares de desarrollo
              </p>
            </div>
          </div>

          <div className="divide-y divide-gray-100 dark:divide-gray-800 text-xs">
            {techStack.map((item, i) => (
              <div key={i} className="py-2.5 flex items-center justify-between gap-4">
                <span className="text-gray-500 dark:text-gray-400">{item.label}</span>
                <span className="font-medium text-gray-900 dark:text-white font-mono text-right">
                  {item.val}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Project & Creator Info Card */}
        <div className="bg-white dark:bg-[#131722] rounded-3xl p-6 border border-gray-200/80 dark:border-gray-800/80 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
                <Heart className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-gray-900 dark:text-white">
                  Acerca del Proyecto
                </h3>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  Desarrollado para potenciar el aprendizaje autodidacta
                </p>
              </div>
            </div>

            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
              <strong>English Learning Assistant (ELA)</strong> fue concebido como un entorno de alta productividad para cerrar la brecha entre el estudio pasivo y la fluidez comunicativa real, integrando análisis fonético automatizado con retroalimentación socrática personalizada.
            </p>

            <div className="p-4 rounded-2xl bg-gray-50/80 dark:bg-[#181D2A] border border-gray-100 dark:border-gray-800 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-gray-500 dark:text-gray-400">Desarrollador:</span>
                <span className="font-semibold text-gray-900 dark:text-white">Josnaiker Rivas</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500 dark:text-gray-400">Tipo de Licencia:</span>
                <span className="font-semibold text-gray-900 dark:text-white">Código Abierto / Personal</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500 dark:text-gray-400">Motor de Sonido:</span>
                <span className="font-semibold text-indigo-600 dark:text-indigo-400">Síntesis TTS Nativa / Web Audio</span>
              </div>
            </div>
          </div>

          <div className="pt-2 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => handleOpenLink('https://github.com/JosGRM21/english_learning_assistant')}
              className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs font-semibold transition-colors inline-flex items-center gap-2 cursor-pointer"
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Repositorio en GitHub</span>
              <ExternalLink className="w-3 h-3 text-gray-400" />
            </button>

            <button
              type="button"
              onClick={() => handleOpenLink('https://github.com/JosGRM21/english_learning_assistant/releases')}
              className="px-4 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-xs font-semibold transition-colors inline-flex items-center gap-2 cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Notas de Versión (Releases)</span>
              <ExternalLink className="w-3 h-3 text-indigo-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Update Modal for download/install flow */}
      <UpdateModal
        isOpen={status === 'available' || status === 'downloading' || status === 'downloaded' || (status === 'error' && !!errorMessage)}
        status={status}
        updateInfo={updateInfo}
        downloadProgress={downloadProgress}
        errorMessage={errorMessage}
        onConfirmUpdate={downloadAndInstallUpdate}
        onClose={dismissModal}
      />
    </div>
  );
}
