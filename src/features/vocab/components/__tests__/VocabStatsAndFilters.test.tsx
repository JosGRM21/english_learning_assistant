import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { VocabStatsBento } from '../VocabStatsBento';

describe('VocabStatsBento Component', () => {
  const mockCefrCounts = {
    ALL: 25,
    A1: 5,
    A2: 5,
    B1: 8,
    B2: 4,
    C1: 2,
    C2: 1,
  };

  it('renders total counts, CEFR badges, and false friends count', () => {
    render(
      <VocabStatsBento
        totalCount={25}
        filteredCount={25}
        falseFriendsCount={3}
        cefrCounts={mockCefrCounts}
        selectedCefr="ALL"
        onlyFalseFriends={false}
        onSelectCefr={vi.fn()}
        onToggleFalseFriends={vi.fn()}
      />
    );

    expect(screen.getByText('25')).toBeDefined();
    expect(screen.getByText('3')).toBeDefined();
    expect(screen.getByText(/Inventario Léxico/i)).toBeDefined();
    expect(screen.getByText('Falsos Amigos')).toBeDefined();
    expect(screen.getByText(/Distribución por Nivel CEFR/i)).toBeDefined();
  });

  it('triggers onToggleFalseFriends when clicking the false friends card', () => {
    const onToggleMock = vi.fn();
    render(
      <VocabStatsBento
        totalCount={25}
        filteredCount={25}
        falseFriendsCount={3}
        cefrCounts={mockCefrCounts}
        selectedCefr="ALL"
        onlyFalseFriends={false}
        onSelectCefr={vi.fn()}
        onToggleFalseFriends={onToggleMock}
      />
    );

    const falseFriendsBtn = screen.getByText(/trampas léxicas/i).closest('button');
    expect(falseFriendsBtn).toBeDefined();
    fireEvent.click(falseFriendsBtn!);

    expect(onToggleMock).toHaveBeenCalledTimes(1);
  });

  it('triggers onSelectCefr when clicking a specific CEFR level pill', () => {
    const onSelectCefrMock = vi.fn();
    render(
      <VocabStatsBento
        totalCount={25}
        filteredCount={25}
        falseFriendsCount={3}
        cefrCounts={mockCefrCounts}
        selectedCefr="ALL"
        onlyFalseFriends={false}
        onSelectCefr={onSelectCefrMock}
        onToggleFalseFriends={vi.fn()}
      />
    );

    const b2Btn = screen.getByText('B2').closest('button');
    expect(b2Btn).toBeDefined();
    fireEvent.click(b2Btn!);

    expect(onSelectCefrMock).toHaveBeenCalledWith('B2');
  });
});
