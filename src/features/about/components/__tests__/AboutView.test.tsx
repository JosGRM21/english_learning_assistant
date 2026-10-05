import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AboutView } from '../AboutView';

const mockCheckForUpdates = vi.fn();
const mockDownloadAndInstallUpdate = vi.fn();
const mockDismissModal = vi.fn();

vi.mock('@/shared/hooks/useUpdater', () => ({
  useUpdater: () => ({
    status: 'idle',
    updateInfo: null,
    errorMessage: null,
    downloadProgress: 0,
    checkForUpdates: mockCheckForUpdates,
    downloadAndInstallUpdate: mockDownloadAndInstallUpdate,
    dismissModal: mockDismissModal,
  }),
}));

describe('AboutView Component', () => {
  it('renders application details and version badge', () => {
    render(<AboutView />);

    expect(screen.getByText('English Learning Assistant')).toBeDefined();
    expect(screen.getAllByText('v1.0.3').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Actualizaciones del Programa')).toBeDefined();
    expect(screen.getByText('Buscar actualizaciones')).toBeDefined();
    expect(screen.getByText('Ficha Técnica & Arquitectura')).toBeDefined();
    expect(screen.getByText('Josnaiker Rivas')).toBeDefined();
  });

  it('triggers update check when clicking the search button', () => {
    mockCheckForUpdates.mockClear();
    render(<AboutView />);

    const updateBtn = screen.getByText('Buscar actualizaciones');
    fireEvent.click(updateBtn);

    expect(mockCheckForUpdates).toHaveBeenCalledWith(true);
  });
});
