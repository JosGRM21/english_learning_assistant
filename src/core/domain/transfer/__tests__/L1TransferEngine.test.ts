import { describe, it, expect, vi, beforeEach } from 'vitest';
import { L1TransferEngine } from '../services/L1TransferEngine';
import { eventBus } from '../../../../core/common/events/DomainEventBus';

describe('L1TransferEngine', () => {
  let engine: L1TransferEngine;

  beforeEach(() => {
    engine = new L1TransferEngine();
    eventBus.clear();
  });

  it('detects pro-drop dummy IT in meteorological and adjective clauses', () => {
    const text = 'Today is raining. Is important to study hard.';
    const results = engine.scanText(text);

    const proDropErrors = results.filter((r) => r.ruleCode === 'L1_PRO_DROP_DUMMY_IT');
    expect(proDropErrors.length).toBeGreaterThanOrEqual(1);
    expect(proDropErrors[0].severity).toBe('HIGH');
  });

  it('detects existential HAVE error', () => {
    const text = 'In my company have many engineers working.';
    const results = engine.scanText(text);

    const haveErrors = results.filter((r) => r.ruleCode === 'L1_EXISTENTIAL_HAVE');
    expect(haveErrors.length).toBe(1);
    expect(haveErrors[0].severity).toBe('CRITICAL');
  });

  it('detects preposition divergence (depends of, married with, good in)', () => {
    const text = 'It depends of the budget. John is married with Sarah. She is good in math.';
    const results = engine.scanText(text);

    const codes = results.map((r) => r.ruleCode);
    expect(codes).toContain('L1_PREP_DEPEND_OF');
    expect(codes).toContain('L1_PREP_MARRIED_WITH');
    expect(codes).toContain('L1_PREP_GOOD_IN');
  });

  it('detects parasite prepositions on direct transitive verbs (discuss about, call to)', () => {
    const text = 'We need to discuss about the project. Please call to my brother.';
    const results = engine.scanText(text);

    const codes = results.map((r) => r.ruleCode);
    expect(codes).toContain('L1_ZERO_PREP_DISCUSS_ABOUT');
    expect(codes).toContain('L1_ZERO_PREP_CALL_TO');
  });

  it('detects continuous aspect on stative verbs', () => {
    const text = 'Right now I am understanding the problem and I am knowing the answer.';
    const results = engine.scanText(text);

    const stative = results.filter((r) => r.ruleCode === 'L1_STATIVE_VERB_CONTINUOUS');
    expect(stative.length).toBe(2);
  });

  it('detects double negative and age expressed with have', () => {
    const text = "I didn't see nobody because I have 28 years.";
    const results = engine.scanText(text);

    const codes = results.map((r) => r.ruleCode);
    expect(codes).toContain('L1_DOUBLE_NEGATIVE');
    expect(codes).toContain('L1_AGE_HAVE_YEARS');
  });

  it('detects embedded question inversion order', () => {
    const text = 'Could you tell me where is the station?';
    const results = engine.scanText(text);

    const embedded = results.filter((r) => r.ruleCode === 'L1_EMBEDDED_QUESTION_INVERSION');
    expect(embedded.length).toBe(1);
  });

  it('builds Gemini prompt annotation string', () => {
    const text = 'It depends of the weather.';
    const results = engine.scanText(text);
    const annotation = engine.buildGeminiPromptAnnotation(results);

    expect(annotation).toContain('PRE-ANALYZED DETERMINISTIC L1 INTERFERENCE FLAGS');
    expect(annotation).toContain('L1_PREP_DEPEND_OF');
  });

  it('dispatches telemetry events to DomainEventBus', () => {
    const handler = vi.fn();
    eventBus.subscribe('ERROR_COMMITTED', handler);

    const text = 'It depends of you.';
    const results = engine.scanText(text);
    engine.emitTelemetryEvents('user_123', 'WRITING_EVALUATION', results);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user_123',
        errorTaxonomyCode: 'L1_PREP_DEPEND_OF',
        source: 'WRITING_EVALUATION',
      }),
    );
  });
});
