import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PhoneticsLabView } from '../PhoneticsLabView';

describe('PhoneticsLabView Component', () => {
  it('renders title, in-construction badges and user-friendly explanation', () => {
    render(<PhoneticsLabView />);

    // Header and titles
    expect(screen.getByText('Laboratorio de Fonética')).toBeDefined();
    expect(screen.getByText('Módulo en construcción')).toBeDefined();
    expect(screen.getByText('En construcción')).toBeDefined();

    // Friendly, learner-focused features
    expect(screen.getByText('Discriminación auditiva')).toBeDefined();
    expect(screen.getByText('Habla conectada')).toBeDefined();
    expect(screen.getByText('Práctica guiada')).toBeDefined();

    // Verify technical jargon and dev files are absent
    expect(screen.queryByText(/08_phonetics_connected_speech_lab/i)).toBeNull();
    expect(screen.queryByText(/PHONETIC_ACUITY/i)).toBeNull();
    expect(screen.queryByText(/catenación C-V/i)).toBeNull();
    expect(screen.queryByText(/FSRS 5\.0/i)).toBeNull();
  });

  it('triggers onNavigateTab when shortcut buttons are clicked', () => {
    const handleNavigate = vi.fn();
    render(<PhoneticsLabView onNavigateTab={handleNavigate} />);

    const vocabBtn = screen.getByText('Explorar Vocabulario');
    fireEvent.click(vocabBtn);
    expect(handleNavigate).toHaveBeenCalledWith('vocab');

    const srsBtn = screen.getByText('Repasar Tarjetas');
    fireEvent.click(srsBtn);
    expect(handleNavigate).toHaveBeenCalledWith('srs');
  });

  it('renders gracefully without onNavigateTab prop', () => {
    render(<PhoneticsLabView />);
    expect(screen.queryByText('Explorar Vocabulario')).toBeNull();
  });
});
