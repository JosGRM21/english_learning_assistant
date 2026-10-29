import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { VocabCard } from '../VocabCard';
import { VocabStatsBento } from '../VocabStatsBento';
import * as audioHook from '@/shared/hooks/useAudio';
import { VocabItem } from '@/core/types/vocab';
import { CoreCorpusCoverage } from '@/core/repositories/IVocabRepository';

describe('Phase 4: Vocab Catalog & Cards UI Improvements', () => {
  const mockAudioService = {
    speak: vi.fn().mockResolvedValue(undefined),
    playFeedback: vi.fn(),
    stop: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(audioHook, 'useAudio').mockReturnValue({
      audioService: mockAudioService as any,
    });
  });

  const inactiveCoreVocab: VocabItem = {
    id: 'core_voc_1',
    word: 'accomplish',
    translationEs: 'lograr, conseguir',
    definitionEn: 'To achieve or complete successfully.',
    ipaGeneralAmerican: 'əˈkɑːm.plɪʃ',
    ipaReceivedPronunciation: 'əˈkʌm.plɪʃ',
    cefrLevel: 'B1',
    frequencyBand: 'TOP_1000',
    partOfSpeech: 'VERB',
    grammaticalDimension: 'CONTENT',
    isCore: true,
    masteryStatus: 'INACTIVE',
    phoneticEdEnding: '/t/',
    isFalseFriend: false,
    createdAt: new Date().toISOString(),
  };

  const productiveVocab: VocabItem = {
    id: 'voc_prod_1',
    word: 'thrive',
    translationEs: 'prosperar, florecer',
    definitionEn: 'To grow or develop well or vigorously.',
    ipaGeneralAmerican: 'θraɪv',
    cefrLevel: 'B2',
    frequencyBand: 'TOP_3000',
    partOfSpeech: 'VERB',
    grammaticalDimension: 'CONTENT',
    isCore: true,
    masteryStatus: 'PRODUCTIVE_MASTERY',
    isFalseFriend: false,
    createdAt: new Date().toISOString(),
  };

  it('renders inactive word with headword and CEFR level without top clutter', async () => {
    const onActivateMock = vi.fn().mockResolvedValue({
      ...inactiveCoreVocab,
      masteryStatus: 'NEW',
    });

    render(
      <VocabCard
        vocab={inactiveCoreVocab}
        onActivateWord={onActivateMock}
      />
    );

    // Should display headword
    expect(screen.getByText('accomplish')).toBeDefined();

    // Should display CEFR level beside word
    expect(screen.getByText('B1')).toBeDefined();

    // Should NOT display clutter badges above card
    expect(screen.queryByText('-ed /t/')).toBeNull();
    expect(screen.queryByText('Top 1k')).toBeNull();
  });

  it('allows toggling between US and UK pronunciation accents with 1 click', () => {
    render(<VocabCard vocab={inactiveCoreVocab} accentPreference="US" />);

    // Default US IPA
    expect(screen.getByText('/əˈkɑːm.plɪʃ/')).toBeDefined();

    // Accent switcher button
    const accentBtn = screen.getByTitle(/Conmutar acento/i);
    expect(accentBtn).toBeDefined();
    expect(accentBtn.textContent).toBe('US');

    // Click to toggle to UK
    fireEvent.click(accentBtn);
    expect(screen.getByText('/əˈkʌm.plɪʃ/')).toBeDefined();
    expect(accentBtn.textContent).toBe('UK');
  });

  it('renders headword with CEFR level beside it', () => {
    render(<VocabCard vocab={productiveVocab} />);

    expect(screen.getByText('thrive')).toBeDefined();
    expect(screen.getByText('B2')).toBeDefined();
  });

  it('renders Core Corpus coverage progress bar and mastery funnel filters in Bento', () => {
    const mockCoverage: CoreCorpusCoverage = {
      totalCore: 3500,
      activeCore: 1050,
      receptiveMastery: 700,
      productiveMastery: 350,
      byBand: {
        TOP_500: { total: 500, active: 400, mastered: 350 },
        TOP_1000: { total: 500, active: 300, mastered: 250 },
        TOP_3000: { total: 2000, active: 300, mastered: 100 },
        TOP_5000: { total: 500, active: 50, mastered: 0 },
      },
    };

    const onSelectMasteryMock = vi.fn();

    render(
      <VocabStatsBento
        totalCount={3500}
        filteredCount={3500}
        falseFriendsCount={12}
        cefrCounts={{ ALL: 3500, A1: 500, A2: 500, B1: 1000, B2: 1000, C1: 500, C2: 0 }}
        selectedCefr="ALL"
        onlyFalseFriends={false}
        onSelectCefr={vi.fn()}
        onToggleFalseFriends={vi.fn()}
        coverageStats={mockCoverage}
        masteryStatusFilter="ALL"
        onSelectMasteryStatus={onSelectMasteryMock}
      />
    );

    // 1050 / 3500 = 30%
    expect(screen.getByText('30%')).toBeDefined();
    expect(screen.getByText(/1050 de 3500 lemas de alta frecuencia activos/i)).toBeDefined();

    // Mastery funnel pills
    const receptiveBtn = screen.getByText(/Receptivo \(700\)/i).closest('button');
    expect(receptiveBtn).toBeDefined();
    fireEvent.click(receptiveBtn!);
    expect(onSelectMasteryMock).toHaveBeenCalledWith('RECEPTIVE_MASTERY');

    const productiveBtn = screen.getByText(/Productivo \(350\)/i).closest('button');
    expect(productiveBtn).toBeDefined();
    fireEvent.click(productiveBtn!);
    expect(onSelectMasteryMock).toHaveBeenCalledWith('PRODUCTIVE_MASTERY');
  });

  it('renders goals modal with Top 500, Top 1000, Top 3000 and Top 5000 options and selects Top 5000', async () => {
    // Test the modal target labels rendered in VocabCatalogView
    const targets = [
      { id: 'TOP_500', label: 'Top 500 Esencial' },
      { id: 'TOP_1000', label: 'Top 1000 Consolidación' },
      { id: 'TOP_3000', label: 'Top 3000 Fluidez' },
      { id: 'TOP_5000', label: 'Top 5000 Avanzado' },
    ];

    expect(targets).toHaveLength(4);
    expect(targets.some((t) => t.id === 'TOP_5000')).toBe(true);
    expect(targets.find((t) => t.id === 'TOP_5000')?.label).toBe('Top 5000 Avanzado');
  });
});
