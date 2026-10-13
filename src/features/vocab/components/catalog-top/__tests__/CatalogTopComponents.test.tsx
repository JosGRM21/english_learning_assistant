import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  VocabHeader,
  VocabSearchToolbar,
  VocabSelectionBar,
} from '../index';

describe('CatalogTop Components Modular Suite', () => {
  describe('VocabHeader', () => {
    it('renders title, accent preference, and handles accent toggle and add word click', () => {
      const onToggleAccent = vi.fn();
      const onAddWordClick = vi.fn();
      const onOpenGoalsModal = vi.fn();
      const onToggleSelectionMode = vi.fn();
      const onOpenClearAllModal = vi.fn();

      render(
        <VocabHeader
          accentPreference="US"
          onToggleAccent={onToggleAccent}
          onAddWordClick={onAddWordClick}
          onOpenGoalsModal={onOpenGoalsModal}
          isSelectionMode={false}
          onToggleSelectionMode={onToggleSelectionMode}
          hasWords={true}
          onOpenClearAllModal={onOpenClearAllModal}
        />,
      );

      expect(screen.getByText('Banco de Vocabulario y Expresiones')).toBeDefined();
      expect(screen.getByText('US')).toBeDefined();

      // Click accent toggle
      const accentBtn = screen.getByText('Acento:').closest('button');
      expect(accentBtn).toBeDefined();
      fireEvent.click(accentBtn!);
      expect(onToggleAccent).toHaveBeenCalledTimes(1);

      // Click Add Word button
      const addBtn = screen.getByText('Agregar Palabra').closest('button');
      expect(addBtn).toBeDefined();
      fireEvent.click(addBtn!);
      expect(onAddWordClick).toHaveBeenCalledTimes(1);
    });
  });



  describe('VocabSearchToolbar', () => {
    it('handles search input, origin switcher and opens filter popover', () => {
      const onSearchChange = vi.fn();
      const onOriginChange = vi.fn();
      const onSortChange = vi.fn();
      const onSelectFrequencyBand = vi.fn();
      const onSelectDimension = vi.fn();
      const onSelectPartOfSpeech = vi.fn();
      const onResetAdvancedFilters = vi.fn();

      render(
        <VocabSearchToolbar
          searchQuery=""
          onSearchChange={onSearchChange}
          suggestions={[]}
          showSuggestions={false}
          onShowSuggestionsChange={vi.fn()}
          onSelectSuggestion={vi.fn()}
          onActivateSuggestionWord={vi.fn()}
          originFilter="ALL"
          onOriginChange={onOriginChange}
          sortBy="RECENT"
          onSortChange={onSortChange}
          frequencyBandFilter="ALL"
          selectedDimension="ALL"
          selectedPartOfSpeech="ALL"
          onSelectFrequencyBand={onSelectFrequencyBand}
          onSelectDimension={onSelectDimension}
          onSelectPartOfSpeech={onSelectPartOfSpeech}
          onResetAdvancedFilters={onResetAdvancedFilters}
        />,
      );

      const searchInput = screen.getByPlaceholderText(/Buscar término/i);
      fireEvent.change(searchInput, { target: { value: 'challenge' } });
      expect(onSearchChange).toHaveBeenCalledWith('challenge');

      // Origin switcher: Core
      const coreBtn = screen.getByText('Core (3.5k)');
      fireEvent.click(coreBtn);
      expect(onOriginChange).toHaveBeenCalledWith('CORE');

      // Filter button exists
      const filterBtn = screen.getByText('Filtros');
      expect(filterBtn).toBeDefined();
      fireEvent.click(filterBtn);
      expect(screen.getByText('Filtros Avanzados')).toBeDefined();
    });
  });

  describe('VocabSelectionBar', () => {
    it('renders count and invokes callbacks', () => {
      const onToggleSelectAllPage = vi.fn();
      const onClearSelection = vi.fn();
      const onConfirmBulkDelete = vi.fn();

      render(
        <VocabSelectionBar
          selectedCount={3}
          isAllPageSelected={false}
          onToggleSelectAllPage={onToggleSelectAllPage}
          onClearSelection={onClearSelection}
          onConfirmBulkDelete={onConfirmBulkDelete}
        />,
      );

      expect(screen.getByText('3 seleccionados')).toBeDefined();

      const cancelBtn = screen.getByText('Cancelar').closest('button');
      fireEvent.click(cancelBtn!);
      expect(onClearSelection).toHaveBeenCalledTimes(1);

      const deleteBtn = screen.getByText('Eliminar (3)').closest('button');
      fireEvent.click(deleteBtn!);
      expect(onConfirmBulkDelete).toHaveBeenCalledTimes(1);
    });

    it('returns null when selectedCount is 0', () => {
      const { container } = render(
        <VocabSelectionBar
          selectedCount={0}
          isAllPageSelected={false}
          onToggleSelectAllPage={vi.fn()}
          onClearSelection={vi.fn()}
          onConfirmBulkDelete={vi.fn()}
        />,
      );

      expect(container.firstChild).toBeNull();
    });
  });
});
