import { z } from 'zod';
import { CanonicalAssertions } from '../schemas/golden-dataset.schema';

export class DeterministicAssertionError extends Error {
  public readonly code: string;
  public readonly field?: string;
  public readonly received?: unknown;
  public readonly expected?: unknown;

  constructor(
    message: string,
    options: {
      code: string;
      field?: string;
      received?: unknown;
      expected?: unknown;
    },
  ) {
    super(message);
    this.name = 'DeterministicAssertionError';
    this.code = options.code;
    this.field = options.field;
    this.received = options.received;
    this.expected = options.expected;
  }
}

/**
 * Validadores deterministas de Capa 1 (Coste: $0.00, Latencia: < 1ms).
 * Ejecutan validaciones booleanas estrictas sobre texto y estructuras tipadas.
 */
export class DeterministicValidators {
  /**
   * Valida cotas físicas de longitud en caracteres.
   */
  public static assertLengthBounds(
    text: string,
    minChars = 1,
    maxChars = 10000,
    field = 'text',
  ): void {
    const trimmed = text.trim();
    if (trimmed.length < minChars) {
      throw new DeterministicAssertionError(
        `Longitud insuficiente en '${field}': ${trimmed.length} caracteres (mínimo: ${minChars})`,
        { code: 'MIN_LENGTH_VIOLATION', field, received: trimmed.length, expected: `>= ${minChars}` },
      );
    }
    if (trimmed.length > maxChars) {
      throw new DeterministicAssertionError(
        `Longitud excede cota máxima en '${field}': ${trimmed.length} caracteres (máximo: ${maxChars})`,
        { code: 'MAX_LENGTH_VIOLATION', field, received: trimmed.length, expected: `<= ${maxChars}` },
      );
    }
  }

  /**
   * Valida prohibición absoluta de saludos y preámbulos conversacionales ("Hola", "Estimado", etc.).
   */
  public static assertNoLeadingGreetings(text: string, field = 'feedback'): void {
    const greetingPattern = /^(?:¡?hola!?|saludos\b|bienvenido[a-s]*\b|estimado[a-s]*\b|buenos días\b|buenas tardes\b|hello\b|hi\b|greetings\b|welcome\b)[,.:!\s\n-]*/i;
    const match = text.trim().match(greetingPattern);
    if (match) {
      throw new DeterministicAssertionError(
        `Violación de cortesía/preámbulo en '${field}': se detectó fórmula conversacional inicial '${match[0]}'`,
        { code: 'PROHIBITED_GREETING_DETECTED', field, received: match[0], expected: 'Direct analytical response' },
      );
    }
  }

