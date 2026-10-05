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
  public async evaluateSocraticPhase1(
    userText: string,
    _cefrTarget = 'B1',
  ): Promise<SocraticFeedbackResponse> {
    // Artificial slight latency simulation (sub-50ms in mock)
    await new Promise((r) => setTimeout(r, 40));

    const clues: SocraticClue[] = [];
    const lower = userText.toLowerCase();

    if (lower.includes('depend of') || lower.includes('depends of')) {
      const area = lower.includes('depends of') ? 'depends of' : 'depend of';
      clues.push({
        paragraph_index: 1,
        clue_type: 'PREPOSITION',
        hint_question_es:
          "Revisa el verbo 'depend': en español decimos 'depende de', pero en inglés siempre se apoya sobre una superficie figurada. ¿Cuál es esa preposición?",
        highlighted_area: area,
        sentence_context: userText.split(/(?<=[.!?])\s+/).find((s) => s.toLowerCase().includes('depend')) ?? userText,
        zpd_contrastive_es:
          'En español usamos "de" ("depende de ti"), pero en inglés el verbo "depend" rige obligatoriamente la preposición dependiente fija "on" (o formalmente "upon").',
        zpd_cloze_sentence: `${area.split(' ')[0]} [ ___ ] the circumstances`,
        zpd_expected_token: 'on',
        zpd_native_model: `${area.split(' ')[0]} on the circumstances (Colocación nativa: depend on).`,
      });
    }

    if (lower.includes('am agree') || lower.includes('is agree') || lower.includes('are agree')) {
      const area = lower.includes('am agree')
        ? 'am agree'
        : lower.includes('is agree')
          ? 'is agree'
          : 'are agree';
      clues.push({
        paragraph_index: 1,
        clue_type: 'AGREEMENT',
        hint_question_es:
          "En inglés, 'agree' ya es una acción/verbo por sí mismo. ¿Es necesario añadir el verbo 'to be' antes de él?",
        highlighted_area: area,
        sentence_context: userText.split(/(?<=[.!?])\s+/).find((s) => s.toLowerCase().includes('agree')) ?? userText,
        zpd_contrastive_es:
          'En español usamos la perífrasis "estar de acuerdo", pero en inglés "agree" es un verbo directo por sí solo. Por lo tanto, no lleva verbo "to be". Decimos "I agree", nunca "I am agree".',
        zpd_cloze_sentence: 'I [ ___ ] with your proposal completely.',
        zpd_expected_token: 'agree',
        zpd_native_model: 'I agree with your proposal completely (Uso nativo: agree with).',
      });
    }

    if (lower.includes('actually')) {
      clues.push({
        paragraph_index: 1,
        clue_type: 'FALSE_FRIEND',
        hint_question_es:
          "'Actually' es un falso amigo muy engañoso. ¿Recuerdas qué adverbio usamos en inglés para expresar 'en este momento/en la actualidad'?",
        highlighted_area: 'actually',
        sentence_context: userText.split(/(?<=[.!?])\s+/).find((s) => s.toLowerCase().includes('actually')) ?? userText,
        zpd_contrastive_es:
          '"Actually" no significa "actualmente", sino "en realidad" o "de hecho". Para referirte al tiempo presente o actual en inglés se utiliza "currently", "nowadays" o "at present".',
        zpd_cloze_sentence: '[ ___ ], I am working on several high-priority tasks.',
        zpd_expected_token: 'currently',
        zpd_native_model: 'Currently, I am working on several high-priority tasks (Uso nativo: "currently" en vez de "actually").',
      });
    }

    const haveMatch = userText.match(/\bhave\s+\d+\s+years\b/i);
    if (haveMatch) {
      clues.push({
        paragraph_index: 1,
        clue_type: 'TENSE_ASPECT',
        hint_question_es:
          "¿Recuerdas cómo conceptualiza el idioma inglés la edad? ¿Se 'tiene' la edad o se 'es' de esa edad?",
        highlighted_area: haveMatch[0],
        sentence_context: userText.split(/(?<=[.!?])\s+/).find((s) => s.toLowerCase().includes('years')) ?? userText,
        zpd_contrastive_es:
          'En español "tenemos" años (posesión de tiempo), pero en la lingüística cognitiva anglosajona la edad es un estado de existencia que se expresa con el verbo "to be" ("I am 28 years old").',
        zpd_cloze_sentence: 'I [ ___ ] 25 years old.',
        zpd_expected_token: 'am',
        zpd_native_model: 'I am 25 years old (Uso nativo: estructura to be + edad).',
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
        sentence_context: userText.split(/(?<=[.!?])\s+/)[0] || userText,
        zpd_contrastive_es:
          'Para alcanzar niveles intermedios-avanzados (B2/C1), conectar ideas con discourse markers enriquece la coherencia textual.',
        zpd_cloze_sentence: '[ ___ ], this approach guarantees optimal performance.',
        zpd_expected_token: 'furthermore',
        zpd_native_model: 'Furthermore, this approach guarantees optimal performance.',
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
    draft1: string,
    draft2: string,
    cefrTarget = 'B1',
  ): Promise<WritingEvaluationResponse> {
    await new Promise((r) => setTimeout(r, 60));

    const corrections: CorrectionItem[] = [];
    const successful_repairs = [];
    const lower1 = draft1.toLowerCase();
    const lower2 = draft2.toLowerCase();

    // Check learner uptake / auto-repairs
    if ((lower1.includes('depends of') || lower1.includes('depend of')) && (lower2.includes('depends on') || lower2.includes('depend on'))) {
      successful_repairs.push({
        original_snippet: lower1.includes('depends of') ? 'depends of' : 'depend of',
        corrected_snippet: lower2.includes('depends on') ? 'depends on' : 'depend on',
        praise_es: "¡Excelente! Corregiste la preposición fija a 'depend on' de forma autónoma.",
      });
    }

    if ((lower1.includes('am agree') || lower1.includes('are agree')) && (lower2.includes('agree') && !lower2.includes('am agree') && !lower2.includes('are agree'))) {
      successful_repairs.push({
        original_snippet: lower1.includes('am agree') ? 'am agree' : 'are agree',
        corrected_snippet: 'agree',
        praise_es: "¡Muy bien! Eliminaste el auxiliar innecesario y usaste 'agree' como verbo pleno.",
      });
    }

    if (lower1.includes('actually') && (lower2.includes('currently') || lower2.includes('right now') || lower2.includes('at present'))) {
      successful_repairs.push({
        original_snippet: 'actually',
        corrected_snippet: lower2.includes('currently') ? 'currently' : 'right now',
        praise_es: "¡Gran precisión! Evitaste el falso amigo y utilizaste el adverbio temporal correcto.",
      });
    }

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
          ? '¡Felicitaciones! Has corregido exitosamente todas las observaciones de tu borrador. Tu texto final suena natural y gramaticalmente preciso.'
          : 'Buen avance en tu segundo borrador. Observa el desglose comparativo y la reformulación nativa para consolidar las diferencias con el español.',
      estimated_cefr: estimatedCefr,
      scores: {
        grammar: corrections.length === 0 ? 9.5 : 7.0,
        vocabulary: 8.0,
        coherence: 8.5,
      },
      successful_repairs,
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

    // Typo / Spelling correction mocks
    if (normalized === 'acomodation') {
      return VocabEnrichmentResponseSchema.parse({
        word: 'accommodation',
        translationEs: 'alojamiento, hospedaje',
        definitionEn: 'A room or building in which someone may live, stay, or reside.',
        ipaGeneralAmerican: '/əˌkɑː.məˈdeɪ.ʃən/',
        cefrLevel: 'B1',
        partOfSpeech: 'NOUN',
        grammaticalDimension: 'CONTENT',
        domainCategory: 'Viajes & Hospedaje',
        exampleSentenceEn: 'The hotel provides comfortable accommodation for business travellers.',
        exampleSentenceEs: 'El hotel ofrece un alojamiento confortable para viajeros de negocios.',
        isFalseFriend: false,
        falseFriendNote: null,
        morphologicalFamily: ['accommodate', 'accommodating'],
        structuredFamily: {
          nouns: ['accommodation'],
          verbs: ['accommodate'],
          adjectives: ['accommodating'],
          adverbs: [],
        },
        spellingCorrection: {
          hasCorrection: true,
          originalInput: 'acomodation',
          correctedWord: 'accommodation',
          explanationEs: "Doble 'c' y doble 'm' en la grafía estándar en inglés.",
        },
        isValidEnglishWord: true,
        senses: [],
      });
    }

    if (normalized === 'definitly') {
      return VocabEnrichmentResponseSchema.parse({
        word: 'definitely',
        translationEs: 'definitivamente, sin duda',
        definitionEn: 'Without any doubt; certainly and clearly.',
        ipaGeneralAmerican: '/ˈdɛf.ə.nət.li/',
        cefrLevel: 'B1',
        partOfSpeech: 'ADVERB',
        grammaticalDimension: 'CONTENT',
        domainCategory: 'Comunicación Diaria',
        exampleSentenceEn: 'I will definitely join you for the project presentation tomorrow.',
        exampleSentenceEs: 'Definitivamente me uniré a ti para la presentación del proyecto mañana.',
        isFalseFriend: false,
        falseFriendNote: null,
        morphologicalFamily: ['define', 'definite', 'definition'],
        structuredFamily: {
          nouns: ['definition'],
          verbs: ['define'],
          adjectives: ['definite'],
          adverbs: ['definitely'],
        },
        spellingCorrection: {
          hasCorrection: true,
          originalInput: 'definitly',
          correctedWord: 'definitely',
          explanationEs: "Se escribe con 'i' (-ite-), no con 'a'.",
        },
        isValidEnglishWord: true,
        senses: [],
      });
    }

    const mockEntries: Record<string, VocabEnrichmentResponse> = {
      resilient: {
        word: 'resilient',
        translationEs: 'resiliente, con capacidad de recuperación',
        definitionEn: 'Able to quickly recover or bounce back from difficult conditions or setbacks.',
        ipaGeneralAmerican: '/rɪˈzɪljənt/',
        cefrLevel: 'B2',
        partOfSpeech: 'ADJECTIVE',
        grammaticalDimension: 'CONTENT',
        domainCategory: 'Psicología & Personalidad',
        exampleSentenceEn: 'She remained resilient in the face of numerous professional challenges.',
        exampleSentenceEs: 'Ella se mantuvo resiliente frente a numerosos desafíos profesionales.',
        isFalseFriend: false,
        falseFriendNote: null,
        morphologicalFamily: ['resilience', 'resiliently'],
        structuredFamily: {
          nouns: ['resilience'],
          verbs: [],
          adjectives: ['resilient'],
          adverbs: ['resiliently'],
        },
        senses: [],
        isValidEnglishWord: true,
      },
      run: {
        word: 'run',
        translationEs: 'correr, desplazarse rápidamente a pie',
        definitionEn: 'To move along rapidly on foot in a continuous motion.',
        ipaGeneralAmerican: '/rʌn/',
        cefrLevel: 'A1',
        partOfSpeech: 'VERB',
        grammaticalDimension: 'CONTENT',
        domainCategory: 'Deporte & Movimiento Físico',
        exampleSentenceEn: 'I try to run five kilometers in the park every morning.',
        exampleSentenceEs: 'Intento correr cinco kilómetros en el parque cada mañana.',
        isFalseFriend: false,
        falseFriendNote: null,
        morphologicalFamily: ['runner', 'running'],
        structuredFamily: {
          nouns: ['runner', 'running'],
          verbs: ['run'],
          adjectives: [],
          adverbs: [],
        },
        verbTenses: {
          infinitive: 'run',
          pastSimple: 'ran',
          pastParticiple: 'run',
          thirdPersonPresent: 'runs',
          gerund: 'running',
          isIrregular: true,
          edPhoneticEnding: null,
        },
        senses: [
          {
            id: 'sns_run_business',
            domainCategory: 'Empresas & Negocios',
            translationEs: 'administrar, dirigir, gestionar',
            definitionEn: 'To be in charge of; manage or organize a company, business, or project.',
            partOfSpeech: 'VERB',
            exampleSentenceEn: 'She runs a successful international software consultancy.',
            exampleSentenceEs: 'Ella dirige una exitosa consultora de software internacional.',
            cefrLevel: 'B2',
          },
          {
            id: 'sns_run_transport',
            domainCategory: 'Transporte & Horarios',
            translationEs: 'operar, circular con regularidad',
            definitionEn: 'To operate or travel along a scheduled route at set times.',
            partOfSpeech: 'VERB',
            exampleSentenceEn: 'The direct train to the capital runs every twenty minutes.',
            exampleSentenceEs: 'El tren directo a la capital circula cada veinte minutos.',
            cefrLevel: 'B1',
          },
        ],
        isValidEnglishWord: true,
      },
      break: {
        word: 'break',
        translationEs: 'romper, quebrar, fracturar',
        definitionEn: 'To separate into pieces as a result of a blow, shock, or strain.',
        ipaGeneralAmerican: '/breɪk/',
        cefrLevel: 'A2',
        partOfSpeech: 'VERB',
        grammaticalDimension: 'CONTENT',
        domainCategory: 'Sentido Físico',
        exampleSentenceEn: 'Be careful not to break the delicate glass vase.',
        exampleSentenceEs: 'Ten cuidado de no romper el delicado jarrón de cristal.',
        isFalseFriend: false,
        falseFriendNote: null,
        morphologicalFamily: ['breakage', 'breakable', 'unbreakable'],
        structuredFamily: {
          nouns: ['breakage', 'break'],
          verbs: ['break'],
          adjectives: ['breakable', 'unbreakable'],
          adverbs: [],
        },
        verbTenses: {
          infinitive: 'break',
          pastSimple: 'broke',
          pastParticiple: 'broken',
          thirdPersonPresent: 'breaks',
          gerund: 'breaking',
          isIrregular: true,
          edPhoneticEnding: null,
        },
        senses: [
          {
            id: 'sns_break_pause',
            domainCategory: 'Trabajo & Descanso',
            translationEs: 'pausa, descanso, receso',
            definitionEn: 'A pause or short interval during work, study, or an activity.',
            partOfSpeech: 'NOUN',
            exampleSentenceEn: 'Let us take a brief ten-minute coffee break before resuming.',
            exampleSentenceEs: 'Hagamos una breve pausa de diez minutos para el café antes de reanudar.',
            cefrLevel: 'A2',
          },
        ],
        isValidEnglishWord: true,
      },
      actually: {
        word: 'actually',
        translationEs: 'en realidad, de hecho',
        definitionEn: 'Used to emphasize what is real or true, contrasting with what might be believed.',
        ipaGeneralAmerican: '/ˈæk.tʃu.ə.li/',
        cefrLevel: 'B1',
        partOfSpeech: 'ADVERB',
        grammaticalDimension: 'CONTENT',
        domainCategory: 'Discurso & Conversación',
        exampleSentenceEn: 'I thought the test was tomorrow, but it is actually today.',
        exampleSentenceEs: 'Pensé que el examen era mañana, pero en realidad es hoy.',
        isFalseFriend: true,
        falseFriendNote: "No significa 'actualmente' (en este momento), sino 'en realidad' o 'de hecho'. Para 'actualmente', usa 'currently' o 'at present'.",
        morphologicalFamily: ['actual', 'actuality'],
        structuredFamily: {
          nouns: ['actuality'],
          verbs: [],
          adjectives: ['actual'],
          adverbs: ['actually'],
        },
        senses: [],
        isValidEnglishWord: true,
      },
      breakthrough: {
        word: 'breakthrough',
        translationEs: 'avance crucial, descubrimiento importante',
        definitionEn: 'An important discovery or event that helps solve a problem or make significant progress.',
        ipaGeneralAmerican: '/ˈbreɪkˌθruː/',
        cefrLevel: 'B2',
        partOfSpeech: 'NOUN',
        grammaticalDimension: 'CONTENT',
        domainCategory: 'Ciencia & Innovación',
        exampleSentenceEn: 'Scientists made a major breakthrough in renewable energy storage.',
        exampleSentenceEs: 'Los científicos lograron un avance crucial en el almacenamiento de energía renovable.',
        isFalseFriend: false,
        falseFriendNote: null,
        morphologicalFamily: ['break through'],
        structuredFamily: {
          nouns: ['breakthrough'],
          verbs: ['break through'],
          adjectives: [],
          adverbs: [],
        },
        senses: [],
        isValidEnglishWord: true,
      },
      seldom: {
        word: 'seldom',
        translationEs: 'rara vez, casi nunca',
        definitionEn: 'Not often; rarely occurring.',
        ipaGeneralAmerican: '/ˈsɛl.dəm/',
        cefrLevel: 'B2',
        partOfSpeech: 'ADVERB',
        grammaticalDimension: 'CONTENT',
        domainCategory: 'Frecuencia & Tiempo',
        exampleSentenceEn: 'They seldom go out to restaurants during the week.',
        exampleSentenceEs: 'Ellos rara vez van a restaurantes entre semana.',
        isFalseFriend: false,
        falseFriendNote: null,
        morphologicalFamily: [],
        structuredFamily: {
          nouns: [],
          verbs: [],
          adjectives: [],
          adverbs: ['seldom'],
        },
        senses: [],
        isValidEnglishWord: true,
      },
      'look forward to': {
        word: 'look forward to',
        translationEs: 'esperar con ilusión / entusiasmo',
        definitionEn: 'To feel pleased and excited about something that is going to happen.',
        ipaGeneralAmerican: '/lʊk ˈfɔːr.wərd tuː/',
        cefrLevel: 'B1',
        partOfSpeech: 'VERB',
        grammaticalDimension: 'CHUNK',
        domainCategory: 'Emociones & Planes',
        exampleSentenceEn: 'I look forward to hearing from you soon.',
        exampleSentenceEs: 'Espero con entusiasmo saber de ti pronto.',
        isFalseFriend: false,
        falseFriendNote: null,
        morphologicalFamily: [],
        structuredFamily: {
          nouns: [],
          verbs: ['look forward to'],
          adjectives: [],
          adverbs: [],
        },
        verbTenses: {
          infinitive: 'look forward to',
          pastSimple: 'looked forward to',
          pastParticiple: 'looked forward to',
          thirdPersonPresent: 'looks forward to',
          gerund: 'looking forward to',
          isIrregular: false,
          edPhoneticEnding: '/t/',
        },
        senses: [],
        isValidEnglishWord: true,
      },
      embarrassed: {
        word: 'embarrassed',
        translationEs: 'avergonzado/a, apenado/a',
        definitionEn: 'Feeling ashamed, uncomfortable, or awkward with oneself or others.',
        ipaGeneralAmerican: '/ɪmˈber.əst/',
        cefrLevel: 'B1',
        partOfSpeech: 'ADJECTIVE',
        grammaticalDimension: 'CONTENT',
        domainCategory: 'Emociones & Estado Mental',
        exampleSentenceEn: 'He was embarrassed when he forgot his colleague’s name.',
        exampleSentenceEs: 'Él se sintió avergonzado cuando olvidó el nombre de su colega.',
        isFalseFriend: true,
        falseFriendNote: "No significa 'embarazada' (que en inglés es 'pregnant'), sino 'avergonzado/a' o 'apenado/a'.",
        morphologicalFamily: ['embarrass', 'embarrassment', 'embarrassing'],
        structuredFamily: {
          nouns: ['embarrassment'],
          verbs: ['embarrass'],
          adjectives: ['embarrassed', 'embarrassing'],
          adverbs: ['embarrassingly'],
        },
        senses: [],
        isValidEnglishWord: true,
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
    const isVerb = cleanWord.startsWith('to ') || isMultiWord || cleanWord.endsWith('ize') || cleanWord.endsWith('ise');

    const detectedPos = isVerb ? 'VERB' : isAdverb ? 'ADVERB' : isAdjective ? 'ADJECTIVE' : 'NOUN';
    const dimension = isMultiWord ? 'CHUNK' : 'CONTENT';

    const fallbackVerbTenses = isVerb
      ? {
          infinitive: cleanWord.replace(/^to\s+/i, ''),
          pastSimple: `${cleanWord.replace(/^to\s+/i, '')}ed`,
          pastParticiple: `${cleanWord.replace(/^to\s+/i, '')}ed`,
          thirdPersonPresent: `${cleanWord.replace(/^to\s+/i, '')}s`,
          gerund: `${cleanWord.replace(/^to\s+/i, '')}ing`,
          isIrregular: false,
          edPhoneticEnding: '/d/' as const,
        }
      : null;

    const fallback: VocabEnrichmentResponse = {
      word: cleanWord,
      translationEs: `traducción de ${cleanWord}`,
      definitionEn: `A term representing ${cleanWord} used in standard English communication.`,
      ipaGeneralAmerican: `/${cleanWord.toLowerCase().replace(/[^a-z]/g, '')}/`,
      cefrLevel: 'B1',
      partOfSpeech: detectedPos,
      grammaticalDimension: dimension,
      domainCategory: 'Uso General',
      exampleSentenceEn: `Learning how to use "${cleanWord}" correctly enhances fluency.`,
      exampleSentenceEs: `Aprender a usar "${cleanWord}" correctamente mejora la fluidez.`,
      isFalseFriend: false,
      falseFriendNote: null,
      morphologicalFamily: [],
      structuredFamily: {
        nouns: detectedPos === 'NOUN' ? [cleanWord] : [],
        verbs: detectedPos === 'VERB' ? [cleanWord] : [],
        adjectives: detectedPos === 'ADJECTIVE' ? [cleanWord] : [],
        adverbs: detectedPos === 'ADVERB' ? [cleanWord] : [],
      },
      verbTenses: fallbackVerbTenses,
      senses: [],
      isValidEnglishWord: true,
    };

    return VocabEnrichmentResponseSchema.parse(fallback);
  }
}

