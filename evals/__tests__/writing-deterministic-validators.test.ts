import { describe, it, expect } from 'vitest';
import { WritingDeterministicValidators } from '../assertions/writing-deterministic-validators';
import { DeterministicAssertionError } from '../assertions/deterministic-validators';
import {
  SocraticFeedbackResponse,
  WritingEvaluationResponse,
} from '../../src/infrastructure/ai/schemas';

describe('WritingDeterministicValidators (Capa 1: $0.00, < 1ms)', () => {
  describe('assertSocraticCognitiveLoadBounds (RF-WRT-06)', () => {
    it('aprueba cuando las pistas socráticas no superan la cota de 3', () => {
      const response: SocraticFeedbackResponse = {
        overall_impression_es: 'Buen trabajo.',
        error_count: 2,
        allow_self_correction: true,
        scaffolded_clues: [
          {
            paragraph_index: 1,
            clue_type: 'AGREEMENT',
            hint_question_es: 'Revisa el verbo.',
            highlighted_area: 'work',
            sentence_context: 'He work hard.',
            is_l1_spanish_transfer: false,
          },
          {
            paragraph_index: 1,
            clue_type: 'PREPOSITION',
            hint_question_es: 'Revisa la preposición.',
            highlighted_area: 'depend of',
            sentence_context: 'It depend of that.',
            is_l1_spanish_transfer: true,
          },
        ],
      };

      expect(() => WritingDeterministicValidators.assertSocraticCognitiveLoadBounds(response, 3)).not.toThrow();
    });

    it('falla con COGNITIVE_LOAD_EXCEEDED si se generan más de 3 pistas', () => {
      const response: SocraticFeedbackResponse = {
        overall_impression_es: 'Buen trabajo.',
        error_count: 4,
        allow_self_correction: true,
        scaffolded_clues: [
          { paragraph_index: 1, clue_type: 'AGREEMENT', hint_question_es: 'Q1', highlighted_area: 'w1', sentence_context: 's1', is_l1_spanish_transfer: false },
          { paragraph_index: 1, clue_type: 'PREPOSITION', hint_question_es: 'Q2', highlighted_area: 'w2', sentence_context: 's2', is_l1_spanish_transfer: false },
          { paragraph_index: 1, clue_type: 'FALSE_FRIEND', hint_question_es: 'Q3', highlighted_area: 'w3', sentence_context: 's3', is_l1_spanish_transfer: false },
          { paragraph_index: 1, clue_type: 'WORD_ORDER', hint_question_es: 'Q4', highlighted_area: 'w4', sentence_context: 's4', is_l1_spanish_transfer: false },
        ],
      };

      expect(() => WritingDeterministicValidators.assertSocraticCognitiveLoadBounds(response, 3))
        .toThrowError(DeterministicAssertionError);

      try {
        WritingDeterministicValidators.assertSocraticCognitiveLoadBounds(response, 3);
      } catch (err: any) {
        expect(err.code).toBe('COGNITIVE_LOAD_EXCEEDED');
        expect(err.received).toBe(4);
      }
    });
  });

  describe('assertNoPunctuationViolations (RF-WRT-09: Exclusión Absoluta de Puntuación)', () => {
    it('rechaza pistas socráticas cuya área resaltada es únicamente un signo de puntuación', () => {
      const response: SocraticFeedbackResponse = {
        overall_impression_es: 'Observación.',
        error_count: 1,
        allow_self_correction: true,
        scaffolded_clues: [
          {
            paragraph_index: 1,
            clue_type: 'COHESION_LINKERS',
            hint_question_es: 'Revisa este elemento.',
            highlighted_area: ',',
            sentence_context: 'However, we went.',
            is_l1_spanish_transfer: false,
          },
        ],
      };

      expect(() => WritingDeterministicValidators.assertNoPunctuationViolations(response))
        .toThrowError(/PUNCTUATION_TOKEN_IN_CLUE/);
    });

    it('rechaza pistas socráticas cuyo zpd_expected_token es únicamente un signo de puntuación', () => {
      const response: SocraticFeedbackResponse = {
        overall_impression_es: 'Observación.',
        error_count: 1,
        allow_self_correction: true,
        scaffolded_clues: [
          {
            paragraph_index: 1,
            clue_type: 'SPELLING',
            hint_question_es: 'Falta algo al final.',
            highlighted_area: 'end',
            sentence_context: 'The end',
            is_l1_spanish_transfer: false,
            zpd_expected_token: '.',
          },
        ],
      };

      expect(() => WritingDeterministicValidators.assertNoPunctuationViolations(response))
        .toThrowError(/PUNCTUATION_TOKEN_IN_ZPD/);
    });

    it('rechaza preguntas socráticas que indagan sobre comas o signos de puntuación', () => {
      const response: SocraticFeedbackResponse = {
        overall_impression_es: 'Observación.',
        error_count: 1,
        allow_self_correction: true,
        scaffolded_clues: [
          {
            paragraph_index: 1,
            clue_type: 'COHESION_LINKERS',
            hint_question_es: '¿No crees que falta una coma aquí?',
            highlighted_area: 'However',
            sentence_context: 'However we left.',
            is_l1_spanish_transfer: false,
          },
        ],
      };

      expect(() => WritingDeterministicValidators.assertNoPunctuationViolations(response))
        .toThrowError(/PUNCTUATION_QUESTION_IN_CLUE/);
    });

    it('rechaza correcciones en Fase 2 cuyo error_span es puramente puntuación', () => {
      const response: WritingEvaluationResponse = {
        overall_feedback_es: 'Evaluación.',
        clean_structural_version: 'Text.',
        native_recast_version: 'Text.',
        noticing_the_gap_contrasts: [],
        rubric_scores: { accuracy: 8, range_and_precision: 8, cohesion_and_flow: 8, pragmatics_and_complexity: 8 },
        estimated_cefr: 'B1',
        successful_repairs: [],
        corrections: [
          {
            error_span: ';',
            error_type: 'COHESION_LINKERS',
            taxonomy_code: 'COHESION_LINKERS',
            is_l1_spanish_transfer: false,
            explanation_es: 'Usa punto y coma.',
            native_reformulation: ';',
            original_sentence: 'A; B',
          },
        ],
      };

      expect(() => WritingDeterministicValidators.assertNoPunctuationViolations(response))
        .toThrowError(/PUNCTUATION_SPAN_IN_CORRECTION/);
    });
  });

  describe('assertNoLeadingGreetingsInWriting', () => {
    it('rechaza preámbulos conversacionales como Hola o Saludos en redacción', () => {
      const response: SocraticFeedbackResponse = {
        overall_impression_es: '¡Hola! Aquí tienes algunas observaciones sobre tu texto.',
        error_count: 0,
        allow_self_correction: true,
        scaffolded_clues: [],
      };

      expect(() => WritingDeterministicValidators.assertNoLeadingGreetingsInWriting(response))
        .toThrowError(/PROHIBITED_GREETING_DETECTED/);
    });
  });

  describe('assertCanonicalTaxonomyIntegrity (RF-WRT-09)', () => {
    it('rechaza códigos inventados o no canónicos', () => {
      const response: SocraticFeedbackResponse = {
        overall_impression_es: 'Análisis.',
        error_count: 1,
        allow_self_correction: true,
        scaffolded_clues: [
          {
            paragraph_index: 1,
            clue_type: 'PUNCTUATION_ERROR' as any,
            hint_question_es: 'Pregunta.',
            highlighted_area: 'word',
            sentence_context: 'Context.',
            is_l1_spanish_transfer: false,
          },
        ],
      };

      expect(() => WritingDeterministicValidators.assertCanonicalTaxonomyIntegrity(response))
        .toThrowError(/INVALID_TAXONOMY_CODE/);
    });
  });
});
