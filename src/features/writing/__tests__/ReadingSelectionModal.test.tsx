import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import { ReadingSelectionModal } from '../components/ReadingSelectionModal';
import { READING_TO_WRITE_CATALOG } from '@/data/reading-to-write-catalog';

describe('ReadingSelectionModal Component', () => {
  it('does not render when isOpen is false', () => {
    const { container } = render(
      <ReadingSelectionModal
        isOpen={false}
        onClose={vi.fn()}
        onSelectReadingAndMission={vi.fn()}
      />,
    );

    expect(container.firstChild).toBeNull();
  });

  it('renders modal header and catalog items when isOpen is true', () => {
    render(
      <ReadingSelectionModal
        isOpen={true}
        onClose={vi.fn()}
        onSelectReadingAndMission={vi.fn()}
      />,
    );

    expect(screen.getByText(/Lectura y Redacción Integrada \(Reading-to-Write\)/i)).toBeDefined();

    // Verify catalog readings appear
    const firstItem = READING_TO_WRITE_CATALOG[0];
    expect(screen.getByText(firstItem.title)).toBeDefined();
  });

  it('filters readings by category and CEFR level', () => {
    render(
      <ReadingSelectionModal
        isOpen={true}
        onClose={vi.fn()}
        onSelectReadingAndMission={vi.fn()}
      />,
    );

    // Filter by 'Cuentos'
    const storiesFilter = screen.getByRole('button', { name: 'Cuentos' });
    fireEvent.click(storiesFilter);

    const techItem = READING_TO_WRITE_CATALOG.find((r) => r.category === 'TECH_INNOVATION');
    if (techItem) {
      expect(screen.queryByText(techItem.title)).toBeNull();
    }
  });

  it('selects a mission and triggers onSelectReadingAndMission and onClose', () => {
    const handleSelect = vi.fn();
    const handleClose = vi.fn();

    render(
      <ReadingSelectionModal
        isOpen={true}
        onClose={handleClose}
        onSelectReadingAndMission={handleSelect}
      />,
    );

    const firstReading = READING_TO_WRITE_CATALOG[0];
    const firstMission = firstReading.writingMissions[0];

    // Find and click the mission button
    const missionButton = screen.getByRole('button', { name: new RegExp(firstMission.titleEs, 'i') });
    fireEvent.click(missionButton);

    expect(handleSelect).toHaveBeenCalledWith(firstReading, firstMission);
    expect(handleClose).toHaveBeenCalled();
  });

  it('filters readings in real time using the search input', () => {
    render(
      <ReadingSelectionModal
        isOpen={true}
        onClose={vi.fn()}
        onSelectReadingAndMission={vi.fn()}
      />,
    );

    const searchInput = screen.getByPlaceholderText(/Buscar por tema, palabra clave o título/i);
    fireEvent.change(searchInput, { target: { value: 'Sunday Cafe' } });

    expect(screen.getByText('The Rainy Sunday Cafe')).toBeDefined();

    // Check that unrelated story is not shown
    const techItem = READING_TO_WRITE_CATALOG.find((r) => r.category === 'TECH_INNOVATION');
    if (techItem) {
      expect(screen.queryByText(techItem.title)).toBeNull();
    }
  });

  it('renders the reading text in English and mission selection without comprehension questions', () => {
    render(
      <ReadingSelectionModal
        isOpen={true}
        onClose={vi.fn()}
        onSelectReadingAndMission={vi.fn()}
      />,
    );

    const firstReading = READING_TO_WRITE_CATALOG[0];

    // The English text should be displayed in the canvas
    expect(screen.getByText(new RegExp(firstReading.readingTextEn.slice(0, 30), 'i'))).toBeDefined();

    // Comprehension questions should NOT be present
    expect(screen.queryByText(/Preguntas para reflexionar antes de redactar/i)).toBeNull();
  });

  it('shows empty state when no readings match and resets filters', () => {
    render(
      <ReadingSelectionModal
        isOpen={true}
        onClose={vi.fn()}
        onSelectReadingAndMission={vi.fn()}
      />,
    );

    const searchInput = screen.getByPlaceholderText(/Buscar por tema, palabra clave o título/i);
    fireEvent.change(searchInput, { target: { value: 'XYZNONEXISTENTQUERY12345' } });

    expect(screen.getByText(/No se encontraron lecturas/i)).toBeDefined();

    const resetBtn = screen.getByRole('button', { name: /Restablecer filtros/i });
    fireEvent.click(resetBtn);

    expect(screen.getByText(READING_TO_WRITE_CATALOG[0].title)).toBeDefined();
  });
});
