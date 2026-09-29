import { IAiGateway } from './IAiGateway';
import {
  SocraticFeedbackResponse,
  SocraticFeedbackResponseSchema,
  WritingEvaluationResponse,
  WritingEvaluationResponseSchema,
  SocraticClue,
  CorrectionItem,
  VocabEnrichmentResponse,
  VocabEnrichmentResponseSchema,
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

  public async lookupVocabWord(word: string): Promise<VocabEnrichmentResponse> {
    await new Promise((r) => setTimeout(r, 60));

    const normalized = word.trim().toLowerCase();

    const mockEntries: Record<string, VocabEnrichmentResponse> = {
      resilient: {
        word: 'resilient',
        translationEs: 'resiliente, con capacidad de recuperación',
        definitionEn: 'Able to quickly recover or bounce back from difficult conditions or setbacks.',
        ipaGeneralAmerican: '/rɪˈzɪljənt/',
        cefrLevel: 'B2',
        partOfSpeech: 'ADJECTIVE',
        grammaticalDimension: 'CONTENT',
        exampleSentenceEn: 'She remained resilient in the face of numerous professional challenges.',
        exampleSentenceEs: 'Ella se mantuvo resiliente frente a numerosos desafíos profesionales.',
        isFalseFriend: false,
        falseFriendNote: null,
        morphologicalFamily: ['resilience', 'resiliently'],
      },
      actually: {
        word: 'actually',
        translationEs: 'en realidad, de hecho',
        definitionEn: 'Used to emphasize what is real or true, contrasting with what might be believed.',
        ipaGeneralAmerican: '/ˈæk.tʃu.ə.li/',
        cefrLevel: 'B1',
        partOfSpeech: 'ADVERB',
        grammaticalDimension: 'CONTENT',
        exampleSentenceEn: 'I thought the test was tomorrow, but it is actually today.',
        exampleSentenceEs: 'Pensé que el examen era mañana, pero en realidad es hoy.',
        isFalseFriend: true,
        falseFriendNote: "No significa 'actualmente' (en este momento), sino 'en realidad' o 'de hecho'. Para 'actualmente', usa 'currently' o 'at present'.",
        morphologicalFamily: ['actual', 'actuality'],
      },
      breakthrough: {
        word: 'breakthrough',
        translationEs: 'avance crucial, descubrimiento importante',
        definitionEn: 'An important discovery or event that helps solve a problem or make significant progress.',
        ipaGeneralAmerican: '/ˈbreɪkˌθruː/',
        cefrLevel: 'B2',
        partOfSpeech: 'NOUN',
        grammaticalDimension: 'CONTENT',
        exampleSentenceEn: 'Scientists made a major breakthrough in renewable energy storage.',
        exampleSentenceEs: 'Los científicos lograron un avance crucial en el almacenamiento de energía renovable.',
        isFalseFriend: false,
        falseFriendNote: null,
        morphologicalFamily: ['break through'],
      },
      seldom: {
        word: 'seldom',
        translationEs: 'rara vez, casi nunca',
        definitionEn: 'Not often; rarely occurring.',
        ipaGeneralAmerican: '/ˈsɛl.dəm/',
        cefrLevel: 'B2',
        partOfSpeech: 'ADVERB',
        grammaticalDimension: 'CONTENT',
        exampleSentenceEn: 'They seldom go out to restaurants during the week.',
        exampleSentenceEs: 'Ellos rara vez van a restaurantes entre semana.',
        isFalseFriend: false,
        falseFriendNote: null,
        morphologicalFamily: [],
      },
      'look forward to': {
        word: 'look forward to',
        translationEs: 'esperar con ilusión / entusiasmo',
        definitionEn: 'To feel pleased and excited about something that is going to happen.',
        ipaGeneralAmerican: '/lʊk ˈfɔːr.wərd tuː/',
        cefrLevel: 'B1',
        partOfSpeech: 'VERB',
        grammaticalDimension: 'CHUNK',
        exampleSentenceEn: 'I look forward to hearing from you soon.',
        exampleSentenceEs: 'Espero con entusiasmo saber de ti pronto.',
        isFalseFriend: false,
        falseFriendNote: null,
        morphologicalFamily: [],
      },
      embarrassed: {
        word: 'embarrassed',
        translationEs: 'avergonzado/a, apenado/a',
        definitionEn: 'Feeling ashamed, uncomfortable, or awkward with oneself or others.',
        ipaGeneralAmerican: '/ɪmˈber.əst/',
        cefrLevel: 'B1',
        partOfSpeech: 'ADJECTIVE',
        grammaticalDimension: 'CONTENT',
        exampleSentenceEn: 'He was embarrassed when he forgot his colleague’s name.',
        exampleSentenceEs: 'Él se sintió avergonzado cuando olvidó el nombre de su colega.',
        isFalseFriend: true,
        falseFriendNote: "No significa 'embarazada' (que en inglés es 'pregnant'), sino 'avergonzado/a' o 'apenado/a'.",
        morphologicalFamily: ['embarrass', 'embarrassment', 'embarrassing'],
      },
    };

    if (mockEntries[normalized]) {
      return VocabEnrichmentResponseSchema.parse(mockEntries[normalized]);
    }

    // Dynamic heuristic fallback for any arbitrary term
    const cleanWord = word.trim();
    const isMultiWord = cleanWord.includes(' ');
    const isAdverb = cleanWord.endsWith('ly');
    const isAdjective = cleanWord.endsWith('ful') || cleanWord.endsWith('able') || cleanWord.endsWith('ive') || cleanWord.endsWith('ous');
    const isVerb = cleanWord.startsWith('to ') || isMultiWord;

    const detectedPos = isVerb ? 'VERB' : isAdverb ? 'ADVERB' : isAdjective ? 'ADJECTIVE' : 'NOUN';
    const dimension = isMultiWord ? 'CHUNK' : 'CONTENT';

    const fallback: VocabEnrichmentResponse = {
      word: cleanWord,
      translationEs: `traducción de ${cleanWord}`,
      definitionEn: `A term representing ${cleanWord} used in standard English communication.`,
      ipaGeneralAmerican: `/${cleanWord.toLowerCase().replace(/[^a-z]/g, '')}/`,
      cefrLevel: 'B1',
      partOfSpeech: detectedPos,
      grammaticalDimension: dimension,
      exampleSentenceEn: `Learning how to use "${cleanWord}" correctly enhances fluency.`,
      exampleSentenceEs: `Aprender a usar "${cleanWord}" correctamente mejora la fluidez.`,
      isFalseFriend: false,
      falseFriendNote: null,
      morphologicalFamily: [],
    };

    return VocabEnrichmentResponseSchema.parse(fallback);
  }
}

