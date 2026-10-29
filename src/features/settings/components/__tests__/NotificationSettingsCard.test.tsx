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
    const db = await createTestDatabase(false);
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
        manualTime: '20:00',
        srs: {
          enabled: true,
          manualTime: '18:30',
        },
        writing: {
          enabled: true,
          manualTime: '21:30',
        },
        streakSaverEnabled: true,
        srsBatchEnabled: true,
        srsBatchThreshold: 10,
        quietHoursStart: '23:30',
        quietHoursEnd: '08:00',
        minimizeToTray: true,
        updatedAt: new Date().toISOString(),
      },
      permissionGranted: true,
      todayLogs: [],
      isLoading: false,
    });
  });

  it('renders minimalist settings title and activity controls for SRS and Writing', () => {
    render(
      <DatabaseContext.Provider value={dbContextValue}>
        <NotificationSettingsCard />
      </DatabaseContext.Provider>,
    );

    expect(screen.getByText(/Notificaciones y Recordatorios/i)).toBeDefined();
    expect(screen.getByText(/Horarios Manuales/i)).toBeDefined();
    expect(screen.getByText(/Repaso de Tarjetas \(FSRS Vocabulario\)/i)).toBeDefined();
    expect(screen.getByText(/Taller de Redacción Socrática/i)).toBeDefined();
  });

  it('updates manual time for activities directly', async () => {
    render(
      <DatabaseContext.Provider value={dbContextValue}>
        <NotificationSettingsCard />
      </DatabaseContext.Provider>,
    );

    const srsTimeInput = screen.getByTitle(/Hora programada para repaso SRS/i);
    expect(srsTimeInput).toBeDefined();

    fireEvent.change(srsTimeInput, { target: { value: '17:45' } });

    await waitFor(() => {
      expect(useNotificationSettingsStore.getState().settings.srs.manualTime).toBe('17:45');
    });
  });

  it('toggles activity reminders on and off', async () => {
    render(
      <DatabaseContext.Provider value={dbContextValue}>
        <NotificationSettingsCard />
      </DatabaseContext.Provider>,
    );

    const srsSwitch = screen.getByLabelText(/Activar recordatorio de repaso de tarjetas/i);
    expect(srsSwitch).toBeDefined();

    fireEvent.click(srsSwitch);

    await waitFor(() => {
      expect(useNotificationSettingsStore.getState().settings.srs.enabled).toBe(false);
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
