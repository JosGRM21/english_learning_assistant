import { GoogleGenAI } from '@google/genai';
import { IAiGateway } from './IAiGateway';
import {
  SocraticFeedbackResponse,
  SocraticFeedbackResponseSchema,
  WritingEvaluationResponse,
  WritingEvaluationResponseSchema,
  VocabEnrichmentResponse,
  VocabEnrichmentResponseSchema,
} from './schemas';
import { QuotaMatrixOrchestrator, GeminiModelId } from '../../core/ai/QuotaMatrixOrchestrator';

export class GeminiAiGateway implements IAiGateway {
  constructor(
    private readonly quotaMatrix: QuotaMatrixOrchestrator,
    private preferredModel: GeminiModelId = 'gemini-3.8-flash',
  ) {}

  public setPreferredModel(model: GeminiModelId): void {
    this.preferredModel = model;
  }

  private async executeWithQuotaFailover<T>(
    promptSystem: string,
    promptUser: string,
    schemaValidator: (rawJson: unknown) => T,
    maxRetries = 3,
  ): Promise<T> {
    let attempts = 0;
    let lastError: Error | null = null;

    while (attempts < maxRetries) {
      attempts += 1;
      const modelToUse = this.quotaMatrix.getDefaultModel() || this.preferredModel;
      const route = this.quotaMatrix.resolveRoute(modelToUse);

      try {
        const ai = new GoogleGenAI({ apiKey: route.secretKey });

        const response = await ai.models.generateContent({
          model: route.modelId,
          contents: [
            {
              role: 'user',
              parts: [{ text: `Entrada:\n"""\n${promptUser}\n"""` }],
            },
          ],
          config: {
            systemInstruction: promptSystem,
            responseMimeType: 'application/json',
            temperature: 0.2, // Low temperature for consistent output
          },
        });

        const rawText = response.text?.trim() ?? '{}';
        let cleanedJson = rawText;
        if (cleanedJson.startsWith('```')) {
          cleanedJson = cleanedJson.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
        }

        const parsedJson = JSON.parse(cleanedJson);
        const validated = schemaValidator(parsedJson);

        // Record successful call
        this.quotaMatrix.recordSuccess(route.apiKeyId, route.modelId);
        return validated;
      } catch (err: unknown) {
        lastError = err instanceof Error ? err : new Error(String(err));
        const errMsg = lastError.message;

        const isQuotaOrServerUnavailable =
          errMsg.includes('429') ||
          errMsg.includes('RESOURCE_EXHAUSTED') ||
          errMsg.includes('Quota') ||
          errMsg.includes('503') ||
          errMsg.includes('UNAVAILABLE') ||
          errMsg.toLowerCase().includes('overloaded');

        if (isQuotaOrServerUnavailable) {
          this.quotaMatrix.recordHttp429(route.apiKeyId, route.modelId, errMsg);
          // Loop continues and will resolve the next route in the 2D matrix
          continue;
        }

        // For non-quota errors (e.g. invalid response format), rethrow immediately
        throw lastError;
      }
    }

    throw lastError ?? new Error('Gemini API request failed after retry cascade');
  }

  public async evaluateSocraticPhase1(
    userText: string,
    cefrTarget = 'B1',
  ): Promise<SocraticFeedbackResponse> {
    const systemPrompt = `
Eres "ELA Socratic Mentor", un tutor lingüístico especializado en fomentar el autodescubrimiento y la reestructuración del interlenguaje en hispanohablantes.
Tu misión es revisar el texto del estudiante en su PRIMER BORRADOR. Nivel objetivo CEFR: ${cefrTarget}.

### Reglas Pedagógicas Estrictas:
1. NO entregues de inmediato la solución final en la pregunta principal. Guía al estudiante a través de 4 niveles progresivos de andamiaje (ZPD - Zona de Desarrollo Próximo).
2. Identifica dónde se encuentran los errores (especialmente transferencias del español L1 como "depends of", "I am agree", "I have X years", false friends, colocaciones, orden de palabras) y formula PISTAS SOCRÁTICAS (*scaffolded clues*).
3. Devuelve ESTRICTAMENTE un JSON con:
   - overall_impression_es (string motivador y comunicativo)
   - error_count (integer)
   - allow_self_correction (boolean, default true)
   - scaffolded_clues: array de objetos con:
       * paragraph_index (integer, default 1)
       * clue_type ('PREPOSITION' | 'TENSE_ASPECT' | 'FALSE_FRIEND' | 'AGREEMENT' | 'WORD_CHOICE' | 'WORD_ORDER' | 'COLLOCATION')
       * hint_question_es: Pregunta socrática que oriente la atención del estudiante a la regla infringida sin dar la respuesta.
       * highlighted_area: El fragmento exacto del texto del estudiante que contiene el error.
       * zpd_contrastive_es: Explicación metalingüística clara de la diferencia entre cómo se piensa en español vs. cómo funciona en inglés natural.
       * zpd_cloze_sentence: Una oración breve con un hueco "[ ___ ]" para que el estudiante intente rellenar la forma correcta.
       * zpd_expected_token: La palabra o expresión exacta esperada en el hueco (para validación interactiva).
       * zpd_native_model: La frase completa o colocación idiomática estándar que usaría un hablante nativo.
`;

    return this.executeWithQuotaFailover(systemPrompt, userText, (json) =>
      SocraticFeedbackResponseSchema.parse(json),
    );
  }

