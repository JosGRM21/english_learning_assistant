import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { VerbTensesCard } from '../VerbTensesCard';
import * as audioHook from '@/shared/hooks/useAudio';
import { VerbTenses } from '@/core/types/vocab';

describe('VerbTensesCard Component', () => {
  const mockAudioService = {
    speak: vi.fn().mockResolvedValue(undefined),
    playFeedback: vi.fn(),
    stop: vi.fn(),
  };

  vi.spyOn(audioHook, 'useAudio').mockReturnValue({
    audioService: mockAudioService as any,
  });

  const irregularTenses: VerbTenses = {
    infinitive: 'run',
    thirdPersonPresent: 'runs',
    pastSimple: 'ran',
    pastParticiple: 'run',
    gerund: 'running',
    isIrregular: true,
  };

  const regularTenses: VerbTenses = {
    infinitive: 'work',
    thirdPersonPresent: 'works',
    pastSimple: 'worked',
    pastParticiple: 'worked',
    gerund: 'working',
    isIrregular: false,
    edPhoneticEnding: '/t/',
  };

  it('renders irregular verb tenses with Irregular badge', () => {
    render(<VerbTensesCard tenses={irregularTenses} />);

    expect(screen.getAllByText('run').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('runs')).toBeDefined();
    expect(screen.getByText('ran')).toBeDefined();
    expect(screen.getByText('running')).toBeDefined();
    expect(screen.getByText(/Irregular/i)).toBeDefined();
  });

  it('renders regular verb with -ed pronunciation rule badge', () => {
    render(<VerbTensesCard tenses={regularTenses} />);

    expect(screen.getByText('work')).toBeDefined();
    expect(screen.getAllByText('worked').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Regular/i)).toBeDefined();
    expect(screen.getByText(/-ed: \/t\//i)).toBeDefined();
  });

  it('plays audio when audio icon is clicked for a tense', async () => {
    render(<VerbTensesCard tenses={irregularTenses} />);

    const speakButtons = screen.getAllByRole('button');
    expect(speakButtons.length).toBeGreaterThan(0);

    fireEvent.click(speakButtons[0]);
    expect(mockAudioService.speak).toHaveBeenCalledWith('run', 0.95);
  });

  it('renders in compact mode for card preview and SRS', () => {
    render(<VerbTensesCard tenses={irregularTenses} compact />);

    expect(screen.getByText('Tiempos Verbales')).toBeDefined();
    expect(screen.getByText('ran')).toBeDefined();
  });
});
