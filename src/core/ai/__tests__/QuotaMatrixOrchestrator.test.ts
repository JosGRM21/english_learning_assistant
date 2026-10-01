import { describe, it, expect, beforeEach } from 'vitest';
import {
  QuotaMatrixOrchestrator,
  ApiKeyEntry,
  QuotaExhaustedError,
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
    orchestrator = new QuotaMatrixOrchestrator(mockKeys);
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

  it('throws QuotaExhaustedError when all keys and models reach their 20 RPD limits', () => {
    const models = ['gemini-3.8-flash', 'gemini-3.7-flash', 'gemini-3.6-flash', 'gemini-3.5-flash-lite'] as const;
    for (const key of mockKeys) {
      for (const model of models) {
        for (let i = 0; i < 20; i++) {
          orchestrator.recordSuccess(key.id, model);
        }
      }
    }

    expect(() => orchestrator.resolveRoute('gemini-3.8-flash')).toThrowError(QuotaExhaustedError);
  });

  it('computes time remaining until midnight PT correctly', () => {
    const { ms, isoDate } = orchestrator.getTimeUntilMidnightPt();
    expect(ms).toBeGreaterThan(0);
    expect(ms).toBeLessThanOrEqual(24 * 60 * 60 * 1000);
    expect(isoDate).toBeDefined();
  });

  it('aggregates quota per API key correctly with 80 total daily limit', () => {
    // Record 5 requests on 3.8 and 10 on 3.7 for key_1
    for (let i = 0; i < 5; i++) {
      orchestrator.recordSuccess('key_1', 'gemini-3.8-flash');
    }
    for (let i = 0; i < 10; i++) {
      orchestrator.recordSuccess('key_1', 'gemini-3.7-flash');
    }

    const summary = orchestrator.getKeyQuotaSummary('key_1');
    expect(summary).toBeDefined();
    expect(summary?.dailyLimit).toBe(80);
    expect(summary?.totalRequestsToday).toBe(15);
    expect(summary?.remainingRequests).toBe(65);
    expect(summary?.rpdStatus).toBe('AVAILABLE');
    expect(summary?.modelBreakdown['gemini-3.8-flash']).toBe(5);
    expect(summary?.modelBreakdown['gemini-3.7-flash']).toBe(10);
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
    expect(summary?.dailyLimit).toBe(80);

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

