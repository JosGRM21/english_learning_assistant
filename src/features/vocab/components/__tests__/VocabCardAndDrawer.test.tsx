import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { VocabCard } from '../VocabCard';
import { VocabDetailDrawer } from '../VocabDetailDrawer';
import * as audioHook from '@/shared/hooks/useAudio';
import * as dbHook from '@/shared/hooks/useDatabase';
import { VocabItem, VocabContextExample } from '@/core/types/vocab';

describe('VocabCard and VocabDetailDrawer UX Components', () => {
  const mockVocab: VocabItem = {
    id: 'voc_test_1',
    word: 'resilient',
    translationEs: 'resiliente',
    definitionEn: 'Able to withstand or recover quickly from difficult conditions.',
    ipaGeneralAmerican: 'rɪˈzɪliənt',
    ipaReceivedPronunciation: 'rɪˈzɪl.jənt',
    cefrLevel: 'B2',
    partOfSpeech: 'ADJECTIVE',
    grammaticalDimension: 'CONTENT',
    isFalseFriend: false,
    morphologicalFamilyJson: ['resilience', 'resiliently'],
    createdAt: new Date().toISOString(),
  };

  const mockFalseFriendVocab: VocabItem = {
    id: 'voc_test_2',
    word: 'actually',
    translationEs: 'en realidad, de hecho',
    definitionEn: 'As the truth or facts of a situation.',
    ipaGeneralAmerican: 'ˈæk.tʃu.ə.li',
    cefrLevel: 'B1',
    partOfSpeech: 'ADVERB',
    grammaticalDimension: 'CONTENT',
    isFalseFriend: true,
    falseFriendNote: 'No significa actualmente, sino en realidad.',
    createdAt: new Date().toISOString(),
  };

  const mockExample: VocabContextExample = {
    id: 'ctx_1',
    vocabId: 'voc_test_1',
    sentenceEn: 'She proved to be remarkably resilient in tough times.',
    sentenceEs: 'Demostró ser notablemente resiliente en tiempos difíciles.',
    clozeTarget: 'resilient',
    cefrLevel: 'B2',
    createdAt: new Date().toISOString(),
  };

  const mockAudioService = {
    speak: vi.fn().mockResolvedValue(undefined),
    playFeedback: vi.fn(),
    stop: vi.fn(),
  };

  const mockCardRepo = {
    getCardByTargetId: vi.fn().mockResolvedValue({
      id: 'card_1',
      userId: 'user_local',
      targetType: 'VOCAB',
      targetId: 'voc_test_1',
      state: 'REVIEW',
      stability: 4.5,
      difficulty: 3.2,
      reps: 3,
      lapses: 0,
      scheduledFor: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    }),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(audioHook, 'useAudio').mockReturnValue({
      audioService: mockAudioService as any,
    });
    vi.spyOn(dbHook, 'useDatabase').mockReturnValue({
      db: {} as any,
      vocabRepo: {} as any,
      cardRepo: mockCardRepo as any,
      isReady: true,
      error: null,
      retry: vi.fn(),
    });
  });

  describe('VocabCard', () => {
    it('renders the headword, CEFR level, phonetic IPA, and translation correctly', () => {
      render(<VocabCard vocab={mockVocab} examples={[mockExample]} />);

      expect(screen.getByText('resilient')).toBeDefined();
      expect(screen.getByText('/rɪˈzɪliənt/')).toBeDefined();
      expect(screen.getByText('B2')).toBeDefined();
      expect(screen.getByText('resiliente')).toBeDefined();
      expect(screen.getByText(/She proved to be remarkably resilient/i)).toBeDefined();
    });

    it('plays audio pronunciation when clicking the audio icon', async () => {
      render(<VocabCard vocab={mockVocab} />);

      const speakBtn = screen.getByTitle(/Escuchar pronunciación nativa/i);
      fireEvent.click(speakBtn);

      expect(mockAudioService.speak).toHaveBeenCalledWith('resilient', 1.0);
    });

    it('displays the false friend warning indicator on false friend words', () => {
      render(<VocabCard vocab={mockFalseFriendVocab} />);

      expect(screen.getByText('actually')).toBeDefined();
      expect(screen.getByText('Falso Amigo')).toBeDefined();
      expect(screen.queryByText(/No significa actualmente/i)).toBeNull();
    });

    it('triggers onSelectWord callback when clicking the card', () => {
      const onSelectMock = vi.fn();
      render(<VocabCard vocab={mockVocab} onSelectWord={onSelectMock} />);

      fireEvent.click(screen.getByText('resilient'));
      expect(onSelectMock).toHaveBeenCalledWith(mockVocab);
    });
  });

  describe('VocabDetailDrawer', () => {
    it('renders full lexical details including morphological family and context sentences', async () => {
      render(
        <VocabDetailDrawer
          vocab={mockVocab}
          isOpen={true}
          onClose={vi.fn()}
          examples={[mockExample]}
        />
      );

      expect(screen.getByText('Inspector Léxico')).toBeDefined();
      expect(screen.getByText('resilience')).toBeDefined();
      expect(screen.getByText('resiliently')).toBeDefined();

      await waitFor(() => {
        expect(screen.getByText('Estado de Retención FSRS')).toBeDefined();
        expect(screen.getByText('4.5d')).toBeDefined();
      });
    });

    it('plays slow 0.75x audio when clicking the slow audio button', async () => {
      render(
        <VocabDetailDrawer
          vocab={mockVocab}
          isOpen={true}
          onClose={vi.fn()}
        />
      );

      const slowBtn = screen.getByTitle(/Escuchar a velocidad lenta \(0.75x\)/i);
      fireEvent.click(slowBtn);

      expect(mockAudioService.speak).toHaveBeenCalledWith('resilient', 0.75);
    });

    it('calls onDeleteWord after confirming deletion prompt', async () => {
      const onDeleteMock = vi.fn().mockResolvedValue(true);
      const onCloseMock = vi.fn();

      render(
        <VocabDetailDrawer
          vocab={mockVocab}
          isOpen={true}
          onClose={onCloseMock}
          onDeleteWord={onDeleteMock}
        />
      );

      // Click delete button
      fireEvent.click(screen.getByText(/Eliminar término/i));

      // Confirm prompt appears
      expect(screen.getByText(/¿Eliminar resilient\?/i)).toBeDefined();

      // Click confirm
      fireEvent.click(screen.getByText(/Sí, eliminar/i));

      await waitFor(() => {
        expect(onDeleteMock).toHaveBeenCalledWith('voc_test_1');
        expect(onCloseMock).toHaveBeenCalled();
      });
    });
  });
});
