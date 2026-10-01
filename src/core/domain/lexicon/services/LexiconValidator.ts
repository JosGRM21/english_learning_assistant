export const DE_LEXICALISED_VERBS = [
  'have',
  'take',
  'make',
  'give',
  'do',
  'get',
  'set',
] as const;

export type DeLexicalisedVerb = (typeof DE_LEXICALISED_VERBS)[number];

export interface LexiconValidationResult {
  isValid: boolean;
  errorCode?: 'DE_LEXICALISED_ISOLATION_ERROR';
  errorMessageEs?: string;
  suggestedCollocations?: string[];
}

export const SAMPLE_COLLOCATIONS: Record<DeLexicalisedVerb, string[]> = {
  have: ['have a word', 'have a chat', 'have lunch', 'have a shower', 'have fun'],
  take: ['take a look', 'take into account', 'take a chance', 'take a break', 'take part in'],
  make: ['make a decision', 'make a mistake', 'make progress', 'make an effort', 'make sense'],
  give: ['give advice', 'give a hand', 'give a try', 'give permission', 'give thought to'],
  do: ['do research', 'do homework', 'do business', 'do one’s best', 'do a favour'],
  get: ['get used to', 'get ready', 'get lost', 'get in touch', 'get rid of'],
  set: ['set a goal', 'set an example', 'set a precedent', 'set the alarm', 'set free'],
};

export class LexiconValidator {
  /**
   * Validates whether a vocabulary candidate adheres to lexical collocation rules.
   * RF-SEM-04: Prevents studying de-lexicalised verbs in isolation.
   */
  public static validateTerm(term: string): LexiconValidationResult {
    const normalized = term.trim().toLowerCase();
    const isDeLexicalised = (DE_LEXICALISED_VERBS as readonly string[]).includes(normalized);

    if (isDeLexicalised) {
      const verb = normalized as DeLexicalisedVerb;
      return {
        isValid: false,
        errorCode: 'DE_LEXICALISED_ISOLATION_ERROR',
        errorMessageEs: `El verbo "${normalized}" es deslexicalizado (su significado depende del sustantivo que lo acompaña). No se debe estudiar en aislamiento. Regístralo como colocación binaria.`,
        suggestedCollocations: SAMPLE_COLLOCATIONS[verb] || [],
      };
    }

    return {
      isValid: true,
    };
  }
}
