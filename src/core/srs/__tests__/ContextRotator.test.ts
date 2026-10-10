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

  describe('selectGraduatedContext (RF-VOC-09 & RF-SRS-04)', () => {
    const graduatedContexts: VocabContextExample[] = [
      {
        id: 'ctx-basic',
        sentenceEn: 'I need to thrive in school.',
        sentenceEs: 'Necesito prosperar en la escuela.',
        clozeTarget: 'thrive',
        cefrLevel: 'A2',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'ctx-advanced',
        sentenceEn: 'Innovative tech startups thrive under competitive conditions.',
        sentenceEs: 'Las startups tecnológicas innovadoras prosperan en condiciones competitivas.',
        clozeTarget: 'thrive',
        cefrLevel: 'B2',
        createdAt: new Date().toISOString(),
      },
    ];

    it('selects basic sentence (A2-B1) on even review repetitions', () => {
      const selected = rotator.selectGraduatedContext(graduatedContexts, 0);
      expect(selected.id).toBe('ctx-basic');
      expect(selected.cefrLevel).toBe('A2');

      const selectedRep2 = rotator.selectGraduatedContext(graduatedContexts, 2);
      expect(selectedRep2.id).toBe('ctx-basic');
    });

    it('selects advanced sentence (B2+) on odd review repetitions', () => {
      const selected = rotator.selectGraduatedContext(graduatedContexts, 1);
      expect(selected.id).toBe('ctx-advanced');
      expect(selected.cefrLevel).toBe('B2');

      const selectedRep3 = rotator.selectGraduatedContext(graduatedContexts, 3);
      expect(selectedRep3.id).toBe('ctx-advanced');
    });
  });
});

