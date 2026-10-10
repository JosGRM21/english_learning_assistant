import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  VocabHeader,
  VocabMetricsBar,
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

  describe('VocabMetricsBar', () => {
    const mockCefrCounts = {
      ALL: 100,
      A1: 20,
      A2: 25,
      B1: 30,
      B2: 15,
      C1: 8,
      C2: 2,
    };

    it('renders total counts, Core progress, and interactive status and CEFR level filters', () => {
      const onSelectCefr = vi.fn();
      const onToggleFalseFriends = vi.fn();
      const onSelectMasteryStatus = vi.fn();

      render(
        <VocabMetricsBar
          totalCount={100}
          falseFriendsCount={5}
          cefrCounts={mockCefrCounts}
          selectedCefr="ALL"
          onlyFalseFriends={false}
          onSelectCefr={onSelectCefr}
          onToggleFalseFriends={onToggleFalseFriends}
          coverageStats={{
            totalCore: 3500,
            activeCore: 350,
            receptiveMastery: 120,
            productiveMastery: 45,
            byBand: {
              TOP_500: { total: 500, active: 200, mastered: 100 },
              TOP_1000: { total: 1000, active: 100, mastered: 20 },
              TOP_3000: { total: 1500, active: 50, mastered: 0 },
              TOP_5000: { total: 500, active: 0, mastered: 0 },
            },
          }}
          masteryStatusFilter="ALL"
          onSelectMasteryStatus={onSelectMasteryStatus}
        />,
      );

      expect(screen.getByText('100')).toBeDefined();
      expect(screen.getByText(/Core Corpus:/i)).toBeDefined();
      expect(screen.getByText('10%')).toBeDefined();
      expect(screen.getByText('Falsos amigos (5)')).toBeDefined();

      // Click CEFR level B1
      const b1Btn = screen.getByText('B1').closest('button');
      expect(b1Btn).toBeDefined();
      fireEvent.click(b1Btn!);
      expect(onSelectCefr).toHaveBeenCalledWith('B1');

      // Click False friends
      const ffBtn = screen.getByText('Falsos amigos (5)').closest('button');
      fireEvent.click(ffBtn!);
      expect(onToggleFalseFriends).toHaveBeenCalledTimes(1);

      // Click Receptive
      const recBtn = screen.getByText(/Receptivos/i).closest('button');
      fireEvent.click(recBtn!);
      expect(onSelectMasteryStatus).toHaveBeenCalledWith('RECEPTIVE_MASTERY');
    });
  });

  describe('VocabSearchToolbar', () => {
    it('handles search input, origin switcher and opens filter popover', () => {
      const onSearchChange = vi.fn();
      const onOriginChange = vi.fn();
      const onSortChange = vi.fn();
      const onSelectFrequencyBand = vi.fn();
      const onSelectDimension = vi.fn();
      const onSelectRegister = vi.fn();
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
          selectedRegister="ALL"
          selectedPartOfSpeech="ALL"
          onSelectFrequencyBand={onSelectFrequencyBand}
          onSelectDimension={onSelectDimension}
          onSelectRegister={onSelectRegister}
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
