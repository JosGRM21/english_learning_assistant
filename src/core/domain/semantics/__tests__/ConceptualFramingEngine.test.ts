import { describe, it, expect } from 'vitest';
import { conceptualFramingEngine } from '../services/ConceptualFramingEngine';

describe('ConceptualFramingEngine (Talmy & Slobin Thinking for Speaking)', () => {
  it('provides a catalog of satellite-framed motion events converting Latinate static verbs', () => {
    const catalog = conceptualFramingEngine.getCatalog();
    expect(catalog.length).toBeGreaterThanOrEqual(5);

    // Verify key motion verbs: rush into, tiptoe out, march across, trudge up
    const mannerVerbs = catalog.map((i) => i.mannerVerb);
    expect(mannerVerbs).toContain('rush');
    expect(mannerVerbs).toContain('tiptoe');
    expect(mannerVerbs).toContain('march');
    expect(mannerVerbs).toContain('trudge');
  });

  it('evaluates correct selection of native satellite-framed phrasing', () => {
    const result = conceptualFramingEngine.evaluateSelection('sm_01', 0); // "He rushed into the room"
    expect(result.isCorrect).toBe(true);
    expect(result.explanationEs).toContain('Satellite-Framed');
    expect(result.explanationEs).toContain('rush');
  });

  it('rejects un-idiomatic Latinate static translation', () => {
    const result = conceptualFramingEngine.evaluateSelection('sm_01', 1); // "He entered quickly to the room"
    expect(result.isCorrect).toBe(false);
    expect(result.explanationEs).toContain('El español recurre a verbos genéricos latinos');
  });
});
