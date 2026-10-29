import { z } from 'zod';
import {
  SocraticFeedbackResponse,
  WritingEvaluationResponse,
  SocraticClue,
  CorrectionItem,
  CANONICAL_TAXONOMY_CODES,
  isPunctuationOnlyToken,
  isPunctuationClue,
  isPunctuationCorrection,
} from '../../src/infrastructure/ai/schemas';
import { DeterministicAssertionError } from './deterministic-validators';

export class WritingDeterministicValidators {
  /**
   * Valida cota máxima de carga cognitiva (RF-WRT-06).
   * El sistema no debe saturar al alumno con más de 3 focos prioritarios de intervención.
   */
  public static assertSocraticCognitiveLoadBounds(
    response: SocraticFeedbackResponse,
    maxClues = 3,
  ): void {
    const cluesCount = response.scaffolded_clues?.length ?? 0;
    if (cluesCount > maxClues) {
      throw new DeterministicAssertionError(
        `[COGNITIVE_LOAD_EXCEEDED] Violación de carga cognitiva (RF-WRT-06): se emitieron ${cluesCount} pistas socráticas (máximo permitido: ${maxClues})`,
        {
          code: 'COGNITIVE_LOAD_EXCEEDED',
          field: 'scaffolded_clues',
          received: cluesCount,
          expected: `<= ${maxClues}`,
        },
      );
    }
  }

  /**
   * Valida la exclusión absoluta y total de signos de puntuación (RF-WRT-09).
   * Ninguna pista ni corrección puede señalar comas, puntos o apóstrofes.
   */
  public static assertNoPunctuationViolations(
    output: SocraticFeedbackResponse | WritingEvaluationResponse,
  ): void {
    // 1. Caso Fase 1: Socratic Feedback
    if ('scaffolded_clues' in output && Array.isArray(output.scaffolded_clues)) {
      output.scaffolded_clues.forEach((clue: SocraticClue, idx: number) => {
        if (isPunctuationOnlyToken(clue.highlighted_area)) {
          throw new DeterministicAssertionError(
            `[PUNCTUATION_TOKEN_IN_CLUE] Violación de regla de puntuación (RF-WRT-09): la pista [${idx}] resalta únicamente puntuación: '${clue.highlighted_area}'`,
            {
              code: 'PUNCTUATION_TOKEN_IN_CLUE',
              field: `scaffolded_clues[${idx}].highlighted_area`,
              received: clue.highlighted_area,
            },
          );
        }

        if (isPunctuationOnlyToken(clue.zpd_expected_token)) {
          throw new DeterministicAssertionError(
            `[PUNCTUATION_TOKEN_IN_ZPD] Violación de regla de puntuación (RF-WRT-09): el token esperado en pista [${idx}] es únicamente puntuación: '${clue.zpd_expected_token}'`,
            {
              code: 'PUNCTUATION_TOKEN_IN_ZPD',
              field: `scaffolded_clues[${idx}].zpd_expected_token`,
              received: clue.zpd_expected_token,
            },
          );
        }

        if (isPunctuationClue(clue)) {
          throw new DeterministicAssertionError(
            `[PUNCTUATION_QUESTION_IN_CLUE] Violación de regla de puntuación (RF-WRT-09): la pregunta de la pista [${idx}] indaga sobre puntuación/comas: '${clue.hint_question_es}'`,
            {
              code: 'PUNCTUATION_QUESTION_IN_CLUE',
              field: `scaffolded_clues[${idx}].hint_question_es`,
              received: clue.hint_question_es,
            },
          );
        }
      });
    }

    // 2. Caso Fase 2: Writing Evaluation Corrections
    if ('corrections' in output && Array.isArray(output.corrections)) {
      output.corrections.forEach((corr: CorrectionItem, idx: number) => {
        if (isPunctuationOnlyToken(corr.error_span)) {
          throw new DeterministicAssertionError(
            `[PUNCTUATION_SPAN_IN_CORRECTION] Violación de regla de puntuación (RF-WRT-09): la corrección [${idx}] tiene un error_span puramente de puntuación: '${corr.error_span}'`,
            {
              code: 'PUNCTUATION_SPAN_IN_CORRECTION',
              field: `corrections[${idx}].error_span`,
              received: corr.error_span,
            },
          );
        }

        if (isPunctuationCorrection(corr)) {
          throw new DeterministicAssertionError(
            `[PUNCTUATION_CORRECTION_DETECTED] Violación de regla de puntuación (RF-WRT-09): la corrección [${idx}] penaliza puntuación o comas: '${corr.explanation_es}'`,
            {
              code: 'PUNCTUATION_CORRECTION_DETECTED',
              field: `corrections[${idx}]`,
              received: corr,
            },
          );
        }
      });
    }
  }

