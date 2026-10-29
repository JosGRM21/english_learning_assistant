export interface ManagedApiKey {
  id: string;
  key: string;
  label: string;
  isExhaustedToday: boolean;
  totalCallsToday: number;
  lastCallTimestamp: number;
  consecutiveRpmErrors: number;
  activeRequests: number;
}

export class KeyPoolManager {
  private keys: ManagedApiKey[] = [];
  private currentIndex = 0;

  // Parámetros de seguridad y ritmo (10 RPM por worker / clave)
  // Intervalo mínimo entre llamadas de una misma clave: 6.000 ms (10 RPM efectivo)
  private readonly minIntervalMs: number;
  private readonly maxConcurrentPerKey: number;

  constructor(apiKeys: string[], minIntervalMs = 6000, maxConcurrentPerKey = 1) {
    if (apiKeys.length === 0) {
      throw new Error('KeyPoolManager requiere al menos una API Key válida.');
    }
    this.minIntervalMs = minIntervalMs;
    this.maxConcurrentPerKey = maxConcurrentPerKey;

    this.keys = apiKeys.map((k, idx) => ({
      id: `key_${idx + 1}`,
      key: k.trim(),
      label: `API Key #${idx + 1} (...${k.slice(-4)})`,
      isExhaustedToday: false,
      totalCallsToday: 0,
      lastCallTimestamp: 0,
      consecutiveRpmErrors: 0,
      activeRequests: 0,
    }));
  }

  public getActiveKeysCount(): number {
    return this.keys.filter((k) => !k.isExhaustedToday).length;
  }

  public getTotalKeysCount(): number {
    return this.keys.length;
  }

  /**
   * Obtiene la siguiente clave disponible respetando el intervalo de RPM y concurrencia.
   * Si todas están ocupadas o en ventana de tiempo, espera dinámicamente hasta que una esté lista.
   */
  public async acquireKey(): Promise<ManagedApiKey> {
    while (true) {
      const activeKeys = this.keys.filter((k) => !k.isExhaustedToday);
      if (activeKeys.length === 0) {
        throw new Error(
          'TODAS las claves API del pool han agotado su cuota diaria (RPD). Reanude mañana o configure claves adicionales.'
        );
      }

      const now = Date.now();
      let bestKey: ManagedApiKey | null = null;
      let minWaitNeeded = Infinity;

      // Round-robin entre claves activas buscando la primera lista
      for (let i = 0; i < activeKeys.length; i++) {
        const candidateIndex = (this.currentIndex + i) % activeKeys.length;
        const candidate = activeKeys[candidateIndex];

        if (candidate.activeRequests >= this.maxConcurrentPerKey) {
          continue; // Ya está procesando su máximo concurrente
        }

        const elapsedSinceLast = now - candidate.lastCallTimestamp;
        const waitTime = Math.max(0, this.minIntervalMs - elapsedSinceLast);

        if (waitTime === 0) {
          bestKey = candidate;
          this.currentIndex = (candidateIndex + 1) % activeKeys.length;
          break;
        } else if (waitTime < minWaitNeeded) {
          minWaitNeeded = waitTime;
        }
      }

      if (bestKey) {
        bestKey.activeRequests++;
        bestKey.lastCallTimestamp = Date.now();
        bestKey.totalCallsToday++;
        return bestKey;
      }

      // Si ninguna estaba lista inmediatamente, esperar el tiempo mínimo necesario
      const sleepTime = Math.min(Math.max(100, minWaitNeeded), 2000);
      await new Promise((resolve) => setTimeout(resolve, sleepTime));
    }
  }

  public releaseKey(keyId: string): void {
    const k = this.keys.find((x) => x.id === keyId);
    if (k && k.activeRequests > 0) {
      k.activeRequests--;
    }
  }

  public markExhaustedDaily(keyId: string): void {
    const k = this.keys.find((x) => x.id === keyId);
    if (k) {
      k.isExhaustedToday = true;
      console.warn(`[Pool] ⚠️  ${k.label} ha agotado su cuota diaria (RPD) y se suspende por hoy.`);
    }
  }

  public recordSuccess(keyId: string): void {
    const k = this.keys.find((x) => x.id === keyId);
    if (k) {
      k.consecutiveRpmErrors = 0;
    }
  }

  public recordRpmError(keyId: string): void {
    const k = this.keys.find((x) => x.id === keyId);
    if (k) {
      k.consecutiveRpmErrors++;
      // Penalizar preventivamente el timestamp para dar respiro
      k.lastCallTimestamp = Date.now() + 2000;
    }
  }

  public getStatusSummary(): string {
    const active = this.getActiveKeysCount();
    const total = this.getTotalKeysCount();
    const totalCalls = this.keys.reduce((sum, k) => sum + k.totalCallsToday, 0);
    return `Claves activas: ${active}/${total} | Peticiones enviadas: ${totalCalls}`;
  }
}
