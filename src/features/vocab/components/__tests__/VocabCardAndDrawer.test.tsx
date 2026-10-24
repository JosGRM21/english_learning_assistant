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
    isCore: true,
    masteryStatus: 'LEARNING',
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
    isCore: true,
    masteryStatus: 'LEARNING',
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

    it('does not display clutter badges like false friend on card header, keeping only CEFR level', () => {
      render(<VocabCard vocab={mockFalseFriendVocab} />);

      expect(screen.getByText('actually')).toBeDefined();
      expect(screen.getByText('B1')).toBeDefined();
      expect(screen.queryByText('Falso Amigo')).toBeNull();
      expect(screen.queryByText(/No significa actualmente/i)).toBeNull();
    });

    it('triggers onSelectWord callback when clicking the card', () => {
      const onSelectMock = vi.fn();
      render(<VocabCard vocab={mockVocab} onSelectWord={onSelectMock} />);

      fireEvent.click(screen.getByText('resilient'));
      expect(onSelectMock).toHaveBeenCalledWith(mockVocab);
    });

    it('renders clean header with dedicated word row and does not render bottom acepciones or familia chips', () => {
      const mockVerbVocab: VocabItem = {
        ...mockVocab,
        id: 'voc_verb_1',
        word: 'run',
        partOfSpeech: 'VERB',
        verbTensesJson: {
          infinitive: 'run',
          pastSimple: 'ran',
          pastParticiple: 'run',
          thirdPersonPresent: 'runs',
          gerund: 'running',
          isIrregular: true,
        },
        alternateSensesJson: [
          {
            id: 'sns_1',
            translationEs: 'administrar un negocio',
            definitionEn: 'To manage or operate a business',
            partOfSpeech: 'VERB',
            domainCategory: 'Negocios',
            exampleSentenceEn: 'She runs a company.',
            exampleSentenceEs: 'Ella dirige una empresa.',
            cefrLevel: 'B2',
          },
        ],
      };

      render(<VocabCard vocab={mockVerbVocab} />);

      // Word and CEFR level beside it must be present; no top meta clutter badges
      expect(screen.getByText('run')).toBeDefined();
      expect(screen.getByText('B2')).toBeDefined();
      expect(screen.queryByText('Verbo Irreg.')).toBeNull();

      // Bottom clutter chips must NOT be rendered
      expect(screen.queryByText(/\+1 acepciones/i)).toBeNull();
      expect(screen.queryByText(/Familia léxica/i)).toBeNull();

      // Heavy 5-column verb dock must NOT be in the card body
      expect(screen.queryByText(/3ª Persona Sing\./i)).toBeNull();
      expect(screen.queryByText(/Past Participle/i)).toBeNull();
    });

    it('plays context example audio when clicking the example audio button', async () => {
      render(<VocabCard vocab={mockVocab} examples={[mockExample]} />);

      const speakExBtn = screen.getByTitle(/Escuchar oración/i);
      fireEvent.click(speakExBtn);

      expect(mockAudioService.speak).toHaveBeenCalledWith(mockExample.sentenceEn, 0.95);
    });

    it('renders phrasal verbs with phonetic IPA, distinct English definition, and contextual sentence translation', () => {
      const phrasalVocab: VocabItem = {
        id: 'phr_1',
        word: 'write down',
        translationEs: 'apuntar, anotar',
        definitionEn: 'To record information on paper or on a digital device.',
        ipaGeneralAmerican: 'ˌraɪt ˈdaʊn',
        cefrLevel: 'A2',
        partOfSpeech: 'VERB',
        subcategory: 'PHRASAL_VERB',
        grammaticalDimension: 'CHUNK',
        isFalseFriend: false,
        isCore: true,
        masteryStatus: 'LEARNING',
        domainCategory: 'Uso General',
        createdAt: new Date().toISOString(),
      };

      const phrasalExample: VocabContextExample = {
        id: 'ctx_phr_1',
        vocabId: 'phr_1',
        sentenceEn: 'Please write down this phone number.',
        sentenceEs: 'Por favor, apunta este número de teléfono.',
        clozeTarget: 'write down',
        cefrLevel: 'A2',
        createdAt: new Date().toISOString(),
      };

      render(<VocabCard vocab={phrasalVocab} examples={[phrasalExample]} />);

      expect(screen.getByText('write down')).toBeDefined();
      expect(screen.getByText('/ˌraɪt ˈdaʊn/')).toBeDefined();
      expect(screen.getByText('apuntar, anotar')).toBeDefined();
      expect(screen.getByText('To record information on paper or on a digital device.')).toBeDefined();
      expect(screen.getByText(/Please write down this phone number/i)).toBeDefined();
      expect(screen.getByText(/Por favor, apunta este número de teléfono/i)).toBeDefined();
    });
  });

  describe('VocabDetailDrawer', () => {
    it('renders full lexical details including horizontal categories and context sentences without bundling other senses', async () => {
      const vocabWithSenses: VocabItem = {
        ...mockVocab,
        domainCategory: 'Psicología',
        alternateSensesJson: [
          {
            id: 'sns_alt_1',
            translationEs: 'capacidad de recuperación',
            definitionEn: 'The capacity to recover quickly.',
            partOfSpeech: 'NOUN',
            domainCategory: 'Psicología',
            exampleSentenceEn: 'Psychological resilience is key.',
            exampleSentenceEs: 'La resiliencia psicológica es clave.',
            cefrLevel: 'C1',
          },
        ],
      };

      render(
        <VocabDetailDrawer
          vocab={vocabWithSenses}
          isOpen={true}
          onClose={vi.fn()}
          examples={[mockExample]}
        />
      );

      // In the new polysemic redesign, all senses are rendered as dictionary entries
      expect(screen.getByText(/capacidad de recuperación/i)).toBeDefined();

      // Switch to Retención FSRS tab to view FSRS metrics
      fireEvent.click(screen.getByText(/Retención FSRS/i));

      await waitFor(() => {
        expect(screen.getByText(/Estado del Algoritmo FSRS 5.0/i)).toBeDefined();
        expect(screen.getByText('4.5d')).toBeDefined();
      });
    });

    it('allows navigating to or creating independent cards for senses from the drawer, and does not render phrasal verbs inside the drawer', () => {
      const onSelectWordMock = vi.fn();
      const onCreateCardFromSenseMock = vi.fn().mockResolvedValue(null);

      const existingSenseCard: VocabItem = {
        ...mockVocab,
        id: 'voc_sense_card',
        word: 'resilient',
        translationEs: 'capacidad de recuperación',
        domainCategory: 'Psicología',
      };

      const vocabWithSensesAndPv: VocabItem = {
        ...mockVocab,
        alternateSensesJson: [
          {
            id: 'alt_1',
            translationEs: 'capacidad de recuperación',
            definitionEn: 'Mental elasticity.',
            partOfSpeech: 'NOUN',
            domainCategory: 'Psicología',
            cefrLevel: 'C1',
          },
          {
            id: 'alt_2',
            translationEs: 'elástico / flexible',
            definitionEn: 'Physical flexibility.',
            partOfSpeech: 'ADJECTIVE',
            domainCategory: 'Física',
            cefrLevel: 'B2',
          },
        ],
        phrasalVerbsJson: [
          {
            text: 'bounce back',
            meaningEs: 'recuperarse rápidamente',
            type: 'TYPE_1_INTRANSITIVE',
            cefrLevel: 'B2',
            example1: 'He bounced back from defeat.',
          },
        ],
      };

      render(
        <VocabDetailDrawer
          vocab={vocabWithSensesAndPv}
          isOpen={true}
          onClose={vi.fn()}
          allWords={[mockVocab, existingSenseCard]}
          onSelectWord={onSelectWordMock}
          onCreateCardFromSense={onCreateCardFromSenseMock}
        />
      );

      // Phrasal verbs must NOT appear inside the drawer
      expect(screen.queryByText('bounce back')).toBeNull();

      // Sense with existing card shows "Ver Tarjeta"
      const verTarjetaButtons = screen.getAllByText(/Ver Tarjeta/i);
      expect(verTarjetaButtons.length).toBeGreaterThan(0);
      fireEvent.click(verTarjetaButtons[0]);
      expect(onSelectWordMock).toHaveBeenCalledWith(existingSenseCard);

      // Alternate sense without card shows "Crear Tarjeta"
      const crearTarjetaButtons = screen.getAllByText(/Crear Tarjeta/i);
      expect(crearTarjetaButtons.length).toBeGreaterThan(0);
      fireEvent.click(crearTarjetaButtons[0]);
      expect(onCreateCardFromSenseMock).toHaveBeenCalled();
    });

    it('navigates to previous and next word via buttons and keyboard arrows', () => {
      const onNavigateMock = vi.fn();

      render(
        <VocabDetailDrawer
          vocab={mockVocab}
          isOpen={true}
          onClose={vi.fn()}
          onNavigateWord={onNavigateMock}
          hasPrev={true}
          hasNext={true}
        />
      );

      // Previous button click
      const prevBtn = screen.getByTitle(/Palabra anterior/i);
      fireEvent.click(prevBtn);
      expect(onNavigateMock).toHaveBeenCalledWith('prev');

      // Next button click
      const nextBtn = screen.getByTitle(/Palabra siguiente/i);
      fireEvent.click(nextBtn);
      expect(onNavigateMock).toHaveBeenCalledWith('next');

      // Keyboard arrow navigation
      fireEvent.keyDown(window, { key: 'ArrowLeft' });
      expect(onNavigateMock).toHaveBeenCalledWith('prev');

      fireEvent.keyDown(window, { key: 'ArrowRight' });
      expect(onNavigateMock).toHaveBeenCalledWith('next');
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

    it('progressively discloses context examples when there are more than 2 examples', () => {
      const threeExamples: VocabContextExample[] = [
        { id: 'ex_1', vocabId: 'voc_test_1', sentenceEn: 'Sentence One.', sentenceEs: 'Oración Uno.', clozeTarget: 'test', cefrLevel: 'B1', createdAt: '' },
        { id: 'ex_2', vocabId: 'voc_test_1', sentenceEn: 'Sentence Two.', sentenceEs: 'Oración Dos.', clozeTarget: 'test', cefrLevel: 'B1', createdAt: '' },
        { id: 'ex_3', vocabId: 'voc_test_1', sentenceEn: 'Sentence Three.', sentenceEs: 'Oración Tres.', clozeTarget: 'test', cefrLevel: 'B1', createdAt: '' },
      ];

      render(
        <VocabDetailDrawer
          vocab={mockVocab}
          isOpen={true}
          onClose={vi.fn()}
          examples={threeExamples}
        />
      );

      // Initially only 2 sentences should be rendered in the document
      expect(screen.getByText(/“Sentence One.”/i)).toBeDefined();
      expect(screen.getByText(/“Sentence Two.”/i)).toBeDefined();
      expect(screen.queryByText(/“Sentence Three.”/i)).toBeNull();

      // Show more button exists
      const showMoreBtn = screen.getByText(/Mostrar 1 oraciones más/i);
      expect(showMoreBtn).toBeDefined();

      // Click to expand
      fireEvent.click(showMoreBtn);

      // Now all 3 sentences are visible
      expect(screen.getByText(/“Sentence Three.”/i)).toBeDefined();
    });

    it('does not duplicate primary sense examples at the bottom of the drawer', () => {
      const vocabWithGraduatedExamples: VocabItem = {
        ...mockVocab,
        sensesJson: [
          {
            translationEs: 'resiliente',
            definitionEn: 'Able to withstand or recover quickly.',
            partOfSpeech: 'ADJECTIVE',
            cefrLevel: 'B2',
            graduatedExamples: {
              sentenceBasicEn: 'She is resilient under pressure.',
              sentenceBasicEs: 'Ella es resiliente bajo presión.',
              sentenceAdvancedEn: 'Resilient organizations adapt rapidly to systemic shifts.',
              sentenceAdvancedEs: 'Las organizaciones resilientes se adaptan rápidamente.',
            },
          },
        ],
      };

      const examplesFromDb: VocabContextExample[] = [
        {
          id: 'ctx_dup_1',
          vocabId: 'voc_test_1',
          sentenceEn: 'She is resilient under pressure.',
          sentenceEs: 'Ella es resiliente bajo presión.',
          clozeTarget: 'resilient',
          cefrLevel: 'B2',
          createdAt: '',
        },
        {
          id: 'ctx_dup_2',
          vocabId: 'voc_test_1',
          sentenceEn: 'Resilient organizations adapt rapidly to systemic shifts.',
          sentenceEs: 'Las organizaciones resilientes se adaptan rápidamente.',
          clozeTarget: 'Resilient',
          cefrLevel: 'B2',
          createdAt: '',
        },
      ];

      render(
        <VocabDetailDrawer
          vocab={vocabWithGraduatedExamples}
          isOpen={true}
          onClose={vi.fn()}
          examples={examplesFromDb}
        />
      );

      // The sentences should appear in the primary sense block
      const basicMatches = screen.getAllByText(/“She is resilient under pressure.”/i);
      expect(basicMatches).toHaveLength(1);

      const advMatches = screen.getAllByText(/“Resilient organizations adapt rapidly to systemic shifts.”/i);
      expect(advMatches).toHaveLength(1);

      // Only 1 "ORACIONES EN CONTEXTO" header exists (inside SenseBlock), not duplicated at the bottom
      const headers = screen.getAllByText(/ORACIONES EN CONTEXTO/i);
      expect(headers).toHaveLength(1);
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
      expect(screen.getByText(/¿Seguro\?/i)).toBeDefined();

      // Click confirm
      fireEvent.click(screen.getByText(/Sí, eliminar/i));

      await waitFor(() => {
        expect(onDeleteMock).toHaveBeenCalledWith('voc_test_1');
        expect(onCloseMock).toHaveBeenCalled();
      });
    });

    it('renders phrasal verb badges without duplicating the Phrasal Verb tag', () => {
      const phrasalVocab: VocabItem = {
        id: 'phr_1',
        word: 'write down',
        translationEs: 'apuntar, anotar',
        definitionEn: 'To record information on paper or on a digital device.',
        ipaGeneralAmerican: 'ˌraɪt ˈdaʊn',
        cefrLevel: 'A2',
        partOfSpeech: 'VERB',
        subcategory: 'PHRASAL_VERB',
        grammaticalDimension: 'CHUNK',
        isFalseFriend: false,
        isCore: true,
        masteryStatus: 'LEARNING',
        domainCategory: 'Phrasal Verb', // Even if domainCategory was stored as Phrasal Verb
        createdAt: new Date().toISOString(),
      };

      render(
        <VocabDetailDrawer
          vocab={phrasalVocab}
          isOpen={true}
          onClose={vi.fn()}
        />
      );

      // Verify "Phrasal Verb" badge only appears once in the badges container
      const phrasalBadges = screen.getAllByText('Phrasal Verb');
      expect(phrasalBadges).toHaveLength(1);
      // And "Uso General" is rendered as the domain category badge
      expect(screen.getByText('Uso General')).toBeDefined();
    });
  });
});
