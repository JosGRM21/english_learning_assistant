import { describe, it, expect, beforeEach } from 'vitest';
import {
  QuotaMatrixOrchestrator,
  ApiKeyEntry,
  QuotaExhaustedError,
  GEMINI_MODEL_LIMITS,
  TOTAL_DAILY_LIMIT_PER_KEY,
  STORAGE_QUOTA_STATES_KEY,
  STORAGE_REQUEST_LOGS_KEY,
} from '../QuotaMatrixOrchestrator';

describe('QuotaMatrixOrchestrator', () => {
  let orchestrator: QuotaMatrixOrchestrator;

  const mockKeys: ApiKeyEntry[] = [
    {
      id: 'key_1',
      label: 'Personal Primary Key',
      secretKey: 'AIzaSy_MockKey_1',
      maskedKey: 'AIzaSy...Key_1',
      isActive: true,
      isPrimary: true,
    },
    {
      id: 'key_2',
      label: 'Backup Key',
      secretKey: 'AIzaSy_MockKey_2',
      maskedKey: 'AIzaSy...Key_2',
      isActive: true,
      isPrimary: false,
    },
  ];

  beforeEach(() => {
    localStorage.clear();
    orchestrator = new QuotaMatrixOrchestrator(mockKeys);
  });

  it('configures model limits correctly (3.8, 3.7, 3.6: 5 RPM / 20 RPD; 3.5 Flash Lite: 15 RPM / 500 RPD)', () => {
    expect(GEMINI_MODEL_LIMITS['gemini-3.8-flash']).toEqual({ rpmLimit: 5, dailyLimit: 20 });
    expect(GEMINI_MODEL_LIMITS['gemini-3.7-flash']).toEqual({ rpmLimit: 5, dailyLimit: 20 });
    expect(GEMINI_MODEL_LIMITS['gemini-3.6-flash']).toEqual({ rpmLimit: 5, dailyLimit: 20 });
    expect(GEMINI_MODEL_LIMITS['gemini-3.5-flash-lite']).toEqual({ rpmLimit: 15, dailyLimit: 500 });

    const q38 = orchestrator.getQuotaState('key_1', 'gemini-3.8-flash');
    expect(q38?.dailyLimit).toBe(20);
    expect(q38?.rpmLimit).toBe(5);

    const q35 = orchestrator.getQuotaState('key_1', 'gemini-3.5-flash-lite');
    expect(q35?.dailyLimit).toBe(500);
    expect(q35?.rpmLimit).toBe(15);

    expect(TOTAL_DAILY_LIMIT_PER_KEY).toBe(560);
  });

  it('routes to primary key and preferred model initially', () => {
    const route = orchestrator.resolveRoute('gemini-3.8-flash');
    expect(route.apiKeyId).toBe('key_1');
    expect(route.modelId).toBe('gemini-3.8-flash');
    expect(route.fallbackOccurred).toBe(false);
  });

  it('cascades to secondary key when primary key reaches 20 RPD for preferred model', () => {
    // Consume all 20 RPD for gemini-3.8-flash on key_1
    for (let i = 0; i < 20; i++) {
      orchestrator.recordSuccess('key_1', 'gemini-3.8-flash');
    }

    const route = orchestrator.resolveRoute('gemini-3.8-flash');
    expect(route.apiKeyId).toBe('key_2');
    expect(route.modelId).toBe('gemini-3.8-flash');
    expect(route.fallbackOccurred).toBe(true);
  });

  it('supports up to 500 RPD for gemini-3.5-flash-lite', () => {
    for (let i = 0; i < 25; i++) {
      orchestrator.recordSuccess('key_1', 'gemini-3.5-flash-lite');
    }
    const q35 = orchestrator.getQuotaState('key_1', 'gemini-3.5-flash-lite');
    expect(q35?.requestsToday).toBe(25);
    expect(q35?.rpdStatus).toBe('AVAILABLE');

    // Route still picks key_1 for 3.5 flash lite because 25 < 500
    const route = orchestrator.resolveRoute('gemini-3.5-flash-lite');
    expect(route.apiKeyId).toBe('key_1');
  });

  it('does NOT cascade down model hierarchy when all keys exhaust a model (throws QuotaExhaustedError for that model)', () => {
    // Exhaust gemini-3.8-flash on both keys
    for (let i = 0; i < 20; i++) {
      orchestrator.recordSuccess('key_1', 'gemini-3.8-flash');
      orchestrator.recordSuccess('key_2', 'gemini-3.8-flash');
    }

    // Must NOT switch to gemini-3.7-flash or any other model; must throw QuotaExhaustedError
    expect(() => orchestrator.resolveRoute('gemini-3.8-flash')).toThrowError(QuotaExhaustedError);
  });

  it('handles HTTP 429 RPM by applying 30s cooldown and routing to next available key for the same model', () => {
    const now = new Date('2026-09-29T12:00:00Z');
    orchestrator.recordHttp429('key_1', 'gemini-3.8-flash', 'RequestsPerMinute exceeded', now);

    const quota1 = orchestrator.getQuotaState('key_1', 'gemini-3.8-flash');
    expect(quota1?.rpmCooldownUntil).not.toBeNull();

    // Next request at now + 5s routes to key_2 for the SAME model
    const route = orchestrator.resolveRoute('gemini-3.8-flash', new Date('2026-09-29T12:00:05Z'));
    expect(route.apiKeyId).toBe('key_2');
    expect(route.modelId).toBe('gemini-3.8-flash');
  });

  it('never performs automatic model failover for 503 or quota; model selection is strictly manual', () => {
    // Even if preferred model key is in cooldown or exhausted, it NEVER switches model automatically
    const now = new Date('2026-09-29T12:00:00Z');
    orchestrator.recordHttp429('key_1', 'gemini-3.8-flash', 'RequestsPerMinute exceeded', now);
    orchestrator.recordHttp429('key_2', 'gemini-3.8-flash', 'RequestsPerMinute exceeded', now);

    // Both keys for gemini-3.8-flash are in cooldown: must throw QuotaExhaustedError, NOT switch to 3.7
    expect(() =>
      orchestrator.resolveRoute('gemini-3.8-flash', new Date('2026-09-29T12:00:05Z')),
    ).toThrowError(QuotaExhaustedError);

    // Model can ONLY be changed manually by the user
    orchestrator.setDefaultModel('gemini-3.7-flash');
    const manualRoute = orchestrator.resolveRoute(orchestrator.getDefaultModel());
    expect(manualRoute.modelId).toBe('gemini-3.7-flash');
    expect(manualRoute.apiKeyId).toBe('key_1');
  });

  it('computes time remaining until midnight PT correctly', () => {
    const { ms, isoDate } = orchestrator.getTimeUntilMidnightPt();
    expect(ms).toBeGreaterThan(0);
    expect(ms).toBeLessThanOrEqual(24 * 60 * 60 * 1000);
    expect(isoDate).toBeDefined();
  });

  it('aggregates quota per API key correctly with 560 total daily limit', () => {
    // Record 5 requests on 3.8 and 10 on 3.7 for key_1
    for (let i = 0; i < 5; i++) {
      orchestrator.recordSuccess('key_1', 'gemini-3.8-flash');
    }
    for (let i = 0; i < 10; i++) {
      orchestrator.recordSuccess('key_1', 'gemini-3.7-flash');
    }

    const summary = orchestrator.getKeyQuotaSummary('key_1');
    expect(summary).toBeDefined();
    expect(summary?.dailyLimit).toBe(560);
    expect(summary?.totalRequestsToday).toBe(15);
    expect(summary?.remainingRequests).toBe(545);
    expect(summary?.rpdStatus).toBe('AVAILABLE');
    expect(summary?.modelBreakdown['gemini-3.8-flash']).toBe(5);
    expect(summary?.modelBreakdown['gemini-3.7-flash']).toBe(10);
    expect(summary?.modelBreakdown['gemini-3.6-flash']).toBe(0);
    expect(summary?.modelBreakdown['gemini-3.5-flash-lite']).toBe(0);
  });

  it('persists requests today to localStorage and reloads them on new instance start', () => {
    // Record 7 requests on 3.8 for key_1
    for (let i = 0; i < 7; i++) {
      orchestrator.recordSuccess('key_1', 'gemini-3.8-flash');
    }

    // Verify localStorage has saved the state
    const savedRaw = localStorage.getItem(STORAGE_QUOTA_STATES_KEY);
    expect(savedRaw).toBeTruthy();

    // Create a new orchestrator instance (simulating app restart / refresh)
    const newOrchestrator = new QuotaMatrixOrchestrator(mockKeys);
    const loadedState = newOrchestrator.getQuotaState('key_1', 'gemini-3.8-flash');

    // The requests must NOT be lost on application restart!
    expect(loadedState?.requestsToday).toBe(7);
    expect(loadedState?.dailyLimit).toBe(20);

    const summary = newOrchestrator.getKeyQuotaSummary('key_1');
    expect(summary?.totalRequestsToday).toBe(7);
    expect(summary?.remainingRequests).toBe(560 - 7);
  });

  it('records in-memory request logs during session without polluting localStorage', () => {
    orchestrator.logRequest({
      timestamp: new Date().toISOString(),
      apiKeyId: 'key_1',
      apiKeyLabel: 'Personal Primary Key',
      modelId: 'gemini-3.8-flash',
      action: 'Taller de Redacción (Fase 1)',
      status: 'SUCCESS',
    });

    const logs = orchestrator.getRequestLogs();
    expect(logs.length).toBe(1);
    expect(logs[0].action).toBe('Taller de Redacción (Fase 1)');

    // Request logs are strictly in-memory and not written to localStorage
    const savedLogsRaw = localStorage.getItem(STORAGE_REQUEST_LOGS_KEY);
    expect(savedLogsRaw).toBeNull();

    // Can clear logs
    orchestrator.clearRequestLogs();
    expect(orchestrator.getRequestLogs().length).toBe(0);
  });

  it('invokes persistence handler when saving quotas', () => {
    let savedCount = 0;
    orchestrator.setPersistenceHandler({
      saveQuotas: (quotas) => {
        savedCount = quotas.length;
      },
    });

    orchestrator.recordSuccess('key_1', 'gemini-3.8-flash');
    expect(savedCount).toBeGreaterThan(0);
  });

  it('notifies subscribers when quotas or requests change', () => {
    let callCount = 0;
    const unsubscribe = orchestrator.subscribe(() => {
      callCount += 1;
    });

    orchestrator.recordSuccess('key_1', 'gemini-3.8-flash');
    expect(callCount).toBe(1);

    orchestrator.recordHttp429('key_1', 'gemini-3.8-flash', 'rate limit');
    expect(callCount).toBe(2);

    unsubscribe();
    orchestrator.recordSuccess('key_1', 'gemini-3.8-flash');
    expect(callCount).toBe(2);
  });

  it('allows adding, removing, and toggling API keys dynamically', () => {
    const newKey: ApiKeyEntry = {
      id: 'key_custom',
      label: 'New User Added Key',
      secretKey: 'AIzaSy_CustomKey_999',
      maskedKey: 'AIzaSy...999',
      isActive: true,
      isPrimary: false,
    };

    orchestrator.addApiKey(newKey);
    expect(orchestrator.getApiKeys().length).toBe(3);

    const summary = orchestrator.getKeyQuotaSummary('key_custom');
    expect(summary).toBeDefined();
    expect(summary?.dailyLimit).toBe(560);

    orchestrator.toggleApiKey('key_custom');
    const toggled = orchestrator.getApiKeys().find((k) => k.id === 'key_custom');
    expect(toggled?.isActive).toBe(false);

    orchestrator.removeApiKey('key_custom');
    expect(orchestrator.getApiKeys().length).toBe(2);
    expect(orchestrator.getKeyQuotaSummary('key_custom')).toBeUndefined();
  });

  it('manages default model configuration', () => {
    expect(orchestrator.getDefaultModel()).toBe('gemini-3.8-flash');
    orchestrator.setDefaultModel('gemini-3.7-flash');
    expect(orchestrator.getDefaultModel()).toBe('gemini-3.7-flash');

    const customOrchestrator = new QuotaMatrixOrchestrator([], 'gemini-3.5-flash-lite');
    expect(customOrchestrator.getDefaultModel()).toBe('gemini-3.5-flash-lite');
  });
});
