import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AiModelsView } from '../AiModelsView';
import {
  AiProvider,
  STORAGE_KEYS_KEY,
  STORAGE_QUOTA_STATES_KEY,
  STORAGE_REQUEST_LOGS_KEY,
} from '@/app/providers/AiProvider';

describe('AiModelsView / QuotaMatrixMonitor UI Component', () => {
  const sampleKey = [
    {
      id: 'key_test_1',
      label: 'Main Studio Key',
      secretKey: 'AIzaSy_MockValidSecretKey123',
      maskedKey: 'AIzaSy...y123',
      isActive: true,
      isPrimary: true,
    },
  ];

  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem(STORAGE_KEYS_KEY, JSON.stringify(sampleKey));
  });

  it('renders modern page header and model selector with humanized limits', () => {
    render(
      <AiProvider>
        <AiModelsView />
      </AiProvider>,
    );

    // Header title and description
    expect(screen.getByText('Modelos de IA')).toBeDefined();
    expect(
      screen.getByText('Selecciona tu modelo y gestiona las claves de acceso a Google Gemini.'),
    ).toBeDefined();

    // Reset countdown pill
    expect(screen.getByText('Reinicio de cuotas')).toBeDefined();

    // Model selector cards with human-readable limits
    expect(screen.getByText('Gemini 3.8 Flash')).toBeDefined();
    expect(screen.getByText('Gemini 3.5 Flash Lite')).toBeDefined();
    expect(screen.getAllByText('20 req/día · 5 req/min').length).toBe(3); // 3.8, 3.7, 3.6
    expect(screen.getByText('500 req/día · 15 req/min')).toBeDefined(); // 3.5 Flash Lite
  });

  it('renders configured API key summary with collapsible model breakdown', () => {
    render(
      <AiProvider>
        <AiModelsView />
      </AiProvider>,
    );

    expect(screen.getByText('Main Studio Key')).toBeDefined();
    expect(screen.getByText('Claves de API')).toBeDefined();

    // Initially, breakdown is collapsed
    expect(screen.queryByText('Uso por modelo')).toBeNull();

    // Click "Ver desglose por modelo" to expand
    const expandButton = screen.getByText('Ver desglose por modelo');
    fireEvent.click(expandButton);

    // Now the breakdown is visible
    expect(screen.getByText('Uso por modelo')).toBeDefined();
    expect(screen.getAllByText(/\/ 20 req/i).length).toBe(3);
    expect(screen.getByText(/\/ 500 req/i)).toBeDefined();

    // Total quota summary
    expect(screen.getByText(/0 de 560/i)).toBeDefined();
  });

  it('loads and preserves persisted quota states from previous sessions and does not render request logs', () => {
    const previousLogs = [
      {
        id: 'req_1',
        timestamp: new Date().toISOString(),
        apiKeyId: 'key_test_1',
        apiKeyLabel: 'Main Studio Key',
        modelId: 'gemini-3.8-flash',
        action: 'Taller de Redacción (Fase 1: Pistas Socráticas)',
        status: 'SUCCESS',
      },
    ];

    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Los_Angeles',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const parts = formatter.formatToParts(new Date());
    const todayPt = `${parts.find((p) => p.type === 'year')?.value}-${parts.find((p) => p.type === 'month')?.value}-${parts.find((p) => p.type === 'day')?.value}`;

    const previousQuotas = [
      {
        apiKeyId: 'key_test_1',
        modelId: 'gemini-3.8-flash',
        requestsToday: 4,
        dailyLimit: 20,
        rpmLimit: 5,
        lastRequestTimestamp: new Date().toISOString(),
        rpmCooldownUntil: null,
        rpdStatus: 'AVAILABLE',
        lastPtResetDate: todayPt,
      },
    ];

    localStorage.setItem(STORAGE_REQUEST_LOGS_KEY, JSON.stringify(previousLogs));
    localStorage.setItem(STORAGE_QUOTA_STATES_KEY, JSON.stringify(previousQuotas));

    render(
      <AiProvider>
        <AiModelsView />
      </AiProvider>,
    );

    // Request logs UI must NOT be rendered
    expect(screen.queryByText(/Registro de Peticiones a la API/i)).toBeNull();

    // Request count must be preserved (4 de 560 usadas hoy)
    expect(screen.getByText(/4 de 560/i)).toBeDefined();
  });

  it('renders onboarding empty state when no API keys are present', () => {
    localStorage.setItem(STORAGE_KEYS_KEY, JSON.stringify([]));

    render(
      <AiProvider>
        <AiModelsView />
      </AiProvider>,
    );

    expect(screen.getByText('Conecta con Google Gemini')).toBeDefined();
    expect(screen.getByText('Obtener clave gratuita')).toBeDefined();
  });
});
