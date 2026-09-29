import { useState, useEffect, useMemo } from 'react';
import {
  Server,
  Key,
  ShieldCheck,
  AlertTriangle,
  RotateCw,
  Clock,
  Play,
  Cpu,
} from 'lucide-react';
import {
  QuotaMatrixOrchestrator,
  GEMINI_MODEL_HIERARCHY,
  GeminiModelId,
  ApiKeyEntry,
  ResolvedRoute,
} from '@/core/ai/QuotaMatrixOrchestrator';

const INITIAL_KEYS: ApiKeyEntry[] = [
  {
    id: 'key_primary',
    label: 'Primary Gemini Key (Prod)',
    secretKey: 'AIzaSyDemoPrimary_001',
    maskedKey: 'AIzaSy...001',
    isActive: true,
    isPrimary: true,
  },
  {
    id: 'key_backup',
    label: 'Secondary Gemini Key (Failover)',
    secretKey: 'AIzaSyDemoBackup_002',
    maskedKey: 'AIzaSy...002',
    isActive: true,
    isPrimary: false,
  },
];

export function QuotaMatrixMonitor() {
  const orchestrator = useMemo(() => new QuotaMatrixOrchestrator(INITIAL_KEYS), []);
  const [, setTick] = useState(0);

  const [lastRoute, setLastRoute] = useState<ResolvedRoute | null>(null);
  const [routeLog, setRouteLog] = useState<string[]>([]);
  const [simulateError429, setSimulateError429] = useState(false);

  // Time remaining until 00:00:00 Pacific Time
  const [timeUntilReset, setTimeUntilReset] = useState({ ms: 0, isoDate: '' });

  useEffect(() => {
    const updateTime = () => {
      setTimeUntilReset(orchestrator.getTimeUntilMidnightPt());
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [orchestrator]);

  const quotas = orchestrator.getAllQuotas();

  // Format milliseconds to HH:MM:SS
  const formatCountdown = (ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    const hours = Math.floor(totalSec / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const seconds = totalSec % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Simulate routing request
  const handleSimulateRequest = () => {
    try {
      const route = orchestrator.resolveRoute('gemini-3.8-flash');
      setLastRoute(route);

      if (simulateError429) {
        orchestrator.recordHttp429(
          route.apiKeyId,
          route.modelId,
          'Resource has been exhausted (e.g. check quota, 429 RPM)',
        );
        setRouteLog((prev) => [
          `[${new Date().toLocaleTimeString()}] 429 RPM aplicado a ${route.modelId} (${route.apiKeyId}) → Cooldown de 30s activado`,
          ...prev.slice(0, 7),
        ]);
      } else {
        orchestrator.recordSuccess(route.apiKeyId, route.modelId);
        const logMsg = route.fallbackOccurred
          ? `[${new Date().toLocaleTimeString()}] FALLBACK CASCADE: ${route.modelId} en ${route.apiKeyId} (Razón: ${route.reason})`
          : `[${new Date().toLocaleTimeString()}] Petición exitosa en ruta primaria: ${route.modelId} (${route.apiKeyId})`;
        setRouteLog((prev) => [logMsg, ...prev.slice(0, 7)]);
      }

      setTick((t) => t + 1);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setRouteLog((prev) => [
        `[${new Date().toLocaleTimeString()}] BLOQUEO: ${msg}`,
        ...prev.slice(0, 7),
      ]);
    }
  };

  // Reset demo quotas
  const handleResetQuotas = () => {
    orchestrator.setApiKeys(INITIAL_KEYS);
    setLastRoute(null);
    setRouteLog([]);
    setTick((t) => t + 1);
  };

  return (
    <div className="space-y-6">
      {/* Header & Reset Clock */}
      <div className="bg-white dark:bg-[#131722] rounded-3xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Cpu className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Matriz de Cuotas 2D & Failover Orchestrator (Google Gemini)
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Topología de 80 RPD / Key (20 RPD x 4 modelos Flash). Failover horizontal por claves y
                degradación vertical por modelos con reseteo sincronizado a 00:00:00 PT.
              </p>
            </div>
          </div>

          {/* Midnight PT countdown badge */}
          <div className="p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/60 flex items-center gap-3">
            <Clock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <div>
              <div className="text-[10px] uppercase font-bold text-indigo-600 dark:text-indigo-400">
                Reseteo Diario (00:00 PT)
              </div>
              <div className="text-base font-mono font-bold text-gray-900 dark:text-white">
                {formatCountdown(timeUntilReset.ms)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2D Matrix Grid: 4 Models x 2 Keys */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {GEMINI_MODEL_HIERARCHY.map((modelId: GeminiModelId) => {
          return (
            <div
              key={modelId}
              className="bg-white dark:bg-[#131722] rounded-3xl p-5 border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col justify-between"
            >
              <div>
                {/* Model Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Server className="w-4 h-4 text-indigo-500" />
                    <span className="font-bold text-sm text-gray-900 dark:text-white">
                      {modelId.replace('gemini-', '')}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                    20 RPD / 5 RPM
                  </span>
                </div>

                {/* Quota bars per API key */}
                <div className="space-y-3 pt-1">
                  {INITIAL_KEYS.map((key) => {
                    const q = quotas.find(
                      (item) => item.modelId === modelId && item.apiKeyId === key.id,
                    );
                    const count = q?.requestsToday ?? 0;
                    const isExhausted = q?.rpdStatus === 'EXHAUSTED_UNTIL_MIDNIGHT_PT';
                    const isCooldown = Boolean(q?.rpmCooldownUntil && new Date() < new Date(q.rpmCooldownUntil));
                    const percentage = Math.min(100, (count / 20) * 100);

                    return (
                      <div
                        key={key.id}
                        className="p-2.5 rounded-xl bg-gray-50 dark:bg-[#181D2A] border border-gray-100 dark:border-gray-800/80"
                      >
                        <div className="flex justify-between items-center text-xs mb-1">
                          <span className="font-medium text-gray-700 dark:text-gray-300 truncate max-w-[120px]">
                            {key.label.split(' ')[0]} ({key.maskedKey})
                          </span>
                          <span className="font-mono text-gray-900 dark:text-white font-semibold">
                            {count}/20
                          </span>
                        </div>

                        <div className="w-full h-1.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${
                              isExhausted
                                ? 'bg-rose-500'
                                : percentage > 80
                                  ? 'bg-amber-500'
                                  : 'bg-indigo-600'
                            }`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-gray-400 mt-1">
                          <span>
                            {isExhausted ? (
                              <span className="text-rose-500 font-semibold flex items-center gap-1">
                                <AlertTriangle className="w-2.5 h-2.5" /> RPD Agotado
                              </span>
                            ) : isCooldown ? (
                              <span className="text-amber-500 font-semibold flex items-center gap-1">
                                <Clock className="w-2.5 h-2.5" /> Cooldown RPM (30s)
                              </span>
                            ) : (
                              <span className="text-emerald-500 flex items-center gap-0.5">
                                <ShieldCheck className="w-2.5 h-2.5" /> Disponible
                              </span>
                            )}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Status Badge */}
              <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs text-gray-400">
                <span>Jerarquía:</span>
                <span className="font-mono font-medium text-indigo-600 dark:text-indigo-400">
                  Tier {GEMINI_MODEL_HIERARCHY.indexOf(modelId) + 1}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Interactive Simulation & Cascade Diagnostics */}
      <div className="bg-white dark:bg-[#131722] rounded-3xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-base text-gray-900 dark:text-white">
              Simulador de Cascada & Resiliencia
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Prueba la tolerancia a fallos. Al saturar 20 peticiones o forzar 429, el orquestador
              degradará fluidamente sin interrumpir el flujo del alumno.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300 cursor-pointer">
              <input
                type="checkbox"
                checked={simulateError429}
                onChange={(e) => setSimulateError429(e.target.checked)}
                className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
              <span>Forzar Error 429 (RPM)</span>
            </label>

            <button
              onClick={handleSimulateRequest}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Simular Petición IA</span>
            </button>

            <button
              onClick={handleResetQuotas}
              className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
              title="Restablecer contadores para pruebas"
            >
              <RotateCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Last Resolved Route Banner */}
        {lastRoute && (
          <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-[#181D2A] border border-gray-200 dark:border-gray-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-emerald-500" />
              <span className="text-gray-500 dark:text-gray-400">Ruta Seleccionada:</span>
              <strong className="font-mono text-gray-900 dark:text-white">
                {lastRoute.modelId}
              </strong>
              <span className="text-gray-400 font-mono">({lastRoute.apiKeyId})</span>
            </div>

            {lastRoute.fallbackOccurred && (
              <span className="px-2.5 py-0.5 rounded-md font-bold text-[10px] bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-800">
                FALLBACK CASCADE ACTIVO
              </span>
            )}
          </div>
        )}

        {/* Live Route Log */}
        {routeLog.length > 0 && (
          <div className="p-3 rounded-xl bg-gray-950 font-mono text-[11px] text-gray-300 space-y-1 max-h-36 overflow-y-auto">
            {routeLog.map((log, i) => (
              <div
                key={i}
                className={
                  log.includes('429')
                    ? 'text-rose-400'
                    : log.includes('FALLBACK')
                      ? 'text-amber-400'
                      : 'text-emerald-400'
                }
              >
                {log}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
