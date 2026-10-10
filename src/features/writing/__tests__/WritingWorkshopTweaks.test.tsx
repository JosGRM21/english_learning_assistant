import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import { WritingCanvas } from '../components/WritingCanvas';
import { WritingAssistantPanel } from '../components/WritingAssistantPanel';
import { WritingSessionBar } from '../components/WritingSessionBar';
import { ReadingItem, WritingMission } from '@/data/reading-to-write-catalog';

const mockMission: WritingMission = {
  type: 'OPINION',
  titleEs: 'Ensayo reflexivo sobre tu ciudad',
  instructionsEs: 'Describe cómo tu ciudad integra áreas verdes y los retos ambientales.',
  suggestedWordRange: { min: 60, max: 120 },
  suggestedOpening: 'In my home city, green spaces are essential because',
};

const mockReading: ReadingItem = {
  id: 'test-reading-1',
  title: 'Urban Ecology in the 21st Century',
  cefrLevel: 'B2',
  category: 'TECH_INNOVATION',
  categoryLabelEs: 'Innovación & Tecnología',
  readingTimeMin: 2,
  wordCount: 75,
  readingSummaryEs: 'Un texto sobre ecología urbana.',
  readingTextEn: 'Cities are transforming into greener habitats. Trees mitigate heat.',
  keyVocabulary: [],
  comprehensionQuestions: [],
  writingMissions: [mockMission],
};

describe('Taller de Redacción Tweaks', () => {
  describe('1. Conteo de caracteres sin espacios en blanco', () => {
    it('does not count whitespace characters in live metric counter', () => {
      const { rerender } = render(
        <WritingCanvas
          draft="Hello world"
          isLoading={false}
          onDraftChange={() => {}}
          onInsertText={() => {}}
          onRequestSocratic={() => {}}
        />,
      );

      // "Hello world" has 11 total chars, but 10 non-whitespace chars
      expect(screen.getByText('10 caracteres')).toBeDefined();

      rerender(
        <WritingCanvas
          draft={'   a   \n  b  \t c  '}
          isLoading={false}
          onDraftChange={() => {}}
          onInsertText={() => {}}
          onRequestSocratic={() => {}}
        />,
      );

      // Only 'a', 'b', 'c' (3 characters)
      expect(screen.getByText('3 caracteres')).toBeDefined();
    });
  });

  describe('2 & 4. Enfoque automático y tab por defecto en el Asistente Pedagógico', () => {
    it('focuses directly on reading tab when reading is selected, even if connectors or vocab was active', () => {
      const { rerender } = render(
        <WritingAssistantPanel
          targetCefr="B1"
          selectedReading={null}
          onInsertText={() => {}}
        />,
      );

      // Initially no reading -> first tab is Conectores
      expect(screen.getByText(/Conectores/i)).toBeDefined();

      // Switch to Vocabulario
      const vocabTabBtn = screen.getByRole('button', { name: /Vocabulario/i });
      fireEvent.click(vocabTabBtn);
      expect(screen.getByText(/Palabras a Activar en Memoria/i)).toBeDefined();

      // Now a reading is selected
      rerender(
        <WritingAssistantPanel
          targetCefr="B2"
          selectedReading={mockReading}
          selectedMission={mockMission}
          onInsertText={() => {}}
        />,
      );

      // Must automatically switch to 'Lectura' tab
      expect(screen.getByText(/Lectura Base • B2/i)).toBeDefined();
      expect(screen.getByText('Urban Ecology in the 21st Century')).toBeDefined();
    });

    it('reverts to the first tab (Conectores) when reading is removed', () => {
      const { rerender } = render(
        <WritingAssistantPanel
          targetCefr="B2"
          selectedReading={mockReading}
          selectedMission={mockMission}
          onInsertText={() => {}}
        />,
      );

      // Reading tab is active
      expect(screen.getByText(/Lectura Base • B2/i)).toBeDefined();

      // Remove reading
      rerender(
        <WritingAssistantPanel
          targetCefr="B2"
          selectedReading={null}
          selectedMission={null}
          onInsertText={() => {}}
        />,
      );

      // Must revert to Conectores tab by default
      expect(screen.queryByText(/Lectura Base/i)).toBeNull();
      expect(screen.getByText(/Todos/i)).toBeDefined();
    });
  });

  describe('3. Misión mostrada únicamente arriba del textarea y no en el asistente', () => {
    it('does not display mission title or instructions inside WritingAssistantPanel', () => {
      render(
        <WritingAssistantPanel
          targetCefr="B2"
          selectedReading={mockReading}
          selectedMission={mockMission}
          onInsertText={() => {}}
        />,
      );

      // Reading text is displayed
      expect(screen.getByText(/Cities are transforming into greener habitats/i)).toBeDefined();

      // Mission title and instructions are NOT in WritingAssistantPanel
      expect(screen.queryByText('Ensayo reflexivo sobre tu ciudad')).toBeNull();
      expect(screen.queryByText('Describe cómo tu ciudad integra áreas verdes y los retos ambientales.')).toBeNull();
    });

    it('displays mission title and instructions above textarea in WritingCanvas', () => {
      render(
        <WritingCanvas
          draft=""
          selectedReading={mockReading}
          selectedMission={mockMission}
          isLoading={false}
          onDraftChange={() => {}}
          onInsertText={() => {}}
          onRequestSocratic={() => {}}
        />,
      );

      // Mission is displayed above textarea in WritingCanvas
      expect(screen.getByText('Misión de Redacción')).toBeDefined();
      expect(screen.getByText('Ensayo reflexivo sobre tu ciudad')).toBeDefined();
      expect(screen.getByText('Describe cómo tu ciudad integra áreas verdes y los retos ambientales.')).toBeDefined();
    });
  });

  describe('5. Eliminación del botón de borrar contenido junto a los niveles CEFR', () => {
    it('does not render the trash/clear button in WritingSessionBar even when draft content is present', () => {
      render(
        <WritingSessionBar
          submissionMode="FREE"
          targetCefr="B1"
          onSubmissionModeChange={() => {}}
          onTargetCefrChange={() => {}}
        />,
      );

      // Level selector exists
      expect(screen.getByText('B1')).toBeDefined();

      // Clear/trash button should NOT exist
      expect(screen.queryByRole('button', { name: /borrar borrador actual/i })).toBeNull();
    });
  });
});
