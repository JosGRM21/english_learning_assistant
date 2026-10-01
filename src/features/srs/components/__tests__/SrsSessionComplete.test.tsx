import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SrsSessionComplete } from '../SrsSessionComplete';
import { SrsSessionStats } from '@/core/srs/SrsSessionEngine';

describe('SrsSessionComplete Component', () => {
  const mockStats: SrsSessionStats = {
    totalReviewed: 10,
    successfulRecalls: 9,
    lapses: 1,
    averageLatencyMs: 1400,
    startedAt: new Date().toISOString(),
    finishedAt: new Date().toISOString(),
  };

  it('renders completed session metrics accurately', () => {
    render(
      <SrsSessionComplete
        stats={mockStats}
        streakDays={5}
        totalDeckCount={25}
      />
    );

    expect(screen.getByText('¡Sesión de Repaso Completada!')).toBeDefined();
    expect(screen.getByText('10')).toBeDefined(); // total reviews
    expect(screen.getByText('90%')).toBeDefined(); // accuracy (9 / 10)
    expect(screen.getByText('1.4s')).toBeDefined(); // avg speed
    expect(screen.getByText('5d')).toBeDefined(); // streak
  });

  it('calls onRestartSession when clicking repeat button', () => {
    const handleRestart = vi.fn();
    render(
      <SrsSessionComplete
        stats={mockStats}
        streakDays={5}
        totalDeckCount={25}
        onRestartSession={handleRestart}
      />
    );

    const restartBtn = screen.getByText(/Repetir Mazo/i);
    fireEvent.click(restartBtn);

    expect(handleRestart).toHaveBeenCalledTimes(1);
  });

  it('renders clean inbox state when 0 reviews were needed', () => {
    const zeroStats: SrsSessionStats = {
      totalReviewed: 0,
      successfulRecalls: 0,
      lapses: 0,
      averageLatencyMs: 0,
      startedAt: new Date().toISOString(),
      finishedAt: null,
    };

    render(
      <SrsSessionComplete
        stats={zeroStats}
        streakDays={3}
        totalDeckCount={15}
      />
    );

    expect(screen.getByText('¡Tu Mazo está al Día!')).toBeDefined();
    expect(screen.getByText('100%')).toBeDefined();
  });
});
