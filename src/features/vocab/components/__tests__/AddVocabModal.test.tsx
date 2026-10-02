import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AddVocabModal } from '../AddVocabModal';
import * as aiHook from '@/shared/hooks/useAiGateway';

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
      { id: 'key_1', label: 'Gemini Key 1', isActive: true, isPrimary: true, maskedKey: 'AIzaSy...1234' }, // notice secretKey is missing/undefined
    ]),
  };

  vi.spyOn(aiHook, 'useAiGateway').mockReturnValue({
    aiGateway: mockAiGateway as any,
    orchestrator: mockOrchestrator as any,
    defaultModel: 'gemini-3.8-flash',
    setDefaultModel: vi.fn(),
  });

  it('transitions cleanly from closed (isOpen: false) to open (isOpen: true) without Hook rule errors', () => {
    const { rerender } = render(
      <AddVocabModal isOpen={false} onClose={vi.fn()} onAddWord={vi.fn()} />
    );

    expect(screen.queryByText(/Agregar Término al Catálogo/i)).toBeNull();

    // Rerender as open: must not throw "Rendered more hooks than during previous render"
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
});
