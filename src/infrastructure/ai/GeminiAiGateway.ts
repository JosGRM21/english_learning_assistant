import { GoogleGenAI } from '@google/genai';
import { toJSONSchema } from 'zod';
import {
  IAiGateway,
  SocraticContextualInfo,
  WritingEvaluationContextualInfo,
} from './IAiGateway';
import {
  SocraticFeedbackResponse,
  SocraticFeedbackResponseSchema,
  WritingEvaluationResponse,
  WritingEvaluationResponseSchema,
  VocabEnrichmentResponse,
  VocabEnrichmentResponseSchema,
  sanitizeSocraticFeedback,
  sanitizeWritingEvaluation,
} from './schemas';
import { QuotaMatrixOrchestrator, GeminiModelId } from '../../core/ai/QuotaMatrixOrchestrator';

// Pre-compiled JSON Schemas for Gemini Structured Outputs
const SocraticFeedbackJsonSchema = toJSONSchema(SocraticFeedbackResponseSchema);
const WritingEvaluationJsonSchema = toJSONSchema(WritingEvaluationResponseSchema);
const VocabEnrichmentJsonSchema = toJSONSchema(VocabEnrichmentResponseSchema);

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
    responseSchema: unknown,
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
            responseSchema: responseSchema as any,
            temperature: 0.2, // Low temperature for consistent output
          },
        });

        const rawText = response.text?.trim() ?? '{}';
        let parsedJson: unknown;
        try {
          parsedJson = JSON.parse(rawText);
        } catch (jsonErr) {
          console.error(`[${actionName}] Error de parseo JSON. Salida cruda de la IA:`, rawText);
          throw new Error(`Respuesta no válida de la IA: formato JSON corrupto (${(jsonErr as Error).message})`);
        }

        let validated: T;
        try {
          validated = schemaValidator(parsedJson);
        } catch (valErr) {
          console.error(`[${actionName}] Error de validación de esquema Zod. JSON recibido:`, parsedJson);
          throw valErr;
        }

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
    contextualInfo?: SocraticContextualInfo,
  ): Promise<SocraticFeedbackResponse> {
    const readingContextNote = contextualInfo?.readingContext
      ? `\nContexto de Lectura Modelo:\n"""\n${contextualInfo.readingContext}\n"""\n`
      : '';
    const missionNote = contextualInfo?.missionInstructions
      ? `\nConsigna de Misión de Redacción:\n"""\n${contextualInfo.missionInstructions}\n"""\n`
      : '';
    const targetWordsNote =
      contextualInfo?.targetWords && contextualInfo.targetWords.length > 0
        ? `\nPalabras Objetivo que el estudiante intenta incorporar de su mazo SRS: [${contextualInfo.targetWords.join(', ')}]\n`
        : '';

    const systemPrompt = `
Eres "ELA Socratic Mentor", un mentor y profesor de inglés comunicativo, empático y experto en guiar a estudiantes hispanohablantes.
Tu misión es diagnosticar el PRIMER BORRADOR del estudiante e impulsar su auto-corrección mediante pistas pedagógicas claras, motivadoras y totalmente libres de jerga técnica.
Nivel objetivo CEFR: ${cefrTarget}.
${readingContextNote}${missionNote}${targetWordsNote}
### Principios Pedagógicos y Reglas Estrictas:
1. PROHIBICIÓN ABSOLUTA DE SALUDOS Y PREÁMBULOS:
   - NUNCA uses saludos ni fórmulas conversacionales ("Hola", "¡Hola!", "Saludos", "Bienvenido", etc.). Ve DIRECTAMENTE al análisis lingüístico.

2. PROHIBICIÓN TOTAL DE JERGA LINGÜÍSTICA Y METALENGUAJE TÉCNICO (REGLA FUNDAMENTAL):
   - Tus pistas y explicaciones van dirigidas a un ESTUDIANTE de inglés, no a un lingüista ni a un evaluador académico.
   - ESTRICTAMENTE PROHIBIDO usar tecnicismos gramaticales abstractos o crípticos, tales como:
     * "partícula idiomática fija", "partícula dependiente" o "partícula regida"
     * "régimen preposicional" o "sintagma preposicional/verbal"
     * "interlenguaje", "calco sintáctico de la L1" o "transferencia negativa"
     * "finitud verbal", "cláusula subordinada atributiva", "pro-drop"
     * "desajuste aspectual", "monotonía sintáctica", etc.
   - Utiliza siempre un lenguaje cotidiano, directo y natural en español, explicando el SIGNIFICADO REAL y el USO PRÁCTICO de las palabras con ejemplos sencillos y memorables.

3. LÍMITE DE CARGA COGNITIVA (RF-WRT-06):
   - Genera un MÁXIMO DE 3 PISTAS PRIORITARIAS en 'scaffolded_clues'.
   - Jerarquiza los fallos que más afecten la inteligibilidad, transferencias erróneas del español (L1) o patrones fosilizados. Reserva errores secundarios para la fase final.

4. EXCLUSIÓN TOTAL Y ABSOLUTA DE SIGNOS DE PUNTUACIÓN (RF-WRT-09):
   - ESTRICTAMENTE PROHIBIDO evaluar, señalar, preguntar o pedir signos de puntuación (comas, puntos, punto y coma, comillas, apóstrofes, dos puntos, guiones, signos de interrogación o exclamación).
   - ESTA PROHIBICIÓN APLICA A TODAS LAS CATEGORÍAS SIN EXCEPCIÓN. Por ejemplo:
     * NO señales comas en cláusulas relativas explicativas (como ', which' o ', who').
     * NO señales comas con conectores discursivos (como 'However,', 'Therefore,', 'Moreover,').
     * NO señales comas en cláusulas subordinadas o adverbiales (como 'When I arrived,').
     * NO señales comma splices ni oraciones yuxtapuestas mediante puntuación.
   - Si la única modificación en un fragmento es añadir o quitar un signo de puntuación, IGNORA ESE ERROR POR COMPLETO y NO generes ninguna pista sobre él.
   - El campo 'zpd_expected_token' DEBE ser siempre una palabra, preposición o colocación léxica completa, NUNCA un signo de puntuación.

5. TAXONOMÍA CANÓNICA EXCLUSIVA Y DIAGNÓSTICO EXACTO (RF-WRT-09):
   Cada pista debe categorizarse en uno de los 10 códigos oficiales:
   - FALSE_FRIEND: Términos empleados con sentido del español por semejanza formal o fonética engañosa.
     * REGLA ESPECÍFICA PARA 'assist' vs 'attend': Si el estudiante escribió 'assist to', 'assisted to' o 'assist' pretendiendo decir 'asistir a una reunión/evento/clase', CLASIFÍCALO SIEMPRE COMO 'FALSE_FRIEND' (NUNCA como 'PREPOSITION'). Explica con claridad meridiana: en inglés 'assist' significa 'ayudar o auxiliar' (ej. 'assist a customer'), mientras que para 'asistir o acudir a un evento o reunión' se usa el verbo 'attend' sin preposición (ej. 'attend the meeting').
     * Otros casos clave: 'actually' (en realidad / de hecho) vs 'currently' (actualmente); 'sensible' (sensato) vs 'sensitive' (sensible).
   - PREPOSITION: Uso de preposiciones erróneas dependientes de un verbo o adjetivo (ej. 'depend of' -> 'depend on'). Explica la analogía o colocación natural de forma sencilla (ej. "En español decimos depende de, pero en inglés depend se combina con on, como si se apoyara sobre algo"), NUNCA uses la frase "partícula idiomática fija".
   - TENSE_ASPECT: Desajustes de tiempos verbales o aspecto gramatical (ej. usar Present Perfect con expresiones cerradas de tiempo pasado como 'yesterday' o 'last night' -> requiere Past Simple).
   - AGREEMENT: Concordancia sujeto-verbo, -s de 3ª persona o concordancia de número. Explica de forma visual y concreta (ej. "Con he, she o it en presente simple, al verbo se le añade -s al final").
   - LEXICAL_COLLOCATION: Combinaciones poco naturales, colocaciones arbitrarias (make/do/take) o elección de vocabulario (ej. 'make a mistake', no 'do a mistake').
   - WORD_ORDER: Alteración del orden canónico de la frase en inglés.
   - COHESION_LINKERS: Nexos lógicos o conectores discursivos ausentes, inadecuados o repetitivos.
   - SYNTACTIC_VARIETY: Monotonía sintáctica u oraciones entrecortadas que se beneficiarían de conectores naturales.
   - REGISTER: Desajustes de registro formal/informal/académico.
   - SPELLING: Errores tipográficos u ortografía de palabras (EXCLUYENDO comas o puntos).

6. COMPLETITUD Y BIFURCACIÓN PEDAGÓGICA (SLIPS VS. GAPS, RF-WRT-05):
   Para evitar que el estudiante reciba pistas incompletas, TODOS los campos deben generarse con contenido real y de valor pedagógico:
   - Para Deslices de Rendimiento ("Slips" - concordancia, tiempos conocidos, ortografía, orden canónico):
     * 'hint_question_es': formula una pregunta socrática focalizada y cotidiana que guíe la auto-reflexión sin dar la respuesta directamente.
     * 'zpd_contrastive_es': breve recordatorio pedagógico amigable y directo de la regla o patrón.
     * 'zpd_cloze_sentence': la oración con el elemento problemático reemplazado exactamente por '[ ___ ]'.
     * 'zpd_expected_token': la palabra exacta requerida para rellenar el espacio.
     * 'zpd_native_model': la oración completa corregida.
   - Para Brechas de Competencia ("Gaps" - preposiciones regidas, colocaciones, falsos amigos, registro):
     * 'hint_question_es': pregunta guía sobre la diferencia de significado o el uso natural frente al español.
     * 'zpd_contrastive_es': OBLIGATORIO. Explicación directa y comprensible del significado y uso nativo (marco Significado-Forma-Uso). En falsos amigos, aclara qué significa la palabra errónea en inglés vs. la palabra nativa correcta.
     * 'zpd_expected_token': la palabra, verbo o colocación nativa correcta recomendada.
     * 'zpd_native_model': modelo nativo completo recomendado.
     * 'zpd_cloze_sentence': oración contextual con '[ ___ ]' para práctica activa.

7. MARCADO TRANSVERSAL DE TRANSFERENCIA L1 (RF-WRT-09):
   - Asigna obligatoriamente 'is_l1_spanish_transfer': true ÚNICAMENTE si la pista o desajuste se origina por interferencia directa del español (traducción literal de preposiciones como 'depend of', falsos amigos como 'assist to' o 'actually', calcos de perífrasis como 'am agree' o 'have 20 years', omisión de sujeto por pro-drop).
   - Asigna obligatoriamente 'is_l1_spanish_transfer': false para errores del desarrollo de la lengua inglesa (como 'buyed' -> 'bought', deslices de 3ª persona -s o erratas ortográficas generales).

8. EVITAR FALSOS POSITIVOS EN VARIANTES ESTÁNDAR:
   - No señales como error usos idiomáticos válidos o alternativas estándar en inglés ('work at a startup' vs 'work for a startup'; 'in/on the street'; 'different from/to'). Diagnostica EXCLUSIVAMENTE errores gramaticales o léxicos indudables.
`;

    const validated = await this.executeWithQuotaFailover(
      'Taller de Redacción (Fase 1: Pistas Socráticas)',
      systemPrompt,
      userText,
      SocraticFeedbackJsonSchema,
      (json) => {
        const parsed = SocraticFeedbackResponseSchema.parse(json);

        // Fail-fast validation: Ensure no required pedagogical fields are omitted by the AI
        for (let i = 0; i < parsed.scaffolded_clues.length; i++) {
          const clue = parsed.scaffolded_clues[i];
          const isGap = [
            'PREPOSITION',
            'LEXICAL_COLLOCATION',
            'FALSE_FRIEND',
            'REGISTER',
            'COHESION_LINKERS',
            'SYNTACTIC_VARIETY',
          ].includes(clue.clue_type);

          if (!clue.highlighted_area?.trim()) {
            throw new Error(`La IA omitió el fragmento destacado ('highlighted_area') en la pista #${i + 1}.`);
          }
          if (!clue.sentence_context?.trim()) {
            throw new Error(`La IA omitió la oración de contexto ('sentence_context') en la pista #${i + 1}.`);
          }
          if (isGap && !clue.zpd_contrastive_es?.trim()) {
            throw new Error(
              `La IA omitió la explicación pedagógica ('zpd_contrastive_es') en la pista #${i + 1} (${clue.clue_type}). Por favor, solicita de nuevo las pistas de mejora.`
            );
          }
          if (!isGap && !clue.hint_question_es?.trim()) {
            throw new Error(
              `La IA omitió la pregunta orientadora ('hint_question_es') en la pista #${i + 1} (${clue.clue_type}). Por favor, solicita de nuevo las pistas de mejora.`
            );
          }
          if (!clue.zpd_expected_token?.trim()) {
            throw new Error(
              `La IA omitió la corrección esperada ('zpd_expected_token') en la pista #${i + 1}. Por favor, solicita de nuevo las pistas de mejora.`
            );
          }
        }

        return parsed;
      },
    );

    return sanitizeSocraticFeedback(validated);
  }

  public async evaluateFinalPhase2(
    draft1: string,
    draft2: string,
    cefrTarget = 'B1',
    contextualInfo?: WritingEvaluationContextualInfo,
  ): Promise<WritingEvaluationResponse> {
    const readingContextNote = contextualInfo?.readingContext
      ? `\nContexto de Lectura Previo del Estudiante:\n"""\n${contextualInfo.readingContext}\n"""\n`
      : '';
    const missionNote = contextualInfo?.missionInstructions
      ? `\nConsigna de Misión de Redacción:\n"""\n${contextualInfo.missionInstructions}\n"""\n`
      : '';
    const targetWordsNote =
      contextualInfo?.targetWords && contextualInfo.targetWords.length > 0
        ? `\nPalabras Objetivo que el estudiante intentó incorporar de su mazo SRS: [${contextualInfo.targetWords.join(', ')}]\n`
        : '';

    const systemPrompt = `
Eres "ELA Mentor", un lingüista experto en Lingüística Aplicada y Adquisición de Segundas Lenguas (SLA), especializado en hispanohablantes.
El estudiante te entrega su segundo borrador tras haber revisado las pistas socráticas del primer borrador.
Nivel objetivo: ${cefrTarget}.

Borrador 1 (original previo): "${draft1}"
${readingContextNote}${missionNote}${targetWordsNote}
### Principios Pedagógicos y de Estilo:
1. PROHIBICIÓN ABSOLUTA DE SALUDOS Y PREÁMBULOS:
   - NUNCA uses saludos ni frases introductorias conversacionales. Ve DIRECTAMENTE al diagnóstico formativo.

2. ANÁLISIS RIGUROSO DE AUTO-REPARACIÓN (LEARNER UPTAKE, RF-WRT-06):
   Compara minuciosamente el Borrador 1 y el Borrador 2:
   - 'successful_repairs' SOLO debe registrar errores gramaticales o léxicos REALES del Borrador 1 que el estudiante corrigió satisfactoriamente al 100% en el Borrador 2.
   - PROHIBICIÓN DE REPARACIONES FANTASMA: Si el Borrador 2 es idéntico al Borrador 1, o si el estudiante no modificó ese fragmento, o si no había ningún error en el Borrador 1, 'successful_repairs' DEBE ser una lista vacía []. NUNCA copies una frase correcta del Borrador 1 a 'successful_repairs'.
   - PROHIBICIÓN DE REPARACIONES INCOMPLETAS: Si el estudiante modificó un error pero dejó un desajuste residual (ej. cambió 'assisted to' por 'attended to', reteniendo erróneamente 'to', o cambió 'don't know' por 'doesn't knows'), NO lo incluyas en 'successful_repairs'; debe clasificarse como error persistente en 'corrections'.
   - PROHIBICIÓN DE CAMBIOS ESTILÍSTICOS/CREATIVOS: Si el estudiante reformuló una oración o cambió palabras donde no había ningún error previo (ej. cambió 'works hard' por 'they help each other'), NO lo registres como 'successful_repair'.

3. DOBLE REFORMULACIÓN DE TEXTO COMPLETO (RF-WRT-07):
   - 'clean_structural_version': corrige exclusivamente errores gramaticales, ortográficos (spelling) y de concordancia, PRESERVANDO la voz, sintaxis y vocabulario original del estudiante.
   - 'native_recast_version': reescribe el texto completo como un profesional nativo C1/C2 con colocaciones idiomáticas, variedad sintáctica y transiciones fluidas.

4. PANEL CONTRASTIVO "NOTICING THE GAP" (RF-WRT-07):
   Destaca en 'noticing_the_gap_contrasts' los contrastes clave entre los fragmentos del alumno y la reformulación nativa, explicando en 'noticing_note_es' por qué la formulación nativa aporta naturalidad, precisión o concisión.

5. RÚBRICA MULTIDIMENSIONAL ANALÍTICA DE 4 EJES (RF-WRT-08):
   Evalúa en escala 0-10 los 4 ejes: 'accuracy' (precisión morfosintáctica), 'range_and_precision' (riqueza léxica), 'cohesion_and_flow' (cohesión y conectores) y 'pragmatics_and_complexity' (adecuación de registro y complejidad sintáctica), además del nivel global 'estimated_cefr'.
   - Calibración rigurosa de 'accuracy': si el Borrador 2 contiene errores gramaticales o de régimen preposicional persistentes, calibra con severidad la nota de accuracy (máximo 6 o 7 según gravedad; no infles notas con 9 o 10 cuando hay errores no resueltos).

6. EXCLUSIÓN TOTAL Y ABSOLUTA DE SIGNOS DE PUNTUACIÓN (RF-WRT-09):
   - ESTRICTAMENTE PROHIBIDO señalar, catalogar o corregir signos de puntuación (comas, puntos, etc.), incluso en cláusulas de relativo ('which'), conectores o delimitación de oraciones.
   - En 'corrections', NUNCA incluyas elementos cuyo 'error_span' sea únicamente un signo de puntuación.
   - La puntuación no debe penalizar la rúbrica multidimensional.

7. TAXONOMÍA CANÓNICA EN CORRECCIONES (RF-WRT-09):
   Tanto 'error_type' como 'taxonomy_code' deben ser exactamente uno de los 10 códigos: PREPOSITION, TENSE_ASPECT, FALSE_FRIEND, AGREEMENT, LEXICAL_COLLOCATION, WORD_ORDER, COHESION_LINKERS, SYNTACTIC_VARIETY, REGISTER, SPELLING.

8. DISCRIMINACIÓN RIGUROSA DE TRANSFERENCIA L1 EN CORRECCIONES (RF-WRT-09):
   - En cada elemento de 'corrections', asigna obligatoriamente 'is_l1_spanish_transfer': true ÚNICAMENTE cuando el error sea un calco o interferencia directa demostrable del español (traducción literal de preposiciones dependientes como 'depend of', falsos amigos como 'actually' por actualmente, omisión indebida de sujeto por lengua pro-drop como 'is important', calcos sintácticos como 'have 20 years' o 'am agree').
   - Asigna obligatoriamente 'is_l1_spanish_transfer': false para errores intralingüísticos o de desarrollo propios de la adquisición de la lengua inglesa (como la sobregeneralización morfológica en verbos irregulares: 'buyed' -> 'bought', 'goed' -> 'went', 'teached' -> 'taught'), deslices de tercera persona (-s) o deslices tipográficos/ortográficos generales.

9. RETROALIMENTACIÓN DE PALABRAS OBJETIVO (RF-WRT-03):
   Si se proporcionaron 'Palabras Objetivo', evalúa CADA UNA en el array 'target_words_feedback':
   - 'word': el término meta exacto.
   - 'used': booleano indicando si el alumno lo incluyó en el Borrador 2.
   - 'is_natural': booleano indicando si su uso fue idiomático, coherente y natural (o forzado/inadecuado).
   - 'feedback_es': micro-comentario pedagógico en español explicando por qué fue acertado o cómo integrarlo mejor.
`;

    const payloadUser = `Borrador 2 para evaluación final:\n"""\n${draft2}\n"""`;

    const validated = await this.executeWithQuotaFailover(
      'Taller de Redacción (Fase 2: Evaluación Final)',
      systemPrompt,
      payloadUser,
      WritingEvaluationJsonSchema,
      (json) => WritingEvaluationResponseSchema.parse(json),
    );

    return sanitizeWritingEvaluation(validated, draft1, draft2);
  }

  public async lookupVocabWord(word: string): Promise<VocabEnrichmentResponse> {
    const systemPrompt = `
Eres un lexicógrafo y lingüista pedagógico experto en la adquisición de segundas lenguas (SLA) para hispanohablantes.
Tu tarea es analizar el lema, palabra o término en inglés proporcionado y generar una ficha léxica estructurada completa de alta precisión orientada a convertir el conocimiento declarativo en conocimiento procedimental y práctico.

REGLAS PEDAGÓGICAS ESTRICTAS:
1. DIMENSIÓN GRAMATICAL (grammaticalDimension):
   - 'CONTENT': Palabras con significado léxico autónomo (sustantivos, verbos, adjetivos, adverbios).
   - 'FUNCTION': Palabras estructurales/gramaticales (artículos, preposiciones, pronombres, conjunciones, modales).
   - 'CHUNK': Expresiones o frases fijas/semifijas.

2. ACEPCIONES Y POLISEMIA (senses):
   - Genera de 1 a 3 acepciones principales jerarquizadas por frecuencia de uso real actual.
   - Cada acepción debe tener su propio 'partOfSpeech', 'cefrLevel', 'translationEs' focalizada y 'definitionEn' en Learner English.
   - 'contextualHint': Pista contextual corta y obligatoria para desambiguar el sentido (ej. "run a business" frente a "run 5 miles").
   - 'grammarPattern': Patrón sintáctico o régimen de complementación obligatorio si aplica (ej. 'depend + ON', 'interested + IN', 'explain sth TO sb', 'verb + -ing'). Si no tiene un régimen fijo, null.
   - 'countability': Si 'partOfSpeech' es 'NOUN', especifica obligatoriamente: 'COUNTABLE' [C], 'UNCOUNTABLE' [U] o 'BOTH' [C/U]. Para otras categorías gramaticales, null.
   - 'connotation': 'POSITIVE', 'NEGATIVE' o 'NEUTRAL'.
   - 'graduatedExamples': Obligatorio para cada sentido:
     * sentenceBasicEn y sentenceBasicEs: Ejemplo accesible (A1-B1) claro y pedagógico.
     * clozeTargetBasic: El fragmento exacto que corresponde a la palabra o su forma flexionada a ocultar.
     * sentenceAdvancedEn y sentenceAdvancedEs: Ejemplo enriquecido (B2-C1) en un contexto formal o auténtico.
     * clozeTargetAdvanced: El fragmento exacto a ocultar.

3. FONÉTICA, FORMAS DÉBILES Y ALÓFONOS (ipaWeakForm y phoneticEdEnding):
   - ipaGeneralAmerican: Transcripción IPA GA estándar.
   - ipaReceivedPronunciation: Transcripción británica RP si difiere.
   - ipaWeakForm: Si la palabra es funcional ('FUNCTION': preposiciones, conjunciones, pronombres, modales como 'can', 'for', 'to', 'that', 'and'), indica la forma débil reducida a Schwa en habla conectada (ej. 'kən', 'fər', 'tə'). Para palabras de contenido léxico, null.
   - phoneticEdEnding: Si es un verbo regular, indica obligatoriamente el alófono del sufijo -ed: '/t/', '/d/' o '/ɪd/'.

4. VERBOS FRASALES SATÉLITES (phrasalVerbs):
   - Si la palabra funciona como VERBO y tiene phrasal verbs esenciales, incluye entre 1 y 4 unidades. Para cada uno indica: 'text', 'meaningEs', 'definitionEn' (en inglés sencillo), 'ipaGeneralAmerican' (con acentuación ej: ˌraɪt ˈdaʊn), opcional 'ipaReceivedPronunciation', 'type' ('TYPE_1_INTRANSITIVE', 'TYPE_2_SEPARABLE', 'TYPE_3_INSEPARABLE', 'TYPE_4_THREE_PART'), 'pronounMustSplit' (true si los pronombres obligan a dividir la partícula ej. 'turn it off'), 'cefrLevel', 'example1', 'example1Es' (traducción al español de example1), y opcional 'example2', 'example2Es'.
   - Si la palabra NO funciona como verbo, deja 'phrasalVerbs' como un array vacío []. Los verbos frasales solo se asocian a verbos, nunca a preposiciones o adverbios.

5. INTERFERENCIA L1 (FALSOS AMIGOS):
   - Si la palabra induce a error por semejanza ortográfica con el español, marca 'isFalseFriend': true y explica la trampa y alternativa recomendada en 'falseFriendNote'.
`;

    return this.executeWithQuotaFailover(
      'Enriquecimiento Léxico (Ficha de Vocabulario)',
      systemPrompt,
      word.trim(),
      VocabEnrichmentJsonSchema,
      (json) => VocabEnrichmentResponseSchema.parse(json),
    );
  }
}
