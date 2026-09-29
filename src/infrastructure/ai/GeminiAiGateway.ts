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
      const route = this.quotaMatrix.resolveRoute(this.preferredModel);

      try {
        const ai = new GoogleGenAI({ apiKey: route.secretKey });

        const response = await ai.models.generateContent({
          model: route.modelId,
          contents: [
            {
              role: 'user',
              parts: [{ text: `${promptSystem}\n\nTexto a evaluar:\n"""\n${promptUser}\n"""` }],
            },
          ],
          config: {
            responseMimeType: 'application/json',
            temperature: 0.2, // Low temperature for consistent grading
          },
        });

        const text = response.text?.trim() ?? '{}';
        const parsedJson = JSON.parse(text);
        const validated = schemaValidator(parsedJson);

        // Record successful call
        this.quotaMatrix.recordSuccess(route.apiKeyId, route.modelId);
        return validated;
      } catch (err: unknown) {
        lastError = err instanceof Error ? err : new Error(String(err));
        const errMsg = lastError.message;

        if (errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED') || errMsg.includes('Quota')) {
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

  public async evaluateSocraticPhase1(userText: string): Promise<SocraticFeedbackResponse> {
    const systemPrompt = `
Eres "ELA Socratic Mentor", un tutor lingüístico especializado en fomentar el autodescubrimiento y la reestructuración del interlenguaje en hispanohablantes.
Tu misión es revisar el texto del estudiante en su PRIMER BORRADOR.

### Reglas Pedagógicas Estrictas:
1. NO entregues la solución corregida ni reescribas la oración.
2. Identifica dónde se encuentran los errores (especialmente transferencias del español L1 como "depends of", "I am agree", "I have X years", do/make) y formula PISTAS SOCRÁTICAS (*scaffolded clues*) orientadas a la reflexión.
3. Cada pista debe consistir en una pregunta que guíe la atención del estudiante hacia la regla o colocación infringida.
4. Devuelve ESTRICTAMENTE un JSON con:
   - overall_impression_es (string)
   - error_count (integer)
   - allow_self_correction (boolean)
   - scaffolded_clues (array de { paragraph_index, clue_type, hint_question_es, highlighted_area })
   Donde clue_type debe ser uno de: 'PREPOSITION', 'TENSE_ASPECT', 'FALSE_FRIEND', 'AGREEMENT', 'WORD_CHOICE'.
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
   - corrections: array de { error_span, error_type, taxonomy_code, is_l1_spanish_transfer, explanation_es, native_reformulation }
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

