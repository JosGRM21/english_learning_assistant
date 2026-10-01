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

  it('cascades down model hierarchy (3.8 -> 3.7 -> 3.6 -> 3.5) when all keys exhaust a model', () => {
    // Exhaust gemini-3.8-flash on both keys
    for (let i = 0; i < 20; i++) {
      orchestrator.recordSuccess('key_1', 'gemini-3.8-flash');
      orchestrator.recordSuccess('key_2', 'gemini-3.8-flash');
    }

    const route = orchestrator.resolveRoute('gemini-3.8-flash');
    expect(route.modelId).toBe('gemini-3.7-flash');
    expect(route.fallbackOccurred).toBe(true);
  });

  it('handles HTTP 429 RPM by applying 30s cooldown and routing to next available key', () => {
    const now = new Date('2026-09-29T12:00:00Z');
    orchestrator.recordHttp429('key_1', 'gemini-3.8-flash', 'RequestsPerMinute exceeded', now);

    const quota1 = orchestrator.getQuotaState('key_1', 'gemini-3.8-flash');
    expect(quota1?.rpmCooldownUntil).not.toBeNull();

    // Next request at now + 5s routes to key_2
    const route = orchestrator.resolveRoute('gemini-3.8-flash', new Date('2026-09-29T12:00:05Z'));
    expect(route.apiKeyId).toBe('key_2');
    expect(route.modelId).toBe('gemini-3.8-flash');
  });

  it('handles HTTP 503 model overloaded by applying 30s cooldown and failing over', () => {
    const now = new Date('2026-09-29T12:00:00Z');
    orchestrator.recordHttp429('key_1', 'gemini-3.8-flash', '503 Service Unavailable: The model is overloaded', now);

    const quota1 = orchestrator.getQuotaState('key_1', 'gemini-3.8-flash');
    expect(quota1?.rpmCooldownUntil).not.toBeNull();
    // Daily quota should NOT be exhausted by 503
    expect(quota1?.rpdStatus).toBe('AVAILABLE');
    expect(quota1?.requestsToday).toBe(0);

    // Resolves to next key or model
    const route = orchestrator.resolveRoute('gemini-3.8-flash', new Date('2026-09-29T12:00:05Z'));
    expect(route.apiKeyId).toBe('key_2');
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
  });
});

