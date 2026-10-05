import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AddVocabModal } from '../AddVocabModal';
import * as aiHook from '@/shared/hooks/useAiGateway';
import { VocabItem } from '@/core/types/vocab';

describe('AddVocabModal Component', () => {
  const mockAiGateway = {
    lookupVocabWord: vi.fn(),
    evaluateWritingSubmission: vi.fn(),
    generateSocraticFeedback: vi.fn(),
    rotateKeyOnQuotaExceeded: vi.fn(),
    getActiveModelConfig: vi.fn(),
  };

  const mockOrchestrator = {
    getApiKeys: vi.fn().mockReturnValue([
      { id: 'key_1', label: 'Gemini Key 1', isActive: true, isPrimary: true, maskedKey: 'AIzaSy...1234' },
    ]),
  };

  const existingWord: VocabItem = {
    id: 'voc_bank_1',
    word: 'bank',
    translationEs: 'banco financiero',
    definitionEn: 'A financial institution that accepts deposits.',
    partOfSpeech: 'NOUN',
    grammaticalDimension: 'CONTENT',
    domainCategory: 'Finanzas',
    ipaGeneralAmerican: 'bæŋk',
    cefrLevel: 'A2',
    isFalseFriend: false,
    createdAt: new Date().toISOString(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(aiHook, 'useAiGateway').mockReturnValue({
      aiGateway: mockAiGateway as any,
      orchestrator: mockOrchestrator as any,
      defaultModel: 'gemini-3.8-flash',
      setDefaultModel: vi.fn(),
    });
  });

  it('transitions cleanly from closed (isOpen: false) to open (isOpen: true) without Hook rule errors', () => {
    const { rerender } = render(
      <AddVocabModal isOpen={false} onClose={vi.fn()} onAddWord={vi.fn()} />
    );

    expect(screen.queryByText(/Agregar Término al Catálogo/i)).toBeNull();

    rerender(<AddVocabModal isOpen={true} onClose={vi.fn()} onAddWord={vi.fn()} />);

    expect(screen.getByText(/Agregar Término al Catálogo/i)).toBeDefined();
    expect(screen.getByPlaceholderText(/ej: resilient/i)).toBeDefined();
  });

  it('calls onClose when clicking close button or pressing Escape', () => {
    const onCloseMock = vi.fn();
    render(<AddVocabModal isOpen={true} onClose={onCloseMock} onAddWord={vi.fn()} />);

    // Click close button
    const closeBtn = screen.getByTitle(/Cerrar \(Esc\)/i);
    fireEvent.click(closeBtn);
    expect(onCloseMock).toHaveBeenCalledTimes(1);

    // Press Escape
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onCloseMock).toHaveBeenCalledTimes(2);
  });

  it('does NOT render card preview prior to clicking "Consultar IA" (clean state)', () => {
    render(<AddVocabModal isOpen={true} onClose={vi.fn()} onAddWord={vi.fn()} />);

    // Card preview elements must not be present initially
    expect(screen.queryByText(/Vista Previa del Término Enriquecido/i)).toBeNull();
    expect(screen.queryByText(/Vista Previa Manual/i)).toBeNull();
  });

  it('shows duplicate warning banner when typing a word already present in catalog', () => {
    render(
      <AddVocabModal
        isOpen={true}
        onClose={vi.fn()}
        onAddWord={vi.fn()}
        existingWords={[existingWord]}
      />
    );

    const input = screen.getByPlaceholderText(/ej: resilient/i);
    fireEvent.change(input, { target: { value: 'bank' } });

    expect(screen.getByText(/Coincidencia en Catálogo:/i)).toBeDefined();
    expect(screen.getByText(/Ya tienes/i)).toBeDefined();
    expect(screen.getByText(/Finanzas: banco financiero/i)).toBeDefined();
  });

  it('enriches word with AI, displays automatic domains and alternate senses, and saves selected senses', async () => {
    const onAddMultipleMock = vi.fn().mockResolvedValue(true);
    const onCloseMock = vi.fn();

    mockAiGateway.lookupVocabWord.mockResolvedValue({
      word: 'bank',
      translationEs: 'banco (institución)',
      definitionEn: 'An organization where people and businesses can invest or borrow money.',
      partOfSpeech: 'NOUN',
      grammaticalDimension: 'CONTENT',
      domainCategory: 'Finanzas',
      cefrLevel: 'A2',
      ipaGeneralAmerican: 'bæŋk',
      exampleSentenceEn: 'I need to go to the bank to deposit a check.',
      exampleSentenceEs: 'Necesito ir al banco a depositar un cheque.',
      isFalseFriend: false,
      senses: [
        {
          id: 'sense_river',
          domainCategory: 'Geografía',
          partOfSpeech: 'NOUN',
          translationEs: 'orilla / ribera',
          definitionEn: 'The land alongside or sloping down to a river or lake.',
          exampleSentenceEn: 'We had a picnic on the river bank.',
          exampleSentenceEs: 'Hicimos un picnic en la orilla del río.',
        },
      ],
    });

    render(
      <AddVocabModal
        isOpen={true}
        onClose={onCloseMock}
        onAddWord={vi.fn()}
        onAddMultipleWords={onAddMultipleMock}
      />
    );

    const input = screen.getByPlaceholderText(/ej: resilient/i);
    fireEvent.change(input, { target: { value: 'bank' } });

    const consultBtn = screen.getByRole('button', { name: /Consultar IA/i });
    fireEvent.click(consultBtn);

    // After lookup finishes, the enriched preview and alternate senses must appear
    await waitFor(() => {
      expect(screen.getByText(/Acepciones y Significados Detectados/i)).toBeDefined();
      expect(screen.getByText(/Geografía/i)).toBeDefined();
      expect(screen.getByText(/orilla \/ ribera/i)).toBeDefined();
    });

    // Submit button should state multiple terms are being added
    const submitBtn = screen.getByRole('button', { name: /Guardar 2 Acepciones/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(onAddMultipleMock).toHaveBeenCalledTimes(1);
      const savedPayloads = onAddMultipleMock.mock.calls[0][0];
      expect(savedPayloads).toHaveLength(2);
      expect(savedPayloads[0].domainCategory).toBe('Finanzas');
      expect(savedPayloads[1].domainCategory).toBe('Geografía');
      expect(savedPayloads[1].translationEs).toBe('orilla / ribera');
      expect(onCloseMock).toHaveBeenCalled();
    });
  });

  it('displays spelling correction banner when AI detects a typo', async () => {
    mockAiGateway.lookupVocabWord.mockResolvedValue({
      word: 'accommodation',
      translationEs: 'alojamiento, hospedaje',
      definitionEn: 'A room or building in which someone may live or stay.',
      partOfSpeech: 'NOUN',
      grammaticalDimension: 'CONTENT',
      domainCategory: 'Turismo y Viajes',
      cefrLevel: 'B1',
      spellingCorrection: {
        hasCorrection: true,
        originalInput: 'acomodation',
        correctedWord: 'accommodation',
        explanationEs: 'Se corrigió la ortografía: en inglés lleva doble c y doble m.',
      },
    });

    render(<AddVocabModal isOpen={true} onClose={vi.fn()} onAddWord={vi.fn()} />);

    const input = screen.getByPlaceholderText(/ej: resilient/i);
    fireEvent.change(input, { target: { value: 'acomodation' } });

    const consultBtn = screen.getByRole('button', { name: /Consultar IA/i });
    fireEvent.click(consultBtn);

    await waitFor(() => {
      expect(screen.getByText(/Sugerencia Ortográfica Detectada:/i)).toBeDefined();
      expect(screen.getByText(/acomodation/i)).toBeDefined();
      expect(screen.getAllByText(/accommodation/i).length).toBeGreaterThanOrEqual(1);
    });
  });

  it('renders CEFR level badge on each sense and filters senses using CEFR quick-select helpers', async () => {
    mockAiGateway.lookupVocabWord.mockResolvedValue({
      word: 'run',
      translationEs: 'correr',
      definitionEn: 'To move fast on foot.',
      partOfSpeech: 'VERB',
      grammaticalDimension: 'CONTENT',
      domainCategory: 'Deportes',
      cefrLevel: 'A1',
      ipaGeneralAmerican: 'rʌn',
      exampleSentenceEn: 'I run every day.',
      exampleSentenceEs: 'Corro todos los días.',
      isFalseFriend: false,
      senses: [
        {
          id: 'sns_manage',
          domainCategory: 'Negocios',
          partOfSpeech: 'VERB',
          translationEs: 'dirigir o gestionar',
          definitionEn: 'To manage or operate.',
          exampleSentenceEn: 'She runs a bakery.',
          exampleSentenceEs: 'Ella dirige una panadería.',
          cefrLevel: 'B2',
        },
        {
          id: 'sns_transit',
          domainCategory: 'Transporte',
          partOfSpeech: 'VERB',
          translationEs: 'circular con regularidad',
          definitionEn: 'To operate on a route.',
          exampleSentenceEn: 'Buses run frequently.',
          exampleSentenceEs: 'Los autobuses circulan con frecuencia.',
          cefrLevel: 'B1',
        },
      ],
    });

    render(<AddVocabModal isOpen={true} onClose={vi.fn()} onAddWord={vi.fn()} />);

    const input = screen.getByPlaceholderText(/ej: resilient/i);
    fireEvent.change(input, { target: { value: 'run' } });

    const consultBtn = screen.getByRole('button', { name: /Consultar IA/i });
    fireEvent.click(consultBtn);

    await waitFor(() => {
      // Both CEFR badges must be rendered in the senses section
      expect(screen.getByText('B2')).toBeDefined();
      expect(screen.getByText('B1')).toBeDefined();
      expect(screen.getByText(/dirigir o gestionar/i)).toBeDefined();
      expect(screen.getByText(/circular con regularidad/i)).toBeDefined();
    });

    // Initially all 3 are selected (1 primary + 2 alternates)
    expect(screen.getByRole('button', { name: /Guardar 3 Acepciones/i })).toBeDefined();

    // Click "Hasta B1" -> Should select A1 (primary) and B1, excluding B2
    const filterB1Btn = screen.getByRole('button', { name: /Hasta B1/i });
    fireEvent.click(filterB1Btn);

    expect(screen.getByRole('button', { name: /Guardar 2 Acepciones/i })).toBeDefined();

    // Click "Solo Principal" -> Should select only 1
    const soloPrincipalBtn = screen.getByRole('button', { name: /Solo Principal/i });
    fireEvent.click(soloPrincipalBtn);

    expect(screen.getByRole('button', { name: /Guardar Término/i })).toBeDefined();
  });
});
