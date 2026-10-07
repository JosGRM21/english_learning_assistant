import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

export type GeminiModelId =
  | 'gemini-3.8-flash'
  | 'gemini-3.7-flash'
  | 'gemini-3.6-flash'
  | 'gemini-3.5-flash-lite';

export const GEMINI_MODEL_HIERARCHY: GeminiModelId[] = [
  'gemini-3.8-flash',
  'gemini-3.7-flash',
  'gemini-3.6-flash',
  'gemini-3.5-flash-lite',
];

export interface ModelLimitConfig {
  rpmLimit: number;
  dailyLimit: number;
}

export const GEMINI_MODEL_LIMITS: Record<GeminiModelId, ModelLimitConfig> = {
  'gemini-3.8-flash': { rpmLimit: 5, dailyLimit: 20 },
  'gemini-3.7-flash': { rpmLimit: 5, dailyLimit: 20 },
  'gemini-3.6-flash': { rpmLimit: 5, dailyLimit: 20 },
  'gemini-3.5-flash-lite': { rpmLimit: 15, dailyLimit: 500 },
};

export const TOTAL_DAILY_LIMIT_PER_KEY = Object.values(GEMINI_MODEL_LIMITS).reduce(
  (acc, val) => acc + val.dailyLimit,
  0,
); // 20 + 20 + 20 + 500 = 560

export const STORAGE_QUOTA_STATES_KEY = 'ela_ai_quota_states';
export const STORAGE_REQUEST_LOGS_KEY = 'ela_ai_request_logs';

export interface ModelQuotaState {
  apiKeyId: string;
  modelId: GeminiModelId;
  requestsToday: number;
  dailyLimit: number;
  rpmLimit: number;
  lastRequestTimestamp: string | null;
  rpmCooldownUntil: string | null;
  rpdStatus: 'AVAILABLE' | 'EXHAUSTED_UNTIL_MIDNIGHT_PT';
  lastPtResetDate: string; // YYYY-MM-DD
}

export interface ApiKeyEntry {
  id: string;
  label: string;
  secretKey: string;
  maskedKey: string;
  isActive: boolean;
  isPrimary: boolean;
}

export interface ApiRequestLog {
  id: string;
  timestamp: string; // ISO string
  apiKeyId: string;
  apiKeyLabel: string;
  modelId: GeminiModelId;
  action: string;
  status: 'SUCCESS' | 'ERROR' | 'RATE_LIMITED';
  errorDetails?: string;
}

export interface ApiKeyQuotaSummary {
  apiKey: ApiKeyEntry;
  totalRequestsToday: number;
  dailyLimit: number; // 560 (20 + 20 + 20 + 500)
  remainingRequests: number;
  rpdStatus: 'AVAILABLE' | 'EXHAUSTED_UNTIL_MIDNIGHT_PT';
  hasRpmCooldown: boolean;
  modelBreakdown: Record<GeminiModelId, number>;
  modelLimits: Record<GeminiModelId, ModelLimitConfig>;
  modelQuotas: Record<GeminiModelId, ModelQuotaState>;
}

export interface ResolvedRoute {
  apiKeyId: string;
  secretKey: string;
  modelId: GeminiModelId;
  fallbackOccurred: boolean;
  reason?: string;
}

export class QuotaExhaustedError extends Error {
  constructor(
    message: string,
    public readonly timeUntilResetMs: number,
    public readonly resetIsoDate: string,
  ) {
    super(message);
    this.name = 'QuotaExhaustedError';
  }
}

export interface QuotaPersistenceHandler {
  saveQuotas?: (quotas: ModelQuotaState[]) => void | Promise<void>;
}

export class QuotaMatrixOrchestrator {
  private readonly quotaMap = new Map<string, ModelQuotaState>(); // key: `${apiKeyId}::${modelId}`
  private apiKeys: ApiKeyEntry[] = [];
  private defaultModel: GeminiModelId = 'gemini-3.8-flash';
  private requestLogs: ApiRequestLog[] = [];
  private readonly listeners = new Set<() => void>();
  private persistenceHandler?: QuotaPersistenceHandler;

