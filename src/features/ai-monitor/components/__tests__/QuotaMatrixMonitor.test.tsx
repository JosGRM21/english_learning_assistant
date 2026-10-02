import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QuotaMatrixMonitor } from '../QuotaMatrixMonitor';
import { AiProvider, STORAGE_KEYS_KEY, STORAGE_QUOTA_STATES_KEY, STORAGE_REQUEST_LOGS_KEY } from '@/app/providers/AiProvider';

describe('QuotaMatrixMonitor UX Component', () => {
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

  it('renders model limits in selector and header correctly', () => {
    render(
      <AiProvider>
        <QuotaMatrixMonitor />
      </AiProvider>
    );

    // Header info with limits
    expect(screen.getByText(/500 RPD \/ 15 RPM/i)).toBeDefined();
    expect(screen.getByText(/20 RPD \/ 5 RPM/i)).toBeDefined();
    expect(screen.getByText(/560 peticiones\/día/i)).toBeDefined();

    // Model cards with limits
    expect(screen.getByText('Gemini 3.8 Flash')).toBeDefined();
    expect(screen.getByText('Gemini 3.5 Flash Lite')).toBeDefined();
    expect(screen.getAllByText('5 RPM • 20 RPD').length).toBe(3); // 3.8, 3.7, 3.6
    expect(screen.getByText('15 RPM • 500 RPD')).toBeDefined(); // 3.5 Flash Lite
  });

  it('renders per-model breakdown and total daily quota for configured API keys', () => {
    render(
      <AiProvider>
        <QuotaMatrixMonitor />
      </AiProvider>
    );

    expect(screen.getByText('Main Studio Key')).toBeDefined();
    expect(screen.getByText('Desglose y Límites por Modelo')).toBeDefined();

    // Check that breakdown displays limits for 3.8, 3.7, 3.6 and 3.5 Flash Lite
    expect(screen.getAllByText(/\/ 20 RPD/i).length).toBe(3);
    expect(screen.getByText(/\/ 500 RPD/i)).toBeDefined();
    expect(screen.getByText(/0 \/ 560/i)).toBeDefined();
  });

  it('loads and renders persisted request logs from previous sessions on startup', () => {
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
        lastPtResetDate: '2026-10-01',
      },
    ];

    localStorage.setItem(STORAGE_REQUEST_LOGS_KEY, JSON.stringify(previousLogs));
    localStorage.setItem(STORAGE_QUOTA_STATES_KEY, JSON.stringify(previousQuotas));

    render(
      <AiProvider>
        <QuotaMatrixMonitor />
      </AiProvider>
    );

    // Request logs must be visible and loaded on startup
    expect(screen.getByText('Taller de Redacción (Fase 1: Pistas Socráticas)')).toBeDefined();
    expect(screen.getByText('200 OK')).toBeDefined();

    // Request count must be preserved (4 / 560 peticiones)
    expect(screen.getByText(/4 \/ 560/i)).toBeDefined();
  });
});