  public async evaluateFinalPhase2(
    draft1: string,
    draft2: string,
    cefrTarget = 'B1',
  ): Promise<WritingEvaluationResponse> {
    const systemPrompt = `
Eres "ELA Mentor", un lingüista experto en Lingüística Aplicada y Adquisición de Segundas Lenguas (SLA), especializado en hispanohablantes.
El estudiante te entrega su segundo borrador tras haber revisado las pistas socráticas del primer borrador.
Nivel objetivo: ${cefrTarget}.

Borrador original previo: "${draft1}"

### Principios:
1. Explica en español POR QUÉ ocurre cada error residual o nuevo, indicando si es interferencia de L1 español.
2. Proporciona la reformulación nativa idiomática.
3. Evalúa el nivel estimado CEFR (A1, A2, B1, B2, C1, C2) y asigna puntajes (0.0 a 10.0) en grammar, vocabulary y coherence.
4. Genera un "Micro-Reto" interactivo (opción múltiple con hueco '___') para validar la asimilación inmediata.
5. Devuelve ESTRICTAMENTE un objeto JSON válido con:
   - overall_feedback_es (string)
   - estimated_cefr ('A1'|'A2'|'B1'|'B2'|'C1'|'C2')
   - scores: { grammar, vocabulary, coherence }
   - corrections: array de objetos con:
       * error_span (string): fragmento exacto del texto del estudiante que contiene el error.
       * error_type (string): ESTRICTAMENTE uno de ['GRAMMAR', 'LEXICON', 'PREPOSITION', 'WORD_ORDER', 'FALSE_FRIEND', 'PUNCTUATION', 'REGISTER', 'TENSE_ASPECT', 'AGREEMENT', 'COLLOCATION'].
       * taxonomy_code (string): código de error (ej. 'L1_PREP_DEPEND_ON', 'L1_AGREEMENT_SUBJECT_VERB', 'L1_FALSE_FRIEND_ACTUALLY').
       * is_l1_spanish_transfer (boolean): true si proviene de interferencia del español, false si es otro tipo de error.
       * explanation_es (string): explicación pedagógica concisa en español.
       * native_reformulation (string): formulación nativa y natural en inglés.
   - micro_challenge: { question_es, sentence_with_blank, options (array 2-4 strings), correct_option_index (0-3), explanation_es }
`;

    return this.executeWithQuotaFailover(systemPrompt, draft2, (json) =>
      WritingEvaluationResponseSchema.parse(json),
    );
  }

  public async lookupVocabWord(word: string): Promise<VocabEnrichmentResponse> {
    const systemPrompt = `
Eres un lexicógrafo y lingüista experto en el idioma inglés y en lingüística aplicada para hispanohablantes.
Tu tarea es analizar la palabra, frase o término en inglés proporcionado y generar una ficha léxica completa en formato JSON.

### Reglas Estrictas:
1. word: la palabra o locución/phrasal verb en inglés (limpia, en forma base o infinitivo si aplica).
2. translationEs: la traducción más precisa, habitual y natural al español (estándar/neutro).
3. definitionEn: definición clara, concisa y pedagógica en inglés sencillo (estilo Cambridge / Oxford Learner's Dictionary).
4. ipaGeneralAmerican: transcripción fonética precisa en el Alfabeto Fonético Internacional (IPA) para inglés estadounidense (General American), ej. "/rɪˈzɪljənt/".
5. cefrLevel: nivel del Marco Común Europeo de Referencia ('A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2').
6. partOfSpeech: una de las siguientes categorías gramaticales exactas:
   'NOUN', 'VERB', 'ADJECTIVE', 'ADVERB', 'PREPOSITION', 'CONJUNCTION', 'ARTICLE_DETERMINER', 'PRONOUN', 'INTERJECTION'.
7. grammaticalDimension:
   - 'CONTENT': sustantivos, verbos léxicos, adjetivos, adverbios.
   - 'FUNCTION': preposiciones, conjunciones, pronombres, determinantes.
   - 'CHUNK': phrasal verbs, modismos, colocaciones o frases hechas.
8. exampleSentenceEn: una oración de ejemplo natural, idiomática y contemporánea donde se use la palabra en contexto real.
9. exampleSentenceEs: la traducción precisa al español de dicha oración de ejemplo.
10. isFalseFriend: true si la palabra es un falso cognado / falso amigo para hispanohablantes (ej. 'actually', 'realize', 'sensible', 'embarrassed', 'fabric', 'library', 'constipated'), false de lo contrario.
11. falseFriendNote: si es falso amigo, una breve explicación en español aclarando la confusión frecuente y qué significa realmente en español. Si no es falso amigo, null.
12. morphologicalFamily: array de palabras derivadas o de la misma raíz morfológica (ej. ['resilience', 'resiliently']).

Devuelve ESTRICTAMENTE un JSON válido con estas propiedades.
`;

    return this.executeWithQuotaFailover(systemPrompt, word.trim(), (json) =>
      VocabEnrichmentResponseSchema.parse(json),
    );
  }
}

