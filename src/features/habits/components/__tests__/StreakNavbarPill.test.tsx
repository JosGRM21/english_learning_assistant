import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import dayjs from 'dayjs';
import { StreakNavbarPill } from '../StreakNavbarPill';
import { useHabitsStore } from '../../store/habitsStore';

describe('StreakNavbarPill Component', () => {
  beforeEach(() => {
    useHabitsStore.setState({
      streak: {
        id: 'streak_local',
        userId: 'user_local',
        currentStreak: 0,
        longestStreak: 0,
        lastActivityDate: null,
        availableFreezes: 1,
        updatedAt: new Date().toISOString(),
      },
    });
  });

  it('renders 0 days when user has no streak', () => {
    render(<StreakNavbarPill />);

    expect(screen.getByTestId('streak-navbar-pill')).toBeDefined();
    expect(screen.getByText('0')).toBeDefined();
    expect(screen.getByText('días')).toBeDefined();
  });

  it('renders active streak when completed today', () => {
    const todayStr = dayjs().format('YYYY-MM-DD');
    useHabitsStore.setState({
      streak: {
        id: 'streak_local',
        userId: 'user_local',
        currentStreak: 3,
        longestStreak: 5,
        lastActivityDate: todayStr,
        availableFreezes: 1,
        updatedAt: new Date().toISOString(),
      },
    });

    render(<StreakNavbarPill />);

    expect(screen.getByText('3')).toBeDefined();
    const pill = screen.getByTestId('streak-navbar-pill');
    expect(pill.getAttribute('title')).toContain('¡Racha de hoy completada!');
  });

  it('renders pending streak when active yesterday but not yet today', () => {
    const yesterdayStr = dayjs().subtract(1, 'day').format('YYYY-MM-DD');
    useHabitsStore.setState({
      streak: {
        id: 'streak_local',
        userId: 'user_local',
        currentStreak: 4,
        longestStreak: 4,
        lastActivityDate: yesterdayStr,
        availableFreezes: 1,
        updatedAt: new Date().toISOString(),
      },
    });

    render(<StreakNavbarPill />);

    expect(screen.getByText('4')).toBeDefined();
    const pill = screen.getByTestId('streak-navbar-pill');
    expect(pill.getAttribute('title')).toContain('Racha en progreso');
  });

  it('renders 0 days if inactive for >1 day with no freeze available', () => {
    const threeDaysAgo = dayjs().subtract(3, 'day').format('YYYY-MM-DD');
    useHabitsStore.setState({
      streak: {
        id: 'streak_local',
        userId: 'user_local',
        currentStreak: 7,
        longestStreak: 7,
        lastActivityDate: threeDaysAgo,
        availableFreezes: 0,
        updatedAt: new Date().toISOString(),
      },
    });

    render(<StreakNavbarPill />);

    expect(screen.getByText('0')).toBeDefined();
  });
});