  /**
   * Valida que ningún elemento de una lista de cadenas sea exclusivamente signos de puntuación o espacios.
   */
  public static assertNoPunctuationOnlyTokens(tokens: string[], field = 'tokens'): void {
    const punctuationOnlyRegex = /^[\s,.:;!?'"¿¡`´\-_/\\()[\]{}«»“”‘’—–…]+$/;
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i]?.trim();
      if (token && punctuationOnlyRegex.test(token)) {
        throw new DeterministicAssertionError(
          `Token ilegal compuesto exclusivamente por puntuación en '${field}[${i}]': '${token}'`,
          { code: 'PUNCTUATION_ONLY_TOKEN', field: `${field}[${i}]`, received: token, expected: 'Alphanumeric token' },
        );
      }
    }
  }

  /**
   * Deserializa y valida estrictamente un string contra un esquema Zod.
   */
  public static assertStrictJsonSchema<T>(
    rawTextOrObject: string | unknown,
    schema: z.ZodType<T>,
    schemaName = 'OutputSchema',
  ): T {
    let parsedJson: unknown;

    if (typeof rawTextOrObject === 'string') {
      let cleanText = rawTextOrObject.trim();
      const markdownMatch = cleanText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (markdownMatch) {
        cleanText = markdownMatch[1].trim();
      }

      try {
        parsedJson = JSON.parse(cleanText);
      } catch (err) {
        throw new DeterministicAssertionError(
          `Error de deserialización JSON en ${schemaName}: ${(err as Error).message}`,
          { code: 'JSON_SYNTAX_ERROR', field: schemaName, received: rawTextOrObject },
        );
      }
    } else {
      parsedJson = rawTextOrObject;
    }

    const parseResult = schema.safeParse(parsedJson);
    if (!parseResult.success) {
      const formattedErrors = parseResult.error.issues.map(
        (issue) => `[${issue.path.join('.') || 'root'}] ${issue.message}`,
      ).join('; ');

      throw new DeterministicAssertionError(
        `El objeto no satisface el contrato del esquema ${schemaName}: ${formattedErrors}`,
        {
          code: 'SCHEMA_VALIDATION_FAILURE',
          field: schemaName,
          received: parsedJson,
          expected: 'Valid schema conforming object',
        },
      );
    }

    return parseResult.data;
  }

  /**
   * Valida invariantes léxicas y pedagógicas de la ficha de vocabulario según las aserciones canónicas.
   */
  public static assertVocabularyInvariants(
    vocab: Record<string, any>,
    assertions: CanonicalAssertions,
  ): void {
    // 1. Invariante de signos de puntuación en tokens
    if (assertions.disallow_punctuation_in_tokens) {
      if (typeof vocab.word === 'string') {
        this.assertNoPunctuationOnlyTokens([vocab.word], 'word');
      }
      if (Array.isArray(vocab.senses)) {
        for (let i = 0; i < vocab.senses.length; i++) {
          const sense = vocab.senses[i];
          if (sense.graduatedExamples) {
            const ge = sense.graduatedExamples;
            if (ge.clozeTargetBasic) {
              this.assertNoPunctuationOnlyTokens([ge.clozeTargetBasic], `senses[${i}].clozeTargetBasic`);
            }
            if (ge.clozeTargetAdvanced) {
              this.assertNoPunctuationOnlyTokens([ge.clozeTargetAdvanced], `senses[${i}].clozeTargetAdvanced`);
            }
          }
        }
      }
    }

    // 2. Número de acepciones (cotas min/max)
    if (Array.isArray(vocab.senses)) {
      const sensesCount = vocab.senses.length;
      if (sensesCount < assertions.min_senses) {
        throw new DeterministicAssertionError(
          `Insuficiente número de acepciones: tiene ${sensesCount}, mínimo requerido: ${assertions.min_senses}`,
          { code: 'MIN_SENSES_VIOLATION', field: 'senses', received: sensesCount, expected: assertions.min_senses },
        );
      }
      if (sensesCount > assertions.max_senses) {
        throw new DeterministicAssertionError(
          `Exceso de acepciones: tiene ${sensesCount}, máximo admitido: ${assertions.max_senses}`,
          { code: 'MAX_SENSES_VIOLATION', field: 'senses', received: sensesCount, expected: assertions.max_senses },
        );
      }
    }

    // 3. Forma débil fonética (ipaWeakForm)
    if (assertions.require_weak_form === true) {
      if (!vocab.ipaWeakForm || typeof vocab.ipaWeakForm !== 'string' || !vocab.ipaWeakForm.trim()) {
        throw new DeterministicAssertionError(
          `La palabra requiere 'ipaWeakForm' obligatoria reducida en habla conectada, pero se recibió: ${JSON.stringify(vocab.ipaWeakForm)}`,
          { code: 'MISSING_WEAK_FORM', field: 'ipaWeakForm', received: vocab.ipaWeakForm, expected: 'IPA reduced weak form' },
        );
      }
    } else if (assertions.require_weak_form === false) {
      if (vocab.ipaWeakForm !== null && vocab.ipaWeakForm !== undefined) {
        throw new DeterministicAssertionError(
          `Las palabras sin forma débil canónica no deben definir 'ipaWeakForm' (debe ser null), pero se recibió: ${JSON.stringify(vocab.ipaWeakForm)}`,
          { code: 'UNEXPECTED_WEAK_FORM', field: 'ipaWeakForm', received: vocab.ipaWeakForm, expected: null },
        );
      }
    }

    // 4. Alófono del sufijo regular de pasado (phoneticEdEnding)
    if (assertions.require_phonetic_ed_ending) {
      if (vocab.phoneticEdEnding !== assertions.require_phonetic_ed_ending) {
        throw new DeterministicAssertionError(
          `Alófono -ed incorrecto: se recibió '${vocab.phoneticEdEnding}', esperado estrictamente: '${assertions.require_phonetic_ed_ending}'`,
          {
            code: 'INVALID_PHONETIC_ED_ENDING',
            field: 'phoneticEdEnding',
            received: vocab.phoneticEdEnding,
            expected: assertions.require_phonetic_ed_ending,
          },
        );
      }
    }

    // 5. Morfología verbal (verbTenses)
    if (assertions.require_verb_tenses === true) {
      if (!vocab.verbTenses || typeof vocab.verbTenses !== 'object') {
        throw new DeterministicAssertionError(
          `El lema verbal requiere la conjugación completa en 'verbTenses', pero se recibió null o ausente`,
          { code: 'MISSING_VERB_TENSES', field: 'verbTenses', received: vocab.verbTenses, expected: 'Object with verb conjugations' },
        );
      }
    } else if (assertions.require_verb_tenses === false) {
      if (vocab.verbTenses !== null && vocab.verbTenses !== undefined) {
        throw new DeterministicAssertionError(
          `Las palabras no verbales no deben incluir 'verbTenses' (debe ser null), pero se recibió un objeto`,
          { code: 'UNEXPECTED_VERB_TENSES', field: 'verbTenses', received: vocab.verbTenses, expected: null },
        );
      }
    }

    // 6. Falsos amigos (isFalseFriend y falseFriendNote)
    if (assertions.require_false_friend === true) {
      if (vocab.isFalseFriend !== true) {
        throw new DeterministicAssertionError(
          `El término es un falso amigo crítico hacia el español y 'isFalseFriend' debe ser true`,
          { code: 'FALSE_FRIEND_EXPECTED', field: 'isFalseFriend', received: vocab.isFalseFriend, expected: true },
        );
      }
      if (!vocab.falseFriendNote || typeof vocab.falseFriendNote !== 'string' || vocab.falseFriendNote.trim().length < 5) {
        throw new DeterministicAssertionError(
          `El falso amigo requiere una 'falseFriendNote' explicativa detallada`,
          { code: 'MISSING_FALSE_FRIEND_NOTE', field: 'falseFriendNote', received: vocab.falseFriendNote },
        );
      }
    } else if (assertions.require_false_friend === false) {
      if (vocab.isFalseFriend === true) {
        throw new DeterministicAssertionError(
          `El término no es un falso amigo, pero 'isFalseFriend' se marcó como true erróneamente`,
          { code: 'UNEXPECTED_FALSE_FRIEND', field: 'isFalseFriend', received: true, expected: false },
        );
      }
    }

    // 7. Dimensión gramatical esperada
    if (assertions.expected_grammatical_dimension) {
      if (vocab.grammaticalDimension !== assertions.expected_grammatical_dimension) {
        throw new DeterministicAssertionError(
          `Dimensión gramatical errónea: se recibió '${vocab.grammaticalDimension}', esperado: '${assertions.expected_grammatical_dimension}'`,
          {
            code: 'GRAMMATICAL_DIMENSION_MISMATCH',
            field: 'grammaticalDimension',
            received: vocab.grammaticalDimension,
            expected: assertions.expected_grammatical_dimension,
          },
        );
      }
    }

    // 8. Categoría gramatical principal esperada
    if (assertions.expected_primary_part_of_speech && Array.isArray(vocab.senses) && vocab.senses.length > 0) {
      const primaryPos = vocab.senses[0]?.partOfSpeech;
      if (primaryPos !== assertions.expected_primary_part_of_speech) {
        throw new DeterministicAssertionError(
          `Categoría gramatical del sentido principal (sense_1) errónea: se recibió '${primaryPos}', esperado: '${assertions.expected_primary_part_of_speech}'`,
          {
            code: 'PRIMARY_PART_OF_SPEECH_MISMATCH',
            field: 'senses[0].partOfSpeech',
            received: primaryPos,
            expected: assertions.expected_primary_part_of_speech,
          },
        );
      }
    }

    // 9. Prohibición de Phrasal Verbs en palabras que NO son verbos
    if (Array.isArray(vocab.phrasalVerbs) && vocab.phrasalVerbs.length > 0) {
      const isVerb = Array.isArray(vocab.senses) && vocab.senses.some((s: any) => s.partOfSpeech === 'VERB');
      if (!isVerb) {
        throw new DeterministicAssertionError(
          `La palabra no posee ninguna acepción como VERBO pero incluye phrasalVerbs. Los phrasal verbs solo se asocian a verbos.`,
          { code: 'PHRASAL_VERBS_ON_NON_VERB', field: 'phrasalVerbs', received: vocab.phrasalVerbs.length, expected: 0 },
        );
      }
    }
  }
}
