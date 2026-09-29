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

  it('throws QuotaExhaustedError when all keys and models reach their 20 RPD limits', () => {
    const models = ['gemini-3.8-flash', 'gemini-3.7-flash', 'gemini-3.6-flash', 'gemini-3.5-flash'] as const;
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
});
