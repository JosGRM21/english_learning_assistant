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
    actionName: string,
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
      const keyLabel =
        this.quotaMatrix.getApiKeys().find((k) => k.id === route.apiKeyId)?.label ??
        'Gemini Key';

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
        this.quotaMatrix.logRequest({
          timestamp: new Date().toISOString(),
          apiKeyId: route.apiKeyId,
          apiKeyLabel: keyLabel,
          modelId: route.modelId,
          action: actionName,
          status: 'SUCCESS',
        });
        return validated;
      } catch (err: unknown) {
        lastError = err instanceof Error ? err : new Error(String(err));
        const errMsg = lastError.message;

        const is503OrServerOverload =
          errMsg.includes('503') ||
          errMsg.includes('UNAVAILABLE') ||
          errMsg.toLowerCase().includes('overloaded');

        if (is503OrServerOverload) {
          this.quotaMatrix.logRequest({
            timestamp: new Date().toISOString(),
            apiKeyId: route.apiKeyId,
            apiKeyLabel: keyLabel,
            modelId: route.modelId,
            action: actionName,
            status: 'ERROR',
            errorDetails: `[503 Sobrecarga] ${errMsg}`,
          });
          // Automatic model failover on 503 or server errors is strictly eliminated.
          // Throw immediately so the user can be notified and switch model manually if desired.
          throw new Error(
            `[Gemini 503] El modelo ${route.modelId} está temporalmente sobrecargado o no disponible en Google AI Studio. El failover automático de modelos está deshabilitado; cambia el modelo manualmente en la configuración si deseas continuar. (Error original: ${errMsg})`,
          );
        }

        const isQuotaError =
          errMsg.includes('429') ||
          errMsg.includes('RESOURCE_EXHAUSTED') ||
          errMsg.includes('Quota');

        if (isQuotaError) {
          this.quotaMatrix.recordHttp429(route.apiKeyId, route.modelId, errMsg);
          this.quotaMatrix.logRequest({
            timestamp: new Date().toISOString(),
            apiKeyId: route.apiKeyId,
            apiKeyLabel: keyLabel,
            modelId: route.modelId,
            action: actionName,
            status: 'RATE_LIMITED',
            errorDetails: errMsg,
          });
          // Loop continues and will try the next available API key for the SAME model
          continue;
        }

        this.quotaMatrix.logRequest({
          timestamp: new Date().toISOString(),
          apiKeyId: route.apiKeyId,
          apiKeyLabel: keyLabel,
          modelId: route.modelId,
          action: actionName,
          status: 'ERROR',
          errorDetails: errMsg,
        });

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

### Reglas Pedagógicas y de Estilo Estrictas:
1. PROHIBICIÓN ABSOLUTA DE SALUDOS Y PREÁMBULOS:
   - NUNCA comiences ningún texto con saludos ni fórmulas conversacionales como "Hola", "¡Hola!", "Saludos", "Bienvenido", "Estimado estudiante", "He revisado tu texto", "A continuación...", etc.
   - Ve DIRECTAMENTE al grano, al análisis lingüístico y al contenido pedagógico sin introducciones vacías.
2. NO entregues de inmediato la solución final en la pregunta principal. Guía al estudiante a través de 4 niveles progresivos de andamiaje (ZPD - Zona de Desarrollo Próximo).
3. Identifica dónde se encuentran los errores (especialmente transferencias del español L1 como "depends of", "I am agree", "I have X years", false friends, colocaciones, orden de palabras) y formula PISTAS SOCRÁTICAS (*scaffolded clues*).
4. Devuelve ESTRICTAMENTE un JSON con:
   - overall_impression_es (string motivador y pedagógico directo sobre la intención comunicativa; PROHIBIDO comenzar con "Hola" o saludos)
   - error_count (integer)
   - allow_self_correction (boolean, default true)
   - scaffolded_clues: array de objetos con:
       * paragraph_index (integer, default 1)
       * clue_type ('PREPOSITION' | 'TENSE_ASPECT' | 'FALSE_FRIEND' | 'AGREEMENT' | 'WORD_CHOICE' | 'WORD_ORDER' | 'COLLOCATION')
       * hint_question_es: Pregunta socrática que oriente la atención del estudiante a la regla infringida sin dar la respuesta (directa, sin saludos).
       * highlighted_area: El fragmento exacto del texto del estudiante que contiene el error. Si el error es una sola letra, pronombre o palabra corta (como 'i', 'to', 'in', 'at', 'a'), debe coincidir exactamente con el token en el texto.
       * sentence_context: OBLIGATORIO. La oración o cláusula completa y exacta extraída del texto del estudiante donde ocurre el error, para permitir anclaje contextual unívoco y erradicar falsos positivos.
       * zpd_contrastive_es: Explicación metalingüística clara y directa de la diferencia entre cómo se piensa en español vs. cómo funciona en inglés natural.
       * zpd_cloze_sentence: Una oración breve contextual con un hueco "[ ___ ]" para que el estudiante intente rellenar la forma o colocación correcta.
       * zpd_expected_token: La palabra o colocación exacta esperada en el hueco "[ ___ ]" (para validación interactiva en Nivel 3).
       * zpd_native_model: La resolución COMPLETA y nativa de la oración del Nivel 3 con el hueco resuelto (ej. si zpd_cloze_sentence es 'I need to rest to [ ___ ] my energy back.' y el token es 'get', zpd_native_model DEBE ser 'I need to rest to get my energy back.'). Debe existir TOTAL COHERENCIA Y CONSISTENCIA entre la oración del Nivel 3 y la resolución del Nivel 4; nunca propongas una oración o colocación divergente en el Nivel 4 que desconecte el Nivel 4 del Nivel 3.
`;

    return this.executeWithQuotaFailover(
      'Taller de Redacción (Fase 1: Pistas Socráticas)',
      systemPrompt,
      userText,
      (json) => SocraticFeedbackResponseSchema.parse(json),
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

Borrador original previo (Draft 1): "${draft1}"

### Principios Pedagógicos y de Estilo Innegociables:
1. PROHIBICIÓN ABSOLUTA DE SALUDOS Y PREÁMBULOS:
   - NUNCA uses "Hola", "¡Hola!", "Saludos", "Estimado estudiante", "Bienvenido", "En este segundo borrador he notado...", ni frases introductorias conversacionales.
   - Ve DIRECTAMENTE al diagnóstico de interlenguaje y al feedback formativo.
2. ANÁLISIS DE AUTO-REPARACIÓN (LEARNER UPTAKE):
   Compara exhaustivamente el Borrador 1 y el Borrador 2. Identifica si el alumno corrigió con éxito errores o brechas que estaban presentes en el Borrador 1.
   Para cada error que el alumno haya resuelto exitosamente por sí mismo, añade un elemento en "successful_repairs" con:
   - original_snippet: el fragmento erróneo en el Borrador 1 (ej. "depends of")
   - corrected_snippet: cómo lo corrigió en el Borrador 2 (ej. "depends on")
   - praise_es: felicitación pedagógica directa y concisa reconociendo el logro (ej. "¡Excelente! Corregiste la preposición fija a 'depends on' sin auxilio directo.", SIN saludos).
3. ERRORES RESIDUALES O NUEVOS:
   Explica en español POR QUÉ ocurre cada error que aún persista o sea nuevo en el Borrador 2, indicando si proviene de transferencia negativa del español L1 (directo, sin preámbulos).
4. REFORMULACIÓN NATIVA:
   Proporciona la reformulación nativa idiomática más natural para cada error residual.
5. RÚBRICA Y PUNTAJES:
   Evalúa el nivel estimado CEFR (A1, A2, B1, B2, C1, C2) y asigna puntajes (0.0 a 10.0) en grammar, vocabulary y coherence.
6. MICRO-RETOS:
   Genera al menos un "Micro-Reto" interactivo (opción múltiple con hueco '___') para consolidar de inmediato. Si detectas múltiples errores, puedes generar un array en "micro_challenges".
7. Devuelve ESTRICTAMENTE un objeto JSON válido con:
   - overall_feedback_es (string: diagnóstico global formativo directo y profesional, PROHIBIDO comenzar con "Hola" o saludos)
   - estimated_cefr ('A1'|'A2'|'B1'|'B2'|'C1'|'C2')
   - scores: { grammar, vocabulary, coherence }
   - successful_repairs: array de objetos { original_snippet, corrected_snippet, praise_es }
   - corrections: array de objetos con:
       * error_span (string): fragmento exacto del texto del estudiante que contiene el error.
       * error_type (string): ESTRICTAMENTE uno de ['GRAMMAR', 'LEXICON', 'PREPOSITION', 'WORD_ORDER', 'FALSE_FRIEND', 'PUNCTUATION', 'REGISTER', 'TENSE_ASPECT', 'AGREEMENT', 'COLLOCATION'].
       * taxonomy_code (string): código de error (ej. 'L1_PREP_DEPEND_ON', 'L1_AGREEMENT_SUBJECT_VERB', 'L1_FALSE_FRIEND_ACTUALLY').
       * is_l1_spanish_transfer (boolean): true si proviene de interferencia del español, false si es otro tipo de error.
       * explanation_es (string): explicación pedagógica concisa en español.
       * native_reformulation (string): formulación nativa y natural en inglés.
   - micro_challenge: { question_es, sentence_with_blank, options (array 2-4 strings), correct_option_index (0-3), explanation_es }
   - micro_challenges: array opcional de objetos micro-challenge adicionales
`;

    return this.executeWithQuotaFailover(
      'Taller de Redacción (Fase 2: Evaluación Final)',
      systemPrompt,
      draft2,
      (json) => WritingEvaluationResponseSchema.parse(json),
    );
  }

  public async lookupVocabWord(word: string): Promise<VocabEnrichmentResponse> {
    const systemPrompt = `
Eres un lexicógrafo y lingüista experto en el idioma inglés y en lingüística aplicada para hispanohablantes.
Tu tarea es analizar la palabra, frase o término en inglés proporcionado y generar una ficha léxica completa en formato JSON.

### Reglas Estrictas:
1. word: la palabra o locución/phrasal verb en inglés (limpia, en forma base o infinitivo si aplica, sin errores ortográficos).
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
8. exampleSentenceEn: una oración de ejemplo natural, idiomática y contemporánea donde se use la palabra en su significado principal en contexto real.
9. exampleSentenceEs: la traducción precisa al español de dicha oración de ejemplo.
10. isFalseFriend: true si la palabra es un falso cognado / falso amigo para hispanohablantes (ej. 'actually', 'realize', 'sensible', 'embarrassed', 'fabric', 'library', 'constipated'), false de lo contrario.
11. falseFriendNote: si es falso amigo, una breve explicación en español aclarando la confusión frecuente y qué significa realmente en español. Si no es falso amigo, null.
12. domainCategory: OBLIGATORIO. Categoría automática del dominio de uso del significado principal (ej: "Uso General", "Finanzas & Negocios", "Informática & Tecnología", "Físico / Espacial", "Coloquial / Slang", "Medicina & Salud", "Arte & Literatura", etc.).
13. spellingCorrection: Evalúa si la entrada del usuario contiene un error ortográfico o tipográfico (ej. 'acomodation' -> 'accommodation', 'definitly' -> 'definitely').
    - hasCorrection: boolean (true si hubo corrección ortográfica, false si fue escrita correctamente).
    - originalInput: el texto exacto ingresado por el usuario.
    - correctedWord: la palabra correcta en inglés.
    - explanationEs: breve explicación en español del error ortográfico corregido (ej. "Doble 'c' y doble 'm'").
14. isValidEnglishWord: boolean (true si es una palabra o expresión legítima en inglés, false si es una palabra inventada o sin sentido reconocible).
15. verbTenses: OBLIGATORIO SI partOfSpeech === 'VERB', de lo contrario null.
    Objeto con:
    - infinitive: forma base en infinitivo (ej. "break")
    - pastSimple: forma de pasado simple V2 (ej. "broke")
    - pastParticiple: forma de participio pasado V3 (ej. "broken")
    - thirdPersonPresent: tercera persona singular en presente (ej. "breaks")
    - gerund: gerundio o presente continuo -ing (ej. "breaking")
    - isIrregular: boolean (true si es irregular, false si es regular con -ed)
    - edPhoneticEnding: si es regular, la regla fonética de la terminación '-ed': ESTRICTAMENTE uno de ['/t/', '/d/', '/ɪd/']. Si es irregular, null.
16. structuredFamily: desglose de la familia morfológica clasificada por categorías:
    - nouns: array de sustantivos derivados
    - verbs: array de verbos derivados
    - adjectives: array de adjetivos derivados
    - adverbs: array de adverbios derivados
17. morphologicalFamily: array plano de strings con todas las palabras derivadas para compatibilidad retrospectiva.
18. senses: Si la palabra tiene otros significados comúnmente utilizados (polisemia o uso contextual diferente, ej. 'run' = correr vs dirigir un negocio; 'bank' = banco financiero vs orilla de río), provee hasta 3 acepciones adicionales en este array de objetos:
    - id: identificador breve tipo "sns_1", "sns_2"
    - domainCategory: categoría automática asignada por ti (ej. "Finanzas", "Informática", "Sentido Físico", "Coloquial")
    - translationEs: traducción precisa de ese sentido
    - definitionEn: definición concisa de ese sentido
    - partOfSpeech: categoría gramatical de esa acepción
    - exampleSentenceEn: oración de ejemplo AUTÉNTICA y ESPECÍFICA para esta acepción
    - exampleSentenceEs: traducción de la oración de ejemplo
    - cefrLevel: nivel CEFR de esta acepción ('A1'|'A2'|'B1'|'B2'|'C1'|'C2')

Devuelve ESTRICTAMENTE un JSON válido con estas propiedades.
`;

    return this.executeWithQuotaFailover(
      'Enriquecimiento Léxico (Ficha de Vocabulario)',
      systemPrompt,
      word.trim(),
      (json) => VocabEnrichmentResponseSchema.parse(json),
    );
  }
}
