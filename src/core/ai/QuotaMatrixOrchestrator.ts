import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

export type GeminiModelId =
  | 'gemini-3.8-flash'
  | 'gemini-3.7-flash'
  | 'gemini-3.6-flash'
  | 'gemini-3.5-flash';

export const GEMINI_MODEL_HIERARCHY: GeminiModelId[] = [
  'gemini-3.8-flash',
  'gemini-3.7-flash',
  'gemini-3.6-flash',
  'gemini-3.5-flash',
];

export interface ModelQuotaState {
  apiKeyId: string;
  modelId: GeminiModelId;
  requestsToday: number;
  dailyLimit: number; // 20
  rpmLimit: number; // 5
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

export interface ApiKeyQuotaSummary {
  apiKey: ApiKeyEntry;
  totalRequestsToday: number;
  dailyLimit: number; // 80 (20 * 4 models)
  remainingRequests: number;
  rpdStatus: 'AVAILABLE' | 'EXHAUSTED_UNTIL_MIDNIGHT_PT';
  hasRpmCooldown: boolean;
  modelBreakdown: Record<GeminiModelId, number>;
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

export class QuotaMatrixOrchestrator {
  private readonly defaultDailyLimit = 20;
  private readonly defaultRpmLimit = 5;
  private readonly quotaMap = new Map<string, ModelQuotaState>(); // key: `${apiKeyId}::${modelId}`
  private apiKeys: ApiKeyEntry[] = [];
  private defaultModel: GeminiModelId = 'gemini-3.8-flash';

  constructor(initialKeys: ApiKeyEntry[] = []) {
    this.setApiKeys(initialKeys);
  }

  public getDefaultModel(): GeminiModelId {
    return this.defaultModel;
  }

  public setDefaultModel(model: GeminiModelId): void {
    if (GEMINI_MODEL_HIERARCHY.includes(model)) {
      this.defaultModel = model;
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
  }

  public toggleApiKey(keyId: string): void {
    const key = this.apiKeys.find((k) => k.id === keyId);
    if (key) {
      key.isActive = !key.isActive;
    }
  }

  public setPrimaryApiKey(keyId: string): void {
    this.apiKeys.forEach((k) => {
      k.isPrimary = k.id === keyId;
    });
  }

  public getKeyQuotaSummary(apiKeyId: string): ApiKeyQuotaSummary | undefined {
    this.checkAndResetPtQuotas();
    const key = this.apiKeys.find((k) => k.id === apiKeyId);
    if (!key) return undefined;

    let totalRequestsToday = 0;
    let hasRpmCooldown = false;
    let isExhausted = true;
    const now = new Date();
    const modelBreakdown: Record<GeminiModelId, number> = {
      'gemini-3.8-flash': 0,
      'gemini-3.7-flash': 0,
      'gemini-3.6-flash': 0,
      'gemini-3.5-flash': 0,
    };

    for (const model of GEMINI_MODEL_HIERARCHY) {
      const q = this.getQuotaState(apiKeyId, model);
      if (q) {
        totalRequestsToday += q.requestsToday;
        modelBreakdown[model] = q.requestsToday;
        if (q.rpdStatus === 'AVAILABLE' && q.requestsToday < q.dailyLimit) {
          isExhausted = false;
        }
        if (q.rpmCooldownUntil && now < new Date(q.rpmCooldownUntil)) {
          hasRpmCooldown = true;
        }
      }
    }

    const totalLimit = this.defaultDailyLimit * GEMINI_MODEL_HIERARCHY.length; // 20 * 4 = 80
    const remainingRequests = Math.max(0, totalLimit - totalRequestsToday);

    return {
      apiKey: { ...key },
      totalRequestsToday,
      dailyLimit: totalLimit,
      remainingRequests,
      rpdStatus: isExhausted || remainingRequests === 0 ? 'EXHAUSTED_UNTIL_MIDNIGHT_PT' : 'AVAILABLE',
      hasRpmCooldown,
      modelBreakdown,
    };
  }

  public getAllKeyQuotaSummaries(): ApiKeyQuotaSummary[] {
    this.checkAndResetPtQuotas();
    return this.apiKeys
      .map((k) => this.getKeyQuotaSummary(k.id))
      .filter((s): s is ApiKeyQuotaSummary => Boolean(s));
  }


  public setApiKeys(keys: ApiKeyEntry[]): void {
    this.apiKeys = [...keys];
    for (const key of keys) {
      for (const model of GEMINI_MODEL_HIERARCHY) {
        const id = this.getQuotaKey(key.id, model);
        if (!this.quotaMap.has(id)) {
          this.quotaMap.set(id, {
            apiKeyId: key.id,
            modelId: model,
            requestsToday: 0,
            dailyLimit: this.defaultDailyLimit,
            rpmLimit: this.defaultRpmLimit,
            lastRequestTimestamp: null,
            rpmCooldownUntil: null,
            rpdStatus: 'AVAILABLE',
            lastPtResetDate: this.getCurrentPtDate(),
          });
        }
      }
    }
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

    for (const quota of this.quotaMap.values()) {
      if (quota.lastPtResetDate !== todayPt) {
        quota.requestsToday = 0;
        quota.rpdStatus = 'AVAILABLE';
        quota.rpmCooldownUntil = null;
        quota.lastPtResetDate = todayPt;
      }
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
   * Resolves the best available (API Key, Model) route through 2D cascade.
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

    // Determine model cascade starting from preferredModel
    const startIndex = GEMINI_MODEL_HIERARCHY.indexOf(preferredModel);
    const modelCascade =
      startIndex >= 0
        ? [
            ...GEMINI_MODEL_HIERARCHY.slice(startIndex),
            ...GEMINI_MODEL_HIERARCHY.slice(0, startIndex),
          ]
        : GEMINI_MODEL_HIERARCHY;

    // 2D Search: Horizontal across keys, Vertical down models
    for (const model of modelCascade) {
      for (const key of sortedKeys) {
        const quota = this.getQuotaState(key.id, model);
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

        // Match found!
        const fallbackOccurred = model !== preferredModel || key.id !== sortedKeys[0].id;
        return {
          apiKeyId: key.id,
          secretKey: key.secretKey,
          modelId: model,
          fallbackOccurred,
          reason: fallbackOccurred
            ? `Routed to model ${model} on key "${key.label}" due to preferred quota saturation`
            : undefined,
        };
      }
    }

    // If all models and keys are exhausted
    const { ms, isoDate } = this.getTimeUntilMidnightPt(now);
    const hours = (ms / (1000 * 60 * 60)).toFixed(1);
    throw new QuotaExhaustedError(
      `All ${activeKeys.length} API keys and models exhausted. Quota will reset at midnight Pacific Time (${hours} hours remaining).`,
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
  }

  /**
   * Records an HTTP 429 error and applies the appropriate 2D penalty.
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
      // Exhausted until midnight PT
      quota.requestsToday = quota.dailyLimit;
      quota.rpdStatus = 'EXHAUSTED_UNTIL_MIDNIGHT_PT';
    }
  }
}
