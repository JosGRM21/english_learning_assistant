import { describe, it, expect } from 'vitest';
import { MockAiGateway } from '../MockAiGateway';
import {
  SocraticFeedbackResponseSchema,
  WritingEvaluationResponseSchema,
  VocabEnrichmentResponseSchema,
  stripLeadingGreetings,
  sanitizeSocraticFeedback,
  sanitizeWritingEvaluation,
} from '../schemas';

describe('MockAiGateway', () => {
  const gateway = new MockAiGateway();

  describe('evaluateSocraticPhase1', () => {
    it('generates schema-valid socratic hints for L1 transfer errors', async () => {
      const draft = 'I am agree because it depend of my boss and actually I work hard.';
      const response = await gateway.evaluateSocraticPhase1(draft);

      // Verify schema conformance
      expect(() => SocraticFeedbackResponseSchema.parse(response)).not.toThrow();

      expect(response.error_count).toBeGreaterThanOrEqual(3);
      expect(response.allow_self_correction).toBe(true);

      const clueTypes = response.scaffolded_clues.map((c) => c.clue_type);
      expect(clueTypes).toContain('PREPOSITION');
      expect(clueTypes).toContain('AGREEMENT');
      expect(clueTypes).toContain('FALSE_FRIEND');

      // Verify hints are Socratic questions, not direct fixes
      for (const clue of response.scaffolded_clues) {
        expect(clue.hint_question_es).toContain('?');
      }
    });

    it('returns encouraging guidance when text has no targeted errors', async () => {
      const cleanDraft = 'She quickly mastered the complex grammar rules.';
      const response = await gateway.evaluateSocraticPhase1(cleanDraft);

      expect(() => SocraticFeedbackResponseSchema.parse(response)).not.toThrow();
      expect(response.scaffolded_clues.length).toBe(1);
      expect(response.scaffolded_clues[0].clue_type).toBe('COHESION_LINKERS');
    });
  });

  describe('evaluateFinalPhase2', () => {
    it('generates full CEFR evaluation, double recast, Noticing the Gap, and 4-axis rubric (RF-WRT-07/08/09)', async () => {
      const draft1 = 'I am agree and it depend of the situation.';
      const draft2 = 'I agree and it depends on the situation.';

      const response = await gateway.evaluateFinalPhase2(draft1, draft2, 'B2');

      // Verify schema conformance
      expect(() => WritingEvaluationResponseSchema.parse(response)).not.toThrow();

      expect(response.estimated_cefr).toBe('B2');
      expect(response.clean_structural_version).toBeTruthy();
      expect(response.native_recast_version).toBeTruthy();
      expect(response.noticing_the_gap_contrasts.length).toBeGreaterThanOrEqual(1);
      expect(response.rubric_scores.accuracy).toBeGreaterThan(0);
      expect(response.rubric_scores.range_and_precision).toBeGreaterThan(0);
      expect(response.rubric_scores.cohesion_and_flow).toBeGreaterThan(0);
      expect(response.rubric_scores.pragmatics_and_complexity).toBeGreaterThan(0);
    });

    it('identifies uncorrected L1 transfer errors with positive production drills (RF-ERR-02)', async () => {
      const draft1 = 'It depend of money.';
      const draft2 = 'It still depend of money actually.';

      const response = await gateway.evaluateFinalPhase2(draft1, draft2, 'B1');

      expect(response.corrections.length).toBeGreaterThanOrEqual(2);
      const prepError = response.corrections.find((c) => c.error_type === 'PREPOSITION');
      expect(prepError).toBeDefined();
      expect(prepError?.is_l1_spanish_transfer).toBe(true);
      expect(prepError?.native_reformulation).toContain('depend on');
      expect(prepError?.drill).toBeDefined();
      expect(prepError?.drill?.format).toBe('CONTEXTUAL_CLOZE');
      expect(prepError?.drill?.expected_token).toBe('on');
      // No options / zero negative priming
      expect((prepError?.drill as any)?.options).toBeUndefined();
    });

    it('gracefully normalizes and parses corrections with diverse or non-standard error_types', () => {
      const rawPayload = {
        overall_feedback_es: 'Buen intento.',
        clean_structural_version: 'I have lived here for 2 years and people are happy.',
        native_recast_version: 'Having resided here for two years, I notice the general contentment.',
        noticing_the_gap_contrasts: [],
        rubric_scores: {
          accuracy: 7.0,
          range_and_precision: 7.5,
          cohesion_and_flow: 8.0,
          pragmatics_and_complexity: 7.5,
        },
        estimated_cefr: 'B1',
        scores: { grammar: 7.0, vocabulary: 7.5, coherence: 8.0 },
        corrections: [
          {
            error_span: 'I am living here since 2 years',
            error_type: 'TENSE_ASPECT',
            taxonomy_code: 'L1_TENSE_SINCE_FOR',
            is_l1_spanish_transfer: true,
            explanation_es: 'Usa present perfect con for.',
            native_reformulation: 'I have lived here for 2 years',
          },
          {
            error_span: 'people is happy',
            error_type: 'agreement', // lowercase
            taxonomy_code: 'L1_AGREEMENT_PEOPLE',
            is_l1_spanish_transfer: true,
            explanation_es: 'People es plural.',
            native_reformulation: 'people are happy',
          },
          {
            error_span: 'make a decision',
            error_type: 'verb-tense', // hyphenated synonym
            taxonomy_code: 'L1_VERB',
            is_l1_spanish_transfer: false,
            explanation_es: 'Explicación',
            native_reformulation: 'make a decision',
          },
          {
            error_span: 'some weird error',
            error_type: 'UNKNOWN_CUSTOM_CATEGORY', // completely unknown category
            taxonomy_code: 'CUSTOM_CODE',
            is_l1_spanish_transfer: false,
            explanation_es: 'Explicación',
            native_reformulation: 'fixed',
          },
        ],
      };

      const parsed = WritingEvaluationResponseSchema.parse(rawPayload);
      expect(parsed.corrections[0].error_type).toBe('TENSE_ASPECT');
      expect(parsed.corrections[1].error_type).toBe('AGREEMENT');
      expect(parsed.corrections[2].error_type).toBe('TENSE_ASPECT');
      expect(parsed.corrections[3].error_type).toBe('AGREEMENT'); // fallback
    });

    it('gracefully accepts qualitative_recommendations_es as array of strings or single string', () => {
      const payloadWithArray = {
        overall_feedback_es: 'Buen trabajo.',
        estimated_cefr: 'B1',
        scores: { grammar: 8, vocabulary: 8, coherence: 8 },
        corrections: [],
        qualitative_recommendations_es: [
          'Presta atención a las preposiciones dependientes.',
          'Practica el uso de conectores discursivos.',
        ],
      };

      const parsed = WritingEvaluationResponseSchema.parse(payloadWithArray);
      expect(typeof parsed.qualitative_recommendations_es).toBe('string');
      expect(parsed.qualitative_recommendations_es).toContain('Presta atención');
      expect(parsed.qualitative_recommendations_es).toContain('Practica el uso');
    });
  });

  describe('lookupVocabWord', () => {
    it('returns structured enrichment for false friend word (actually)', async () => {
      const response = await gateway.lookupVocabWord('actually');

      expect(() => VocabEnrichmentResponseSchema.parse(response)).not.toThrow();
      expect(response.word).toBe('actually');
      expect(response.isFalseFriend).toBe(true);
      expect(response.falseFriendNote).toContain('actualmente');
      expect(response.ipaGeneralAmerican).toBeTruthy();
      expect(response.exampleSentenceEn).toContain('actually');
      expect(response.exampleSentenceEs).toBeTruthy();
    });

    it('returns structured enrichment for standard vocabulary (resilient)', async () => {
      const response = await gateway.lookupVocabWord('resilient');

      expect(() => VocabEnrichmentResponseSchema.parse(response)).not.toThrow();
      expect(response.word).toBe('resilient');
      expect(response.isFalseFriend).toBe(false);
      expect(response.partOfSpeech).toBe('ADJECTIVE');
      expect(response.cefrLevel).toBe('B2');
    });

    it('returns valid fallback enrichment for arbitrary uncataloged words', async () => {
      const response = await gateway.lookupVocabWord('serendipitously');

      expect(() => VocabEnrichmentResponseSchema.parse(response)).not.toThrow();
      expect(response.word).toBe('serendipitously');
      expect(response.partOfSpeech).toBe('ADVERB');
      expect(response.definitionEn).toBeTruthy();
      expect(response.translationEs).toBeTruthy();
      expect(response.exampleSentenceEn).toContain('serendipitously');
    });
  });

  describe('Greeting sanitization (stripLeadingGreetings)', () => {
    it('strips "Hola", "¡Hola!", and greeting preambles cleanly', () => {
      expect(stripLeadingGreetings('¡Hola! Has redactado un buen borrador.')).toBe('Has redactado un buen borrador.');
      expect(stripLeadingGreetings('Hola, tu texto es claro.')).toBe('Tu texto es claro.');
      expect(stripLeadingGreetings('Saludos: se han detectado observaciones.')).toBe('Se han detectado observaciones.');
      expect(stripLeadingGreetings('Bienvenido. Aquí está el análisis.')).toBe('Aquí está el análisis.');
      expect(stripLeadingGreetings('Texto directo sin saludo.')).toBe('Texto directo sin saludo.');
    });

    it('strips accidental greetings when parsing SocraticFeedbackResponseSchema', () => {
      const raw = {
        overall_impression_es: '¡Hola! Gran esfuerzo en tu primer borrador.',
        error_count: 1,
        allow_self_correction: true,
        scaffolded_clues: [
          {
            paragraph_index: 1,
            clue_type: 'PREPOSITION',
            hint_question_es: 'Hola, ¿cuál es la preposición correcta?',
            highlighted_area: 'depend of',
            sentence_context: 'It depends of the situation.',
          },
        ],
      };

      const parsed = SocraticFeedbackResponseSchema.parse(raw);
      expect(parsed.overall_impression_es).toBe('Gran esfuerzo en tu primer borrador.');
      expect(parsed.scaffolded_clues[0].hint_question_es).toBe('¿Cuál es la preposición correcta?');
    });

    it('strips accidental greetings when parsing WritingEvaluationResponseSchema', () => {
      const raw = {
        overall_feedback_es: 'Hola, has corregido la mayoría de los errores del borrador previo.',
        estimated_cefr: 'B1',
        scores: { grammar: 8, vocabulary: 8, coherence: 8 },
        successful_repairs: [],
        corrections: [],
      };

      const parsed = WritingEvaluationResponseSchema.parse(raw);
      expect(parsed.overall_feedback_es).toBe('Has corregido la mayoría de los errores del borrador previo.');
    });
  });

  describe('Punctuation exclusion sanitization (RF-WRT-09)', () => {
    it('filters out Socratic clues targeting punctuation marks or asking punctuation questions', () => {
      const mockRaw: any = {
        overall_impression_es: 'Buen avance en el texto.',
        error_count: 3,
        allow_self_correction: true,
        scaffolded_clues: [
          {
            paragraph_index: 0,
            clue_type: 'PREPOSITION',
            highlighted_area: 'depend of',
            sentence_context: 'It depends of your effort.',
            hint_question_es: '¿Qué preposición acompaña al verbo depend en inglés?',
            zpd_expected_token: 'on',
            scaffolding_level: 2,
          },
          {
            paragraph_index: 0,
            clue_type: 'SPELLING',
            highlighted_area: 'which is also good',
            sentence_context: 'I have a job, which is also good.',
            hint_question_es: 'En oraciones explicativas, ¿qué signo de puntuación en inglés suele precederlo o falta una coma?',
            zpd_expected_token: ',',
            scaffolding_level: 1,
          },
          {
            paragraph_index: 0,
            clue_type: 'AGREEMENT',
            highlighted_area: 'they was',
            sentence_context: 'They was very satisfied.',
            hint_question_es: '¿Cuál es la forma del verbo to be en pasado para el sujeto plural they?',
            zpd_expected_token: 'were',
            scaffolding_level: 2,
          },
        ],
      };

      const sanitized = sanitizeSocraticFeedback(mockRaw);
      expect(sanitized.scaffolded_clues.length).toBe(2);
      expect(sanitized.error_count).toBe(2);
      expect(sanitized.scaffolded_clues.some((c) => c.zpd_expected_token === ',')).toBe(false);
      expect(sanitized.scaffolded_clues[0].clue_type).toBe('PREPOSITION');
      expect(sanitized.scaffolded_clues[1].clue_type).toBe('AGREEMENT');
    });

    it('filters out corrections targeting commas, periods, or punctuation splices', () => {
      const mockRaw: any = {
        overall_feedback_es: 'Análisis final completado.',
        estimated_cefr: 'B2',
        rubric_scores: {
          accuracy: 8,
          range_and_precision: 8,
          cohesion_and_flow: 8,
          pragmatics_and_complexity: 8,
        },
        scores: { grammar: 8, vocabulary: 8, coherence: 8 },
        corrections: [
          {
            error_span: 'depend of',
            error_type: 'PREPOSITION',
            taxonomy_code: 'L1_PREPOSITION',
            is_l1_spanish_transfer: true,
            explanation_es: 'En inglés se dice depend on.',
            native_reformulation: 'depend on',
          },
          {
            error_span: 'which is',
            error_type: 'SPELLING',
            taxonomy_code: 'PUNCTUATION',
            is_l1_spanish_transfer: false,
            explanation_es: 'Falta una coma para separar la cláusula relativa explicativa.',
            native_reformulation: ', which is',
          },
          {
            error_span: ';',
            error_type: 'COHESION_LINKERS',
            taxonomy_code: 'PUNCTUATION_SEMICOLON',
            is_l1_spanish_transfer: false,
            explanation_es: 'Evita el punto y coma.',
            native_reformulation: '.',
          },
        ],
      };

      const sanitized = sanitizeWritingEvaluation(mockRaw);
      expect(sanitized.corrections.length).toBe(1);
      expect(sanitized.corrections[0].error_span).toBe('depend of');
      expect(sanitized.corrections[0].error_type).toBe('PREPOSITION');
    });
  });
});


