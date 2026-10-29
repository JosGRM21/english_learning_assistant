import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { WritingHistoryDrawer } from '../components/WritingHistoryDrawer';
import { WritingSubmissionEntity } from '@/core/repositories/IWritingRepository';

const mockSubmission: WritingSubmissionEntity = {
  id: 'sub-test-1',
  userId: 'user_local',
  submissionMode: 'FREE',
  userText: 'Currently, I can assist to the meeting because my agenda is clear.',
  draft2Text: 'Currently, I can attend the meeting because my schedule is clear.',
  wordCount: 13,
  status: 'EVALUATED',
  submittedAt: '2026-10-28T11:14:00.000Z',
  evaluation: {
    estimated_cefr: 'B1',
    clean_structural_version: 'Currently, I can attend the meeting because my schedule is clear.',
    native_recast_version: 'I am available to attend the meeting as my schedule is open.',
    overall_feedback_es: 'Buen trabajo con los falsos amigos.',
    rubric_scores: {
      accuracy: 9.5,
      range_and_precision: 8.5,
      cohesion_and_flow: 9.0,
      pragmatics_and_complexity: 8.5,
    },
    qualitative_recommendations_es: 'Continúa practicando colocaciones formales.',
    noticing_the_gap_contrasts: [],
    successful_repairs: [],
    corrections: [],
  },
};

describe('WritingHistoryDrawer UI & Actions', () => {
  it('renders rubric score boxes with polished color palettes and distinct /10 typography', () => {
    render(
      <WritingHistoryDrawer
        submissions={[mockSubmission]}
        isLoading={false}
        onSelectSubmission={vi.fn()}
        onNewWriting={vi.fn()}
      />,
    );

    // Verify all 4 rubric dimensions are displayed
    expect(screen.getByText('Precisión')).toBeDefined();
    expect(screen.getByText('Léxico')).toBeDefined();
    expect(screen.getByText('Cohesión')).toBeDefined();
    expect(screen.getByText('Pragmática')).toBeDefined();

    // Verify scores are displayed
    expect(screen.getByText('9.5')).toBeDefined();
    expect(screen.getAllByText('8.5')).toHaveLength(2); // Léxico & Pragmática
    expect(screen.getByText('9')).toBeDefined(); // Cohesión

    // Verify /10 denom is rendered in all 4 boxes
    expect(screen.getAllByText('/10')).toHaveLength(4);
  });

  it('triggers single submission deletion flow with confirmation modal', () => {
    const onDeleteSubmission = vi.fn();
    render(
      <WritingHistoryDrawer
        submissions={[mockSubmission]}
        isLoading={false}
        onSelectSubmission={vi.fn()}
        onDeleteSubmission={onDeleteSubmission}
        onNewWriting={vi.fn()}
      />,
    );

    // Find and click delete button on the card
    const cardDeleteBtn = screen.getByRole('button', { name: /Eliminar redacción/i });
    expect(cardDeleteBtn).toBeDefined();
    fireEvent.click(cardDeleteBtn);

    // Verify confirmation modal opens
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText('¿Eliminar esta redacción?')).toBeDefined();
    expect(
      within(dialog).getByText(/Esta redacción y su evaluación serán eliminadas permanentemente/i),
    ).toBeDefined();

    // Cancel first
    const cancelBtn = within(dialog).getByRole('button', { name: 'Cancelar' });
    fireEvent.click(cancelBtn);
    expect(onDeleteSubmission).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).toBeNull();

    // Reopen and confirm
    fireEvent.click(cardDeleteBtn);
    const openDialog = screen.getByRole('dialog');
    const modalConfirmBtn = within(openDialog).getByRole('button', { name: 'Eliminar redacción' });
    fireEvent.click(modalConfirmBtn);

    expect(onDeleteSubmission).toHaveBeenCalledTimes(1);
    expect(onDeleteSubmission).toHaveBeenCalledWith('sub-test-1');
  });

  it('renders "Borrar todo" button and handles clear-all confirmation flow', () => {
    const onClearAllSubmissions = vi.fn();
    render(
      <WritingHistoryDrawer
        submissions={[mockSubmission]}
        isLoading={false}
        onSelectSubmission={vi.fn()}
        onClearAllSubmissions={onClearAllSubmissions}
        onNewWriting={vi.fn()}
      />,
    );

    // Find and click "Borrar todo" button
    const clearAllBtn = screen.getByRole('button', { name: /Borrar todo/i });
    expect(clearAllBtn).toBeDefined();
    fireEvent.click(clearAllBtn);

    // Verify confirmation modal opens with destructive warning
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText('¿Borrar todo el historial de redacciones?')).toBeDefined();
    expect(
      within(dialog).getByText(/Se eliminarán de forma permanente todas tus redacciones guardadas \(1\)/i),
    ).toBeDefined();

    // Confirm clear all
    const confirmClearBtn = within(dialog).getByRole('button', { name: 'Borrar todo el historial' });
    fireEvent.click(confirmClearBtn);

    expect(onClearAllSubmissions).toHaveBeenCalledTimes(1);
  });

  it('displays empty state when no submissions exist and hides "Borrar todo"', () => {
    render(
      <WritingHistoryDrawer
        submissions={[]}
        isLoading={false}
        onSelectSubmission={vi.fn()}
        onClearAllSubmissions={vi.fn()}
        onNewWriting={vi.fn()}
      />,
    );

    expect(screen.getByText('Sin redacciones previas')).toBeDefined();
    expect(screen.queryByRole('button', { name: /Borrar todo/i })).toBeNull();
  });
});
