import { IAiGateway } from './IAiGateway';
import {
  SocraticFeedbackResponse,
  SocraticFeedbackResponseSchema,
  WritingEvaluationResponse,
  WritingEvaluationResponseSchema,
  SocraticClue,
  CorrectionItem,
} from './schemas';

export class MockAiGateway implements IAiGateway {
  public async evaluateSocraticPhase1(userText: string): Promise<SocraticFeedbackResponse> {
    // Artificial slight latency simulation (sub-50ms in mock)
    await new Promise((r) => setTimeout(r, 40));

    const clues: SocraticClue[] = [];
    const lower = userText.toLowerCase();

    if (lower.includes('depend of') || lower.includes('depends of')) {
      clues.push({
        paragraph_index: 1,
        clue_type: 'PREPOSITION',
        hint_question_es:
          "Revisa el verbo 'depend': en español decimos 'depende de', pero en inglés siempre se apoya sobre una superficie figurada. ¿Cuál es esa preposición?",
        highlighted_area: lower.includes('depends of') ? 'depends of' : 'depend of',
      });
    }

    if (lower.includes('am agree') || lower.includes('is agree') || lower.includes('are agree')) {
      clues.push({
        paragraph_index: 1,
        clue_type: 'AGREEMENT',
        hint_question_es:
          "En inglés, 'agree' ya es una acción/verbo por sí mismo. ¿Es necesario añadir el verbo 'to be' antes de él?",
        highlighted_area: lower.includes('am agree')
          ? 'am agree'
          : lower.includes('is agree')
            ? 'is agree'
            : 'are agree',
      });
    }

    if (lower.includes('actually')) {
      clues.push({
        paragraph_index: 1,
        clue_type: 'FALSE_FRIEND',
        hint_question_es:
          "'Actually' es un falso amigo muy engañoso. ¿Recuerdas qué adverbio usamos en inglés para expresar 'en este momento/en la actualidad'?",
        highlighted_area: 'actually',
      });
    }

    if (lower.match(/\bhave\s+\d+\s+years\b/)) {
      clues.push({
        paragraph_index: 1,
        clue_type: 'TENSE_ASPECT',
        hint_question_es:
          "¿Recuerdas cómo conceptualiza el idioma inglés la edad? ¿Se 'tiene' la edad o se 'es' de esa edad?",
        highlighted_area: 'have ... years',
      });
    }

    // Default encouragement if text has no targeted errors
    if (clues.length === 0) {
      clues.push({
        paragraph_index: 1,
        clue_type: 'WORD_CHOICE',
        hint_question_es:
          "Tu idea se entiende claramente. ¿Podrías enriquecer esta oración utilizando un conector formal como 'furthermore' o 'on the other hand'?",
        highlighted_area: userText.slice(0, Math.min(25, userText.length)),
      });
    }

    const result: SocraticFeedbackResponse = {
      overall_impression_es:
        clues.length > 1
          ? `¡Gran esfuerzo! Tu mensaje es comprensible y comunicativo. Hemos detectado ${clues.length} puntos donde la influencia directa del español puede mejorarse. Lee las pistas reflexivas e intenta auto-corregir tu texto.`
          : '¡Excelente redacción! Tu mensaje es claro y fluido.',
      error_count: clues.length,
      allow_self_correction: true,
      scaffolded_clues: clues,
    };

    return SocraticFeedbackResponseSchema.parse(result);
  }

  public async evaluateFinalPhase2(
    _draft1: string,
    draft2: string,
    cefrTarget = 'B1',
  ): Promise<WritingEvaluationResponse> {
    await new Promise((r) => setTimeout(r, 60));

    const corrections: CorrectionItem[] = [];
    const lower2 = draft2.toLowerCase();

    if (lower2.includes('depends of') || lower2.includes('depend of')) {
      corrections.push({
        error_span: lower2.includes('depends of') ? 'depends of' : 'depend of',
        error_type: 'PREPOSITION',
        taxonomy_code: 'L1_PREP_DEPEND_ON',
        is_l1_spanish_transfer: true,
        explanation_es:
          "En español decimos 'depende de', pero en inglés el verbo 'depend' rige obligatoriamente la preposición 'on'.",
        native_reformulation: lower2.includes('depends of') ? 'depends on' : 'depend on',
      });
    }

    if (lower2.includes('am agree') || lower2.includes('are agree')) {
      corrections.push({
        error_span: lower2.includes('am agree') ? 'am agree' : 'are agree',
        error_type: 'GRAMMAR',
        taxonomy_code: 'L1_SYNTAX_AM_AGREE',
        is_l1_spanish_transfer: true,
        explanation_es:
          "En español usamos 'estar de acuerdo', pero en inglés 'agree' ya funciona como verbo sin auxiliar 'to be'.",
        native_reformulation: lower2.includes('am agree') ? 'agree' : 'agree',
      });
    }

    if (lower2.includes('actually')) {
      corrections.push({
        error_span: 'actually',
        error_type: 'FALSE_FRIEND',
        taxonomy_code: 'LEX_FALSE_FRIEND_ACTUALLY',
        is_l1_spanish_transfer: true,
        explanation_es:
          "'Actually' significa 'en realidad' o 'de hecho'. Para decir 'en estos momentos' usa 'currently' o 'right now'.",
        native_reformulation: 'currently / at present',
      });
    }

    const estimatedCefr = (['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].includes(cefrTarget)
      ? cefrTarget
      : 'B1') as WritingEvaluationResponse['estimated_cefr'];

    const result: WritingEvaluationResponse = {
      overall_feedback_es:
        corrections.length === 0
          ? '¡Felicitaciones! Has corregido exitosamente todos los puntos observados en el andamiaje socrático. Tu texto final suena natural y gramaticalmente preciso.'
          : 'Buen avance en tu segundo borrador. Observa el desglose comparativo y la reformulación nativa para consolidar las diferencias con el español.',
      estimated_cefr: estimatedCefr,
      scores: {
        grammar: corrections.length === 0 ? 9.5 : 7.0,
        vocabulary: 8.0,
        coherence: 8.5,
      },
      corrections,
      micro_challenge: {
        question_es: "¿Cuál es la preposición correcta que acompaña al verbo 'depend'?",
        sentence_with_blank: 'Our future success will depend ___ our dedication.',
        options: ['of', 'on', 'in', 'from'],
        correct_option_index: 1,
        explanation_es: "¡Exacto! En inglés siempre decimos 'depend on' o 'rely on'.",
      },
    };

    return WritingEvaluationResponseSchema.parse(result);
  }
}
