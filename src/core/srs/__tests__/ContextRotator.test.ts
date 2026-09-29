import { describe, it, expect } from 'vitest';
import { ContextRotator } from '../ContextRotator';
import { VocabContextExample } from '../../types/vocab';

describe('ContextRotator', () => {
  const rotator = new ContextRotator();

  const mockContexts: VocabContextExample[] = [
    {
      id: 'ctx-1',
      sentenceEn: 'I rely on my team.',
      sentenceEs: 'Confío en mi equipo.',
      clozeTarget: 'rely on',
      cefrLevel: 'B1',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'ctx-2',
      sentenceEn: 'You can always count on us.',
      sentenceEs: 'Siempre puedes contar con nosotros.',
      clozeTarget: 'count on',
      cefrLevel: 'B1',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'ctx-3',
      sentenceEn: 'Success depends on hard work.',
      sentenceEs: 'El éxito depende del trabajo duro.',
      clozeTarget: 'depends on',
      cefrLevel: 'B1',
      createdAt: new Date().toISOString(),
    },
  ];

  it('throws error when no contexts are registered', () => {
    expect(() => rotator.selectNextContext([])).toThrow();
  });

  it('returns the only context when available count is 1', () => {
    const single = [mockContexts[0]];
    const selected = rotator.selectNextContext(single, 'ctx-1');
    expect(selected.id).toBe('ctx-1');
  });

  it('never immediately repeats the last context shown when alternatives exist', () => {
    for (let i = 0; i < 20; i++) {
      const selected = rotator.selectNextContext(mockContexts, 'ctx-1');
      expect(selected.id).not.toBe('ctx-1');
      expect(['ctx-2', 'ctx-3']).toContain(selected.id);
    }
  });
});