  constructor(
    initialKeys: ApiKeyEntry[] = [],
    initialModel?: GeminiModelId,
    initialQuotas?: ModelQuotaState[],
    initialLogs?: ApiRequestLog[],
    persistenceHandler?: QuotaPersistenceHandler,
  ) {
    this.persistenceHandler = persistenceHandler;

    if (initialQuotas && initialQuotas.length > 0) {
      for (const item of initialQuotas) {
        const key = this.getQuotaKey(item.apiKeyId, item.modelId);
        const limits = GEMINI_MODEL_LIMITS[item.modelId];
        this.quotaMap.set(key, {
          ...item,
          dailyLimit: limits ? limits.dailyLimit : item.dailyLimit,
          rpmLimit: limits ? limits.rpmLimit : item.rpmLimit,
        });
      }
    } else {
      this.loadQuotasFromStorage();
    }

    if (initialLogs && initialLogs.length > 0) {
      this.requestLogs = [...initialLogs];
    }

    this.setApiKeys(initialKeys);
    if (initialModel && GEMINI_MODEL_HIERARCHY.includes(initialModel)) {
      this.defaultModel = initialModel;
    }
  }

  public setPersistenceHandler(handler: QuotaPersistenceHandler): void {
    this.persistenceHandler = handler;
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(): void {
    for (const listener of this.listeners) {
      try {
        listener();
      } catch {
        // ignore
      }
    }
  }

  private loadQuotasFromStorage(): void {
    try {
      if (typeof localStorage === 'undefined') return;
      const raw = localStorage.getItem(STORAGE_QUOTA_STATES_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          if (item && item.apiKeyId && item.modelId) {
            const key = this.getQuotaKey(item.apiKeyId, item.modelId);
            const limits = GEMINI_MODEL_LIMITS[item.modelId as GeminiModelId];
            this.quotaMap.set(key, {
              ...item,
              dailyLimit: limits ? limits.dailyLimit : item.dailyLimit,
              rpmLimit: limits ? limits.rpmLimit : item.rpmLimit,
            });
          }
        }
      }
    } catch {
      // ignore
    }
  }

  public importQuotas(quotas: ModelQuotaState[]): void {
    if (!Array.isArray(quotas)) return;
    for (const item of quotas) {
      if (item && item.apiKeyId && item.modelId) {
        const key = this.getQuotaKey(item.apiKeyId, item.modelId);
        const limits = GEMINI_MODEL_LIMITS[item.modelId as GeminiModelId];
        this.quotaMap.set(key, {
          ...item,
          dailyLimit: limits ? limits.dailyLimit : item.dailyLimit,
          rpmLimit: limits ? limits.rpmLimit : item.rpmLimit,
        });
      }
    }
    this.persistQuotas();
    this.notifyListeners();
  }

