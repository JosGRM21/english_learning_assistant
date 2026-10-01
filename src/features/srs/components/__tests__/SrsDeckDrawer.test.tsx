import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SrsDeckDrawer } from '../SrsDeckDrawer';
import { CardWithTarget, SrsCard } from '@/core/types/srs';
import { VocabItem } from '@/core/types/vocab';

describe('SrsDeckDrawer Component', () => {
  const createMockCardWithTarget = (id: string, word: string, state: 'NEW' | 'REVIEW'): CardWithTarget => {
    const vocab: VocabItem = {
      id: `voc_${id}`,
      word,
      translationEs: `traducción ${word}`,
      definitionEn: `definition of ${word}`,
      ipaGeneralAmerican: 'ˈtɛst',
      cefrLevel: 'B2',
      partOfSpeech: 'NOUN',
      grammaticalDimension: 'CONTENT',
      isFalseFriend: false,
      createdAt: new Date().toISOString(),
    };

    const card: SrsCard = {
      id: `card_${id}`,
      userId: 'user_local',
      targetType: 'VOCAB',
      targetId: vocab.id,
      state,
      stability: state === 'NEW' ? 0 : 2.5,
      difficulty: 5.0,
      reps: state === 'NEW' ? 0 : 1,
      lapses: 0,
      lastReviewedAt: null,
      scheduledFor: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    return { card, vocab, allContexts: [] };
  };

  const sampleDeck: CardWithTarget[] = [
    createMockCardWithTarget('1', 'resilient', 'NEW'),
    createMockCardWithTarget('2', 'thorough', 'REVIEW'),
  ];

  it('filters cards by search input', () => {
    render(
      <SrsDeckDrawer
        isOpen={true}
        onClose={vi.fn()}
        deckCards={sampleDeck}
        activeCardId="card_1"
        onSelectCard={vi.fn()}
      />
    );

    expect(screen.getByText('resilient')).toBeDefined();
    expect(screen.getByText('thorough')).toBeDefined();

    const searchInput = screen.getByPlaceholderText(/Buscar término en el mazo/i);
    fireEvent.change(searchInput, { target: { value: 'resil' } });

    expect(screen.getByText('resilient')).toBeDefined();
    expect(screen.queryByText('thorough')).toBeNull();
  });

  it('filters by state tab (Nuevas vs En Repaso)', () => {
    render(
      <SrsDeckDrawer
        isOpen={true}
        onClose={vi.fn()}
        deckCards={sampleDeck}
        activeCardId="card_1"
        onSelectCard={vi.fn()}
      />
    );

    const newTab = screen.getByText(/^Nuevas$/i);
    fireEvent.click(newTab);

    expect(screen.getByText('resilient')).toBeDefined();
    expect(screen.queryByText('thorough')).toBeNull();
  });

  it('calls onSelectCard and onClose when clicking a card item', () => {
    const handleSelect = vi.fn();
    const handleClose = vi.fn();

    render(
      <SrsDeckDrawer
        isOpen={true}
        onClose={handleClose}
        deckCards={sampleDeck}
        activeCardId="card_1"
        onSelectCard={handleSelect}
      />
    );

    const cardItem = screen.getByText('thorough');
    fireEvent.click(cardItem);

    expect(handleSelect).toHaveBeenCalledWith(sampleDeck[1]);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
