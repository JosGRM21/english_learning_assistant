import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GeminiAiGateway } from '../GeminiAiGateway';
import { QuotaMatrixOrchestrator } from '@/core/ai/QuotaMatrixOrchestrator';

// Mock @google/genai
const mockGenerateContent = vi.fn();
vi.mock('@google/genai', () => {
  return {
    GoogleGenAI: class {
      models = {
        generateContent: mockGenerateContent,
      };
    },
  };
});

describe('GeminiAiGateway - No Automatic Model Failover', () => {
  let orchestrator: QuotaMatrixOrchestrator;
  let gateway: GeminiAiGateway;

  beforeEach(() => {
    vi.clearAllMocks();
    orchestrator = new QuotaMatrixOrchestrator([
      {
        id: 'key_1',
        label: 'Key 1',
        secretKey: 'AIzaSy_1',
        maskedKey: 'AIzaSy...1',
        isActive: true,
        isPrimary: true,
      },
      {
        id: 'key_2',
        label: 'Key 2',
        secretKey: 'AIzaSy_2',
        maskedKey: 'AIzaSy...2',
        isActive: true,
        isPrimary: false,
      },
    ]);
    gateway = new GeminiAiGateway(orchestrator, 'gemini-3.8-flash');
  });

  it('throws immediately on HTTP 503 model overloaded without switching models', async () => {
    mockGenerateContent.mockRejectedValueOnce(
      new Error('503 Service Unavailable: The model is overloaded'),
    );

    await expect(gateway.evaluateSocraticPhase1('Draft text')).rejects.toThrowError(
      /\[Gemini 503\] El modelo gemini-3.8-flash está temporalmente sobrecargado/,
    );

    // Only 1 attempt was made; no model failover or retries to 3.7
    expect(mockGenerateContent).toHaveBeenCalledTimes(1);
    expect(orchestrator.getDefaultModel()).toBe('gemini-3.8-flash');
  });

  it('uses preferred model and rotates API keys on 429 without ever changing model', async () => {
    // First key receives 429 quota error
    mockGenerateContent.mockRejectedValueOnce(new Error('429 RESOURCE_EXHAUSTED: Quota exceeded'));

    // Second key succeeds on the SAME model
    mockGenerateContent.mockResolvedValueOnce({
      text: JSON.stringify({
        overall_impression_es: 'Buen trabajo.',
        error_count: 0,
        allow_self_correction: true,
        scaffolded_clues: [],
      }),
    });

    const result = await gateway.evaluateSocraticPhase1('Draft text');
    expect(result.overall_impression_es).toBe('Buen trabajo.');

    // Both calls must have strictly targeted gemini-3.8-flash
    expect(mockGenerateContent).toHaveBeenCalledTimes(2);
    expect(mockGenerateContent.mock.calls[0][0].model).toBe('gemini-3.8-flash');
    expect(mockGenerateContent.mock.calls[1][0].model).toBe('gemini-3.8-flash');
  });

  it('records persistent request log entries on success and rate limit', async () => {
    mockGenerateContent.mockResolvedValueOnce({
      text: JSON.stringify({
        overall_impression_es: 'Excelente texto.',
        error_count: 0,
        allow_self_correction: true,
        scaffolded_clues: [],
      }),
    });

    await gateway.evaluateSocraticPhase1('My draft text');

    const logs = orchestrator.getRequestLogs();
    expect(logs.length).toBe(1);
    expect(logs[0].action).toBe('Taller de Redacción (Fase 1: Pistas Socráticas)');
    expect(logs[0].status).toBe('SUCCESS');
    expect(logs[0].modelId).toBe('gemini-3.8-flash');
    expect(logs[0].apiKeyId).toBe('key_1');
  });
});