  /**
   * Valida la prohibición absoluta de saludos y preámbulos conversacionales.
   */
  public static assertNoLeadingGreetingsInWriting(
    output: SocraticFeedbackResponse | WritingEvaluationResponse,
  ): void {
    const greetingRegex = /^(?:¡?hola!?|saludos\b|bienvenido[a-s]*\b|estimado[a-s]*\b|buenos días\b|buenas tardes\b|hello\b|hi\b|greetings\b|welcome\b)[,.:!\s\n-]*/i;

    if ('overall_impression_es' in output && output.overall_impression_es) {
      const match = output.overall_impression_es.trim().match(greetingRegex);
      if (match) {
        throw new DeterministicAssertionError(
          `[PROHIBITED_GREETING_DETECTED] Fórmula conversacional prohibida detectada en 'overall_impression_es': '${match[0]}'`,
          {
            code: 'PROHIBITED_GREETING_DETECTED',
            field: 'overall_impression_es',
            received: match[0],
          },
        );
      }
    }

    if ('overall_feedback_es' in output && output.overall_feedback_es) {
      const match = output.overall_feedback_es.trim().match(greetingRegex);
      if (match) {
        throw new DeterministicAssertionError(
          `[PROHIBITED_GREETING_DETECTED] Fórmula conversacional prohibida detectada en 'overall_feedback_es': '${match[0]}'`,
          {
            code: 'PROHIBITED_GREETING_DETECTED',
            field: 'overall_feedback_es',
            received: match[0],
          },
        );
      }
    }
  }

  /**
   * Valida que todos los códigos taxonómicos asignados pertenezcan estrictamente
   * a los 10 códigos oficiales canónicos (RF-WRT-09).
   */
  public static assertCanonicalTaxonomyIntegrity(
    output: SocraticFeedbackResponse | WritingEvaluationResponse,
  ): void {
    const validCodes = new Set(CANONICAL_TAXONOMY_CODES);

    if ('scaffolded_clues' in output && Array.isArray(output.scaffolded_clues)) {
      output.scaffolded_clues.forEach((clue, idx) => {
        if (!validCodes.has(clue.clue_type as any)) {
          throw new DeterministicAssertionError(
            `[INVALID_TAXONOMY_CODE] Código taxonómico no canónico en pista [${idx}]: '${clue.clue_type}'`,
            {
              code: 'INVALID_TAXONOMY_CODE',
              field: `scaffolded_clues[${idx}].clue_type`,
              received: clue.clue_type,
              expected: Array.from(validCodes),
            },
          );
        }
      });
    }

    if ('corrections' in output && Array.isArray(output.corrections)) {
      output.corrections.forEach((corr, idx) => {
        if (!validCodes.has(corr.error_type as any)) {
          throw new DeterministicAssertionError(
            `[INVALID_TAXONOMY_CODE] Código taxonómico no canónico en corrección [${idx}].error_type: '${corr.error_type}'`,
            {
              code: 'INVALID_TAXONOMY_CODE',
              field: `corrections[${idx}].error_type`,
              received: corr.error_type,
              expected: Array.from(validCodes),
            },
          );
        }
        if (!validCodes.has(corr.taxonomy_code as any)) {
          throw new DeterministicAssertionError(
            `[INVALID_TAXONOMY_CODE] Código taxonómico no canónico en corrección [${idx}].taxonomy_code: '${corr.taxonomy_code}'`,
            {
              code: 'INVALID_TAXONOMY_CODE',
              field: `corrections[${idx}].taxonomy_code`,
              received: corr.taxonomy_code,
              expected: Array.from(validCodes),
            },
          );
        }
      });
    }
  }
}