  private persistQuotas(): void {
    const items = Array.from(this.quotaMap.values());
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_QUOTA_STATES_KEY, JSON.stringify(items));
      }
    } catch {
      // ignore
    }

    if (this.persistenceHandler?.saveQuotas) {
      try {
        this.persistenceHandler.saveQuotas(items);
      } catch (err) {
        console.warn('[QuotaMatrixOrchestrator] Failed to persist quotas to handler:', err);
      }
    }
  }

  public logRequest(log: Omit<ApiRequestLog, 'id'>): ApiRequestLog {
    const entry: ApiRequestLog = {
      id: `req_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      ...log,
    };
    this.requestLogs.unshift(entry);
    if (this.requestLogs.length > 100) {
      this.requestLogs = this.requestLogs.slice(0, 100);
    }
    this.notifyListeners();
    return entry;
  }

  public getRequestLogs(): ApiRequestLog[] {
    return [...this.requestLogs];
  }

  public clearRequestLogs(): void {
    this.requestLogs = [];
    this.notifyListeners();
  }

  public getDefaultModel(): GeminiModelId {
    return this.defaultModel;
  }

  public setDefaultModel(model: GeminiModelId): void {
    if (GEMINI_MODEL_HIERARCHY.includes(model)) {
      this.defaultModel = model;
      this.notifyListeners();
    }
  }

  public getApiKeys(): ApiKeyEntry[] {
    return this.apiKeys.map((k) => ({ ...k }));
  }

  public addApiKey(key: ApiKeyEntry): void {
    if (key.isPrimary) {
      this.apiKeys.forEach((k) => (k.isPrimary = false));
    }
    const existingIndex = this.apiKeys.findIndex((k) => k.id === key.id);
    if (existingIndex >= 0) {
      this.apiKeys[existingIndex] = { ...key };
    } else {
      this.apiKeys.push({ ...key });
    }
    this.setApiKeys(this.apiKeys);
  }

  public removeApiKey(keyId: string): void {
    this.apiKeys = this.apiKeys.filter((k) => k.id !== keyId);
    if (this.apiKeys.length > 0 && !this.apiKeys.some((k) => k.isPrimary)) {
      this.apiKeys[0].isPrimary = true;
    }
    for (const model of GEMINI_MODEL_HIERARCHY) {
      this.quotaMap.delete(this.getQuotaKey(keyId, model));
    }
    this.persistQuotas();
    this.notifyListeners();
  }

  public toggleApiKey(keyId: string): void {
    const key = this.apiKeys.find((k) => k.id === keyId);
    if (key) {
      if (this.apiKeys.length <= 1 && key.isActive) {
        return;
      }
      const activeCount = this.apiKeys.filter((k) => k.isActive).length;
      if (key.isActive && activeCount <= 1) {
        return;
      }
      key.isActive = !key.isActive;
      this.notifyListeners();
    }
  }

  public setPrimaryApiKey(keyId: string): void {
    this.apiKeys.forEach((k) => {
      k.isPrimary = k.id === keyId;
    });
    this.notifyListeners();
  }

  public getKeyQuotaSummary(apiKeyId: string): ApiKeyQuotaSummary | undefined {
    this.checkAndResetPtQuotas();
    const key = this.apiKeys.find((k) => k.id === apiKeyId);
    if (!key) return undefined;

    let totalRequestsToday = 0;
    let totalLimit = 0;
    let hasRpmCooldown = false;
    let isExhausted = true;
    const now = new Date();
    const modelBreakdown: Record<GeminiModelId, number> = {
      'gemini-3.8-flash': 0,
      'gemini-3.7-flash': 0,
      'gemini-3.6-flash': 0,
      'gemini-3.5-flash-lite': 0,
    };
    const modelQuotas: Record<GeminiModelId, ModelQuotaState> = {} as Record<GeminiModelId, ModelQuotaState>;

    for (const model of GEMINI_MODEL_HIERARCHY) {
      const q = this.getQuotaState(apiKeyId, model);
      if (q) {
        totalRequestsToday += q.requestsToday;
        totalLimit += q.dailyLimit;
        modelBreakdown[model] = q.requestsToday;
        modelQuotas[model] = { ...q };
        if (q.rpdStatus === 'AVAILABLE' && q.requestsToday < q.dailyLimit) {
          isExhausted = false;
        }
        if (q.rpmCooldownUntil && now < new Date(q.rpmCooldownUntil)) {
          hasRpmCooldown = true;
        }
      }
    }

    const remainingRequests = Math.max(0, totalLimit - totalRequestsToday);

    return {
      apiKey: { ...key },
      totalRequestsToday,
      dailyLimit: totalLimit || TOTAL_DAILY_LIMIT_PER_KEY,
      remainingRequests,
      rpdStatus: isExhausted || remainingRequests === 0 ? 'EXHAUSTED_UNTIL_MIDNIGHT_PT' : 'AVAILABLE',
      hasRpmCooldown,
      modelBreakdown,
      modelLimits: { ...GEMINI_MODEL_LIMITS },
      modelQuotas,
    };
  }

  public getAllKeyQuotaSummaries(): ApiKeyQuotaSummary[] {
    this.checkAndResetPtQuotas();
    return this.apiKeys
      .map((k) => this.getKeyQuotaSummary(k.id))
      .filter((s): s is ApiKeyQuotaSummary => Boolean(s));
  }

  public setApiKeys(keys: ApiKeyEntry[]): void {
    this.apiKeys = keys.map((k) => ({ ...k }));
    if (this.apiKeys.length === 1) {
      this.apiKeys[0].isActive = true;
      this.apiKeys[0].isPrimary = true;
    }

    // Clean up quotas for removed keys
    const currentKeyIds = new Set(this.apiKeys.map((k) => k.id));
    for (const [quotaKey, quota] of this.quotaMap.entries()) {
      if (!currentKeyIds.has(quota.apiKeyId)) {
        this.quotaMap.delete(quotaKey);
      }
    }

    for (const key of this.apiKeys) {
      for (const model of GEMINI_MODEL_HIERARCHY) {
        const id = this.getQuotaKey(key.id, model);
        const limits = GEMINI_MODEL_LIMITS[model];
        const existing = this.quotaMap.get(id);
        if (!existing) {
          this.quotaMap.set(id, {
            apiKeyId: key.id,
            modelId: model,
            requestsToday: 0,
            dailyLimit: limits.dailyLimit,
            rpmLimit: limits.rpmLimit,
            lastRequestTimestamp: null,
            rpmCooldownUntil: null,
            rpdStatus: 'AVAILABLE',
            lastPtResetDate: this.getCurrentPtDate(),
          });
        } else {
          // Keep requestsToday and state, but ensure limits are up to date
          existing.dailyLimit = limits.dailyLimit;
          existing.rpmLimit = limits.rpmLimit;
        }
      }
    }

    this.checkAndResetPtQuotas();
    this.persistQuotas();
    this.notifyListeners();
  }

  public getQuotaKey(apiKeyId: string, modelId: GeminiModelId): string {
    return `${apiKeyId}::${modelId}`;
  }

  /**
   * Returns current date in America/Los_Angeles (Pacific Time: PT).
   */
  public getCurrentPtDate(now: Date = new Date()): string {
    return dayjs(now).tz('America/Los_Angeles').format('YYYY-MM-DD');
  }

  /**
   * Calculates time remaining until 00:00:00 PT tomorrow.
   */
  public getTimeUntilMidnightPt(now: Date = new Date()): { ms: number; isoDate: string } {
    const ptNow = dayjs(now).tz('America/Los_Angeles');
    const ptMidnight = ptNow.endOf('day').add(1, 'second');
    const ms = Math.max(0, ptMidnight.diff(ptNow));
    return { ms, isoDate: ptMidnight.toISOString() };
  }

  /**
   * Resets quotas if a new day has arrived in Pacific Time.
   */
  public checkAndResetPtQuotas(now: Date = new Date()): void {
    const todayPt = this.getCurrentPtDate(now);
    let changed = false;

    for (const quota of this.quotaMap.values()) {
      if (quota.lastPtResetDate !== todayPt) {
        quota.requestsToday = 0;
        quota.rpdStatus = 'AVAILABLE';
        quota.lastPtResetDate = todayPt;
        changed = true;
      }
      if (quota.rpmCooldownUntil && now >= new Date(quota.rpmCooldownUntil)) {
        quota.rpmCooldownUntil = null;
        changed = true;
      }
    }

    if (changed) {
      this.persistQuotas();
      this.notifyListeners();
    }
  }

  public getQuotaState(apiKeyId: string, modelId: GeminiModelId): ModelQuotaState | undefined {
    return this.quotaMap.get(this.getQuotaKey(apiKeyId, modelId));
  }

  public getAllQuotas(): ModelQuotaState[] {
    this.checkAndResetPtQuotas();
    return Array.from(this.quotaMap.values());
  }

  /**
   * Resolves the best available API Key route for the specified model.
   * NOTE: Automatic model failover is completely eliminated.
   * Requests strictly use the requested/configured model.
   * If all active keys are exhausted or unavailable for the requested model,
   * a QuotaExhaustedError is thrown. Model switches are strictly manual.
   */
  public resolveRoute(
    preferredModel: GeminiModelId = 'gemini-3.8-flash',
    now: Date = new Date(),
  ): ResolvedRoute {
    this.checkAndResetPtQuotas(now);

    const activeKeys = this.apiKeys.filter((k) => k.isActive);
    if (activeKeys.length === 0) {
      throw new Error('No active API keys configured in the AI pool');
    }

    // Sort active keys: primary key first
    const sortedKeys = [...activeKeys].sort((a, b) => (b.isPrimary ? 1 : 0) - (a.isPrimary ? 1 : 0));

    // Target model is strictly preferredModel - NO automatic model failover under any circumstance
    const targetModel = preferredModel;

    for (const key of sortedKeys) {
      const quota = this.getQuotaState(key.id, targetModel);
      if (!quota) continue;

      // Check if exhausted for the day
      if (quota.rpdStatus === 'EXHAUSTED_UNTIL_MIDNIGHT_PT' || quota.requestsToday >= quota.dailyLimit) {
        continue;
      }

      // Check if in RPM cooldown
      if (quota.rpmCooldownUntil) {
        const cooldownDate = new Date(quota.rpmCooldownUntil);
        if (now < cooldownDate) {
          continue; // Cooldown still active, try next key
        }
      }

      // Match found for targetModel!
      const fallbackOccurred = key.id !== sortedKeys[0].id;
      return {
        apiKeyId: key.id,
        secretKey: key.secretKey,
        modelId: targetModel,
        fallbackOccurred,
        reason: fallbackOccurred
          ? `Routed to backup key "${key.label}" due to primary key quota saturation`
          : undefined,
      };
    }

    // If all keys for targetModel are exhausted or in cooldown
    const { ms, isoDate } = this.getTimeUntilMidnightPt(now);
    const hours = (ms / (1000 * 60 * 60)).toFixed(1);
    throw new QuotaExhaustedError(
      `All ${activeKeys.length} API keys exhausted for model ${targetModel}. Quota will reset at midnight Pacific Time (${hours} hours remaining).`,
      ms,
      isoDate,
    );
  }

  /**
   * Records a successfully executed request on the route.
   */
  public recordSuccess(apiKeyId: string, modelId: GeminiModelId, now: Date = new Date()): void {
    const quota = this.getQuotaState(apiKeyId, modelId);
    if (!quota) return;

    quota.requestsToday += 1;
    quota.lastRequestTimestamp = now.toISOString();

    if (quota.requestsToday >= quota.dailyLimit) {
      quota.rpdStatus = 'EXHAUSTED_UNTIL_MIDNIGHT_PT';
    }

    this.persistQuotas();
    this.notifyListeners();
  }

  /**
   * Records an HTTP 429 error and applies the appropriate quota penalty.
   */
  public recordHttp429(
    apiKeyId: string,
    modelId: GeminiModelId,
    errorPayload: string,
    now: Date = new Date(),
  ): void {
    const quota = this.getQuotaState(apiKeyId, modelId);
    if (!quota) return;

    const lower = errorPayload.toLowerCase();
    const isRpm =
      lower.includes('perminute') ||
      lower.includes('rpm') ||
      lower.includes('retry-after') ||
      lower.includes('rate limit');

    if (isRpm) {
      // 30 seconds RPM cooldown
      const cooldown = new Date(now.getTime() + 30 * 1000);
      quota.rpmCooldownUntil = cooldown.toISOString();
    } else {
      // Exhausted until midnight PT (RPD limit reached)
      quota.requestsToday = quota.dailyLimit;
      quota.rpdStatus = 'EXHAUSTED_UNTIL_MIDNIGHT_PT';
    }

    this.persistQuotas();
    this.notifyListeners();
  }
}
