import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import { WeakVocabTargetTracker } from '../components/WeakVocabTargetTracker';
import { TargetWordItem } from '../store/writingStore';

describe('WeakVocabTargetTracker Component', () => {
  const mockWords: TargetWordItem[] = [
    {
      word: 'reluctant',
      translationEs: 'reacio / renuente',
      partOfSpeech: 'ADJECTIVE',
      isUsed: false,
    },
    {
      word: 'overwhelmed',
      translationEs: 'abrumado',
      partOfSpeech: 'ADJECTIVE',
      isUsed: true,
    },
    {
      word: 'thrive',
      translationEs: 'prosperar',
      partOfSpeech: 'VERB',
      isUsed: false,
    },
  ];

  it('returns null if targetWords is empty', () => {
    const { container } = render(
      <WeakVocabTargetTracker
        targetWords={[]}
        onInsertWord={vi.fn()}
        onReplaceWord={vi.fn()}
      />,
    );

    expect(container.firstChild).toBeNull();
  });

  it('renders target word chips and counter showing used status', () => {
    render(
      <WeakVocabTargetTracker
        targetWords={mockWords}
        onInsertWord={vi.fn()}
        onReplaceWord={vi.fn()}
      />,
    );

    expect(screen.getByText(/Palabras Objetivo \(SRS\)/i)).toBeDefined();
    expect(screen.getByText('1 / 3')).toBeDefined();
    expect(screen.getByText('reluctant')).toBeDefined();
    expect(screen.getByText('overwhelmed')).toBeDefined();
    expect(screen.getByText('thrive')).toBeDefined();
  });

  it('triggers onInsertWord when a word chip is clicked', () => {
    const handleInsert = vi.fn();
    render(
      <WeakVocabTargetTracker
        targetWords={mockWords}
        onInsertWord={handleInsert}
        onReplaceWord={vi.fn()}
      />,
    );

    const reluctantChip = screen.getByRole('button', { name: /reluctant/i });
    fireEvent.click(reluctantChip);

    expect(handleInsert).toHaveBeenCalledWith('reluctant');
  });

  it('displays ¡Todas usadas! badge when all target words are checked', () => {
    const allUsedWords: TargetWordItem[] = mockWords.map((w) => ({ ...w, isUsed: true }));
    render(
      <WeakVocabTargetTracker
        targetWords={allUsedWords}
        onInsertWord={vi.fn()}
        onReplaceWord={vi.fn()}
      />,
    );

    expect(screen.getByText('¡Todas usadas!')).toBeDefined();
    expect(screen.getByText('3 / 3')).toBeDefined();
  });

  it('shows swap button on hover for unused words and calls onReplaceWord', () => {
    const handleReplace = vi.fn();
    render(
      <WeakVocabTargetTracker
        targetWords={mockWords}
        onInsertWord={vi.fn()}
        onReplaceWord={handleReplace}
      />,
    );

    const chipWrapper = screen.getByText('reluctant').closest('div[class*="group"]')!;
    fireEvent.mouseEnter(chipWrapper);

    const swapBtn = screen.getByTitle(/Cambiar por otra palabra débil/i);
    fireEvent.click(swapBtn);

    expect(handleReplace).toHaveBeenCalledWith(0);
  });
});
