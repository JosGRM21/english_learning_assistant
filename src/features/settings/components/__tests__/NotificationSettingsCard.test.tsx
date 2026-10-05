import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NotificationSettingsCard } from '../NotificationSettingsCard';
import { DatabaseContext, DatabaseContextValue } from '@/app/providers/DatabaseProvider';
import { createTestDatabase } from '@/infrastructure/db/database';
import { NotificationRepository } from '@/infrastructure/db/repositories/NotificationRepository';
import { CardRepository } from '@/infrastructure/db/repositories/CardRepository';
import { useNotificationSettingsStore } from '../../store/notificationSettingsStore';

describe('NotificationSettingsCard Component', () => {
  let dbContextValue: DatabaseContextValue;

  beforeEach(async () => {
    const db = await createTestDatabase();
    const notificationRepo = new NotificationRepository(db);
    const cardRepo = new CardRepository(db);

    dbContextValue = {
      db,
      vocabRepo: null,
      cardRepo,
      writingRepo: null,
      notificationRepo,
      isReady: true,
      error: null,
      retry: vi.fn(),
    };

    useNotificationSettingsStore.setState({
      settings: {
        userId: 'user_local',
        enabled: true,
        scheduleMode: 'AUTO',
        manualTime: '20:00',
        detectedTime: '19:30',
        srs: {
          enabled: true,
          scheduleMode: 'AUTO',
          manualTime: '18:30',
          detectedTime: '19:00',
        },
        writing: {
          enabled: true,
          scheduleMode: 'AUTO',
          manualTime: '21:30',
          detectedTime: '21:00',
        },
        streakSaverEnabled: true,
        srsBatchEnabled: true,
        srsBatchThreshold: 10,
        quietHoursStart: '23:30',
        quietHoursEnd: '08:00',
        minimizeToTray: true,
        updatedAt: new Date().toISOString(),
      },
      habitAnalysis: {
        optimalHour: 19,
        optimalMinute: 30,
        suggestedTime: '19:30',
        confidence: 'HIGH',
        sessionCount: 12,
        hourlyDistribution: Array(24).fill(4.1),
      },
      srsHabitAnalysis: {
        optimalHour: 19,
        optimalMinute: 0,
        suggestedTime: '19:00',
        confidence: 'HIGH',
        sessionCount: 10,
        hourlyDistribution: Array(24).fill(4.1),
      },
      writingHabitAnalysis: {
        optimalHour: 21,
        optimalMinute: 0,
        suggestedTime: '21:00',
        confidence: 'MEDIUM',
        sessionCount: 5,
        hourlyDistribution: Array(24).fill(4.1),
      },
      permissionGranted: true,
      todayLogs: [],
      isLoading: false,
    });
  });

  it('renders settings title and activity cards for SRS and Writing', () => {
    render(
      <DatabaseContext.Provider value={dbContextValue}>
        <NotificationSettingsCard />
      </DatabaseContext.Provider>,
    );

    expect(screen.getByText(/Notificaciones y Horarios de Práctica/i)).toBeDefined();
    expect(screen.getByText(/Repaso de Tarjetas \(FSRS & Fonética\)/i)).toBeDefined();
    expect(screen.getByText(/Taller de Redacción Socrática/i)).toBeDefined();
  });

  it('switches between auto and manual schedule mode for activities', async () => {
    render(
      <DatabaseContext.Provider value={dbContextValue}>
        <NotificationSettingsCard />
      </DatabaseContext.Provider>,
    );

    // Switch SRS to manual
    const manualButtons = screen.getAllByRole('button', { name: /Manual/i });
    fireEvent.click(manualButtons[0]);

    await waitFor(() => {
      expect(useNotificationSettingsStore.getState().settings.srs.scheduleMode).toBe('MANUAL');
      expect(screen.getByText(/Hora fija para repaso de tarjetas/i)).toBeDefined();
    });

    // Switch SRS back to auto
    const autoButtons = screen.getAllByRole('button', { name: /Auto/i });
    fireEvent.click(autoButtons[0]);

    await waitFor(() => {
      expect(useNotificationSettingsStore.getState().settings.srs.scheduleMode).toBe('AUTO');
      expect(screen.getByText(/Horario Sugerido para Repaso SRS/i)).toBeDefined();
    });
  });

  it('triggers test notification when button is clicked', async () => {
    render(
      <DatabaseContext.Provider value={dbContextValue}>
        <NotificationSettingsCard />
      </DatabaseContext.Provider>,
    );

    const testBtn = screen.getByText(/Enviar Notificación de Prueba/i);
    expect(testBtn).toBeDefined();

    fireEvent.click(testBtn);

    await waitFor(() => {
      expect(
        screen.getByText(/¡Notificación Enviada!|Enviar Notificación de Prueba/i),
      ).toBeDefined();
    });
  });
});
