import { eventBus } from '../../../common/events/DomainEventBus';
import { ErrorCommittedPayload } from '../../../common/events/types';

export interface DetectedL1Interference {
  ruleCode: string;
  domain: 'MORPHOSYNTACTIC' | 'PHONOLOGICAL' | 'LEXICAL' | 'PRAGMATIC';
  matchedText: string;
  startIndex: number;
  endIndex: number;
  suggestedCorrection: string;
  explanationEs: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface L1PatternRule {
  ruleCode: string;
  domain: 'MORPHOSYNTACTIC' | 'PHONOLOGICAL' | 'LEXICAL' | 'PRAGMATIC';
  regex: RegExp;
  suggestedCorrection: string | ((match: RegExpExecArray) => string);
  explanationEs: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export const L1_CANONICAL_RULES: L1PatternRule[] = [
  // 1. Pro-Drop Dummy IT
  {
    ruleCode: 'L1_PRO_DROP_DUMMY_IT',
    domain: 'MORPHOSYNTACTIC',
    regex: /(?:^|[.!?]\s+)(is\s+(?:raining|snowing|cold|hot|late|early|important|necessary|impossible|true|false)\b)/gi,
    suggestedCorrection: (m) => `It ${m[1]}`,
    explanationEs: 'En inglés el sujeto impersonal no se puede omitir. Se debe usar el pronombre ficticio "It" (ej. "It is raining", "It is important").',
    severity: 'HIGH',
  },
  // 2. Existential HAVE
  {
    ruleCode: 'L1_EXISTENTIAL_HAVE',
    domain: 'MORPHOSYNTACTIC',
    regex: /(?:^|[.!?]\s+|(?:in|at|on|under|here|there)\s+[a-z\s]{1,30}?\s+)\b(have|has)\s+(a lot of|many|several|\d+|two|three|some|no)\s+([a-z]+)/gi,
    suggestedCorrection: (m) => `there are ${m[2]} ${m[3]}`,
    explanationEs: 'No se usa el verbo "have" para expresar existencia. Se debe utilizar "there is" o "there are".',
    severity: 'CRITICAL',
  },
  // 3. Preposition Divergence: depend of -> depend on
  {
    ruleCode: 'L1_PREP_DEPEND_OF',
    domain: 'MORPHOSYNTACTIC',
    regex: /\b(depends?|depended|depending)\s+of\b/gi,
    suggestedCorrection: (m) => `${m[1]} on`,
    explanationEs: 'El verbo "depend" rige obligatoriamente la preposición "on", nunca "of".',
    severity: 'HIGH',
  },
  // Married with -> married to
  {
    ruleCode: 'L1_PREP_MARRIED_WITH',
    domain: 'MORPHOSYNTACTIC',
    regex: /\b(married|engaged)\s+with\b/gi,
    suggestedCorrection: (m) => `${m[1]} to`,
    explanationEs: 'En inglés el vínculo conyugal se expresa con "to" (ej. "married to someone").',
    severity: 'HIGH',
  },
  // Good in -> good at
  {
    ruleCode: 'L1_PREP_GOOD_IN',
    domain: 'MORPHOSYNTACTIC',
    regex: /\b(good|bad|terrible|excellent)\s+in\s+([a-z]+ing|[a-z]+)\b/gi,
    suggestedCorrection: (m) => `${m[1]} at ${m[2]}`,
    explanationEs: 'Para habilidades y aptitudes se usa "at" (ej. "good at math", "bad at singing").',
    severity: 'MEDIUM',
  },
  // Interested for -> interested in
  {
    ruleCode: 'L1_PREP_INTERESTED_FOR',
    domain: 'MORPHOSYNTACTIC',
    regex: /\b(interested)\s+(for|at)\b/gi,
    suggestedCorrection: 'interested in',
    explanationEs: 'El adjetivo "interested" rige la preposición "in".',
    severity: 'HIGH',
  },
  // Dream with -> dream about / of
  {
    ruleCode: 'L1_PREP_DREAM_WITH',
    domain: 'MORPHOSYNTACTIC',
    regex: /\b(dream(?:s|ed|t)?|dreaming)\s+with\b/gi,
    suggestedCorrection: (m) => `${m[1]} about`,
    explanationEs: 'En inglés se sueña "sobre" algo o alguien ("dream about" o "dream of"), nunca "with".',
    severity: 'MEDIUM',
  },
  // Think in -> think of / about
  {
    ruleCode: 'L1_PREP_THINK_IN',
    domain: 'MORPHOSYNTACTIC',
    regex: /\b(think(?:s|ing)?|thought)\s+in\b/gi,
    suggestedCorrection: (m) => `${m[1]} of`,
    explanationEs: 'Pensar en alguien o algo se expresa como "think of" o "think about", nunca "in".',
    severity: 'MEDIUM',
  },
  // Congratulate for -> congratulate on
  {
    ruleCode: 'L1_PREP_CONGRATULATE_FOR',
    domain: 'MORPHOSYNTACTIC',
    regex: /\b(congratulat(?:e|ed|es|ing))\s+([a-z]+)\s+for\b/gi,
    suggestedCorrection: (m) => `${m[1]} ${m[2]} on`,
    explanationEs: 'Las felicitaciones en inglés rigen "on" ("congratulate on"), no "for".',
    severity: 'HIGH',
  },
  // 4. Direct Transitive with Parasite Preposition: discuss about -> discuss
  {
    ruleCode: 'L1_ZERO_PREP_DISCUSS_ABOUT',
    domain: 'MORPHOSYNTACTIC',
    regex: /\b(discuss(?:es|ed|ing)?)\s+about\b/gi,
    suggestedCorrection: (m) => `${m[1]}`,
    explanationEs: '"Discuss" es un verbo transitivo directo en inglés; no lleva la preposición "about".',
    severity: 'MEDIUM',
  },
  // enter to -> enter
  {
    ruleCode: 'L1_ZERO_PREP_ENTER_TO',
    domain: 'MORPHOSYNTACTIC',
    regex: /\b(enter(?:s|ed|ing)?)\s+(to|into)\s+(the|a|an|this|that|[a-z]+)\b/gi,
    suggestedCorrection: (m) => `${m[1]} ${m[3]}`,
    explanationEs: '"Enter" (acceder a un recinto físico) es transitivo directo; no requiere "to".',
    severity: 'MEDIUM',
  },
  // call to -> call
  {
    ruleCode: 'L1_ZERO_PREP_CALL_TO',
    domain: 'MORPHOSYNTACTIC',
    regex: /\b(call(?:s|ed|ing)?)\s+to\s+(my|his|her|the|a|me|him|them|[A-Z][a-z]+)\b/gi,
    suggestedCorrection: (m) => `${m[1]} ${m[2]}`,
    explanationEs: 'Llamar a alguien es "call someone" sin la preposición "to".',
    severity: 'MEDIUM',
  },
  // reach to -> reach
  {
    ruleCode: 'L1_ZERO_PREP_REACH_TO',
    domain: 'MORPHOSYNTACTIC',
    regex: /\b(reach(?:es|ed|ing)?)\s+to\b/gi,
    suggestedCorrection: (m) => `${m[1]}`,
    explanationEs: '"Reach" no lleva preposición para indicar alcanzar un acuerdo o destino.',
    severity: 'MEDIUM',
  },
  // 5. Stative verb continuous: am knowing, etc.
  {
    ruleCode: 'L1_STATIVE_VERB_CONTINUOUS',
    domain: 'MORPHOSYNTACTIC',
    regex: /\b(am|is|are|was|were|been)\s+(knowing|believing|understanding|belonging|preferring|needing|containing)\b/gi,
    suggestedCorrection: 'Usa la forma simple del verbo (ej. "I understand", "she needs")',
    explanationEs: 'Los verbos estativos (estados cognitivos o posesión) no admiten aspecto continuo (-ing).',
    severity: 'HIGH',
  },
  // 6. Double Negative calque: didn't see nobody
  {
    ruleCode: 'L1_DOUBLE_NEGATIVE',
    domain: 'MORPHOSYNTACTIC',
    regex: /\b(didn't|don't|doesn't|cannot|can't|won't|haven't|hasn't)\s+([a-z]+\s+)?(nobody|nothing|never|nowhere|no\s+one)\b/gi,
    suggestedCorrection: 'Usa pronombre no negativo con auxiliar (anybody, anything, anywhere)',
    explanationEs: 'En inglés estándar la doble negación es incorrecta ("didn\'t see anybody" o "saw nobody").',
    severity: 'CRITICAL',
  },
  // 7. Embedded Question Inversion: where is the station -> where the station is
  {
    ruleCode: 'L1_EMBEDDED_QUESTION_INVERSION',
    domain: 'MORPHOSYNTACTIC',
    regex: /\b(could you tell me|can you tell me|do you know|i wonder|i don't know)\s+(where|what|when|why|how)\s+(is|are|was|were|did|do|does)\s+([a-z]+)\b/gi,
    suggestedCorrection: (m) => `${m[1]} ${m[2]} ${m[4]} ${m[3]}`,
    explanationEs: 'En preguntas indirectas se usa el orden declarativo (Sujeto + Verbo), no la inversión con auxiliar.',
    severity: 'HIGH',
  },
  // 8. Age with Have: I have 28 years -> I am 28 years old
  {
    ruleCode: 'L1_AGE_HAVE_YEARS',
    domain: 'MORPHOSYNTACTIC',
    regex: /\b(have|has)\s+(\d{1,2}|twenty|thirty|forty)\s+(?:years|years\s+old)\b/gi,
    suggestedCorrection: (m) => `am/is ${m[2]} years old`,
    explanationEs: 'En inglés la edad se expresa con el verbo "to be" ("I am 28 years old"), nunca con "have".',
    severity: 'CRITICAL',
  },
];

export class L1TransferEngine {
  private rules: L1PatternRule[];

  constructor(customRules: L1PatternRule[] = L1_CANONICAL_RULES) {
    this.rules = [...customRules];
  }

  /**
   * Scans a text for deterministic Spanish L1 interference errors in < 5ms.
   */
  public scanText(text: string): DetectedL1Interference[] {
    const results: DetectedL1Interference[] = [];
    if (!text || text.trim().length === 0) return results;

    for (const rule of this.rules) {
      // Reset regex index for global matches
      rule.regex.lastIndex = 0;
      let match: RegExpExecArray | null;

      while ((match = rule.regex.exec(text)) !== null) {
        const matchedText = match[0].trim();
        const startIndex = match.index;
        const endIndex = startIndex + match[0].length;

        const suggestedCorrection =
          typeof rule.suggestedCorrection === 'function'
            ? rule.suggestedCorrection(match)
            : rule.suggestedCorrection;

        results.push({
          ruleCode: rule.ruleCode,
          domain: rule.domain,
          matchedText,
          startIndex,
          endIndex,
          suggestedCorrection,
          explanationEs: rule.explanationEs,
          severity: rule.severity,
        });
      }
    }

    // Sort findings by position in text
    return results.sort((a, b) => a.startIndex - b.startIndex);
  }

  /**
   * Generates a context injection snippet to guide Gemini's feedback with deterministic clues.
   */
  public buildGeminiPromptAnnotation(detected: DetectedL1Interference[]): string {
    if (detected.length === 0) return '';

    const lines = detected.map(
      (d) => `- [${d.ruleCode}] (${d.severity}): "${d.matchedText}" -> Suggested: "${d.suggestedCorrection}". Cause: ${d.explanationEs}`,
    );

    return `\n[PRE-ANALYZED DETERMINISTIC L1 INTERFERENCE FLAGS]:\n${lines.join('\n')}\n`;
  }

  /**
   * Dispatches detected errors through the decoupled DomainEventBus for Heatmap updates.
   */
  public emitTelemetryEvents(
    userId: string,
    source: 'WRITING_EVALUATION' | 'SRS' | 'SPEED_DRILL',
    detected: DetectedL1Interference[],
  ): void {
    for (const error of detected) {
      const payload: ErrorCommittedPayload = {
        userId,
        errorTaxonomyCode: error.ruleCode,
        source,
        contextSnippet: error.matchedText,
        incorrectToken: error.matchedText,
        correctToken: error.suggestedCorrection,
        timestamp: new Date().toISOString(),
      };
      eventBus.publish('ERROR_COMMITTED', payload);
    }
  }
}

export const l1TransferEngine = new L1TransferEngine();
