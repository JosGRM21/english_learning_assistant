import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  VocabHeader,
  VocabSearchToolbar,
  VocabSelectionBar,
  VocabGoalSettingsModal,
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

      // Click accent toggle (now icon + US/UK pill without the word "Acento:")
      const accentBtn = screen.getByText('US').closest('button');
      expect(accentBtn).toBeDefined();
      fireEvent.click(accentBtn!);
      expect(onToggleAccent).toHaveBeenCalledTimes(1);

      // Goals button is directly accessible outside 3-dots
      const goalsBtn = screen.getByText('Meta de Repaso').closest('button');
      expect(goalsBtn).toBeDefined();
      fireEvent.click(goalsBtn!);
      expect(onOpenGoalsModal).toHaveBeenCalledTimes(1);

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
          coreCount={198}
          vaultCount={15}
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
      const coreBtn = screen.getByText('Core (198)');
      fireEvent.click(coreBtn);
      expect(onOriginChange).toHaveBeenCalledWith('CORE');

      // Origin switcher: Vault
      const vaultBtn = screen.getByText('Mi Bóveda (15)');
      fireEvent.click(vaultBtn);
      expect(onOriginChange).toHaveBeenCalledWith('VAULT');

      // Filter & Sorting button exists
      const filterBtn = screen.getByText('Filtros');
      expect(filterBtn).toBeDefined();
      fireEvent.click(filterBtn);
      expect(screen.getByText('Filtros y Ordenación')).toBeDefined();
      expect(screen.getByText('Ordenar por')).toBeDefined();
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
  });

  describe('VocabGoalSettingsModal', () => {
    it('renders goal options, daily quota buttons, and triggers onSaveSettings', async () => {
      const onSaveSettings = vi.fn().mockResolvedValue(undefined);
      const onClose = vi.fn();

      render(
        <VocabGoalSettingsModal
          isOpen={true}
          onClose={onClose}
          initialGoal="TOP_500"
          initialDailyQuota={10}
          onSaveSettings={onSaveSettings}
        />,
      );

      expect(screen.getByText('Meta de Aprendizaje y Ritmo Diario')).toBeDefined();
      expect(screen.getByText('Top 500 Esencial')).toBeDefined();
      expect(screen.getByText('Top 1000 Consolidación')).toBeDefined();

      // Change goal to TOP_1000
      fireEvent.click(screen.getByText('Top 1000 Consolidación'));

      // Click +15 quota
      fireEvent.click(screen.getByText('+15'));

      // Click save
      const saveBtn = screen.getByText('Guardar Configuración').closest('button');
      expect(saveBtn).toBeDefined();
      fireEvent.click(saveBtn!);

      expect(onSaveSettings).toHaveBeenCalledWith({
        activeGoal: 'TOP_1000',
        dailyNewCardsTarget: 15,
        includePhrasalVerbs: true,
      });
      await vi.waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    });

    it('renders null when isOpen is false', () => {
      const { container } = render(
        <VocabGoalSettingsModal
          isOpen={false}
          onClose={vi.fn()}
          onSaveSettings={vi.fn()}
        />,
      );
      expect(container.firstChild).toBeNull();
    });
  });
});
