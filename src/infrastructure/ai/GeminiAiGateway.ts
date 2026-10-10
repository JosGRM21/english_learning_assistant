import { GoogleGenAI } from '@google/genai';
import { toJSONSchema } from 'zod';
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
        let cleanedJson = rawText;
        if (cleanedJson.startsWith('```')) {
          cleanedJson = cleanedJson.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
        }

        let parsedJson: unknown;
        try {
          parsedJson = JSON.parse(cleanedJson);
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
  ): Promise<SocraticFeedbackResponse> {
    const systemPrompt = `
Eres "ELA Socratic Mentor", un tutor lingüístico especializado en fomentar el autodescubrimiento y la reestructuración del interlenguaje en estudiantes hispanohablantes.
Tu misión es revisar el texto del estudiante en su PRIMER BORRADOR. Nivel objetivo CEFR: ${cefrTarget}.

### Principios Pedagógicos y de Estilo:
1. PROHIBICIÓN ABSOLUTA DE SALUDOS Y PREÁMBULOS:
   - NUNCA comiences con saludos ni fórmulas conversacionales como "Hola", "¡Hola!", "Saludos", "Bienvenido", "Estimado estudiante", "He revisado tu texto", etc.
   - Ve DIRECTAMENTE al análisis lingüístico y al contenido pedagógico sin introducciones vacías.
2. LÍMITE ESTRICTO DE ATENCIÓN COGNITIVA (RF-WRT-06):
   - Proporciona un MÁXIMO DE 3 FOCOS PRIORITARIOS en tus pistas socráticas. No abrumes al estudiante; prioriza los errores de mayor impacto comunicativo o transferencias L1 recurrentes.
3. BIFURCACIÓN PEDAGÓGICA SLIPS VS. GAPS (RF-WRT-05):
   - Para deslices de rendimiento ("Slips" - despistes en reglas que el alumno ya conoce a su nivel): formula una pregunta socrática focalizada sin dar la solución para inducir auto-reparación.
   - Para brechas de competencia ("Gaps" - falta de conocimiento, modismos desconocidos o falsos amigos fosilizados): provee reformulación directa (Recast) junto con la explicación del principio de uso en inglés vs. español.
4. EXCLUSIÓN TOTAL DE PUNTUACIÓN:
   - ESTRICTAMENTE PROHIBIDO señalar o crear pistas sobre signos de puntuación (comas, puntos faltantes, punto y coma, delimitación oracional o comma splices).
   - La ortografía (spelling/typos) sí es válida para señalar, pero NUNCA generes pistas sobre signos de puntuación.
`;

    return this.executeWithQuotaFailover(
      'Taller de Redacción (Fase 1: Pistas Socráticas)',
      systemPrompt,
      userText,
      SocraticFeedbackJsonSchema,
      (json) => SocraticFeedbackResponseSchema.parse(json),
    );
  }

  public async evaluateFinalPhase2(
    draft1: string,
    draft2: string,
    cefrTarget = 'B1',
    contextualInfo?: { readingContext?: string; targetWords?: string[] },
  ): Promise<WritingEvaluationResponse> {
    const readingContextNote = contextualInfo?.readingContext
      ? `\nContexto de Lectura Previo del Estudiante:\n"""\n${contextualInfo.readingContext}\n"""\n`
      : '';
    const targetWordsNote = contextualInfo?.targetWords && contextualInfo.targetWords.length > 0
      ? `\nPalabras Objetivo que el estudiante intentó incorporar de su mazo SRS: [${contextualInfo.targetWords.join(', ')}]\n`
      : '';

    const systemPrompt = `
Eres "ELA Mentor", un lingüista experto en Lingüística Aplicada y Adquisición de Segundas Lenguas (SLA), especializado en hispanohablantes.
El estudiante te entrega su segundo borrador tras haber revisado las pistas socráticas del primer borrador.
Nivel objetivo: ${cefrTarget}.

Borrador original previo (Draft 1): "${draft1}"
${readingContextNote}${targetWordsNote}
### Principios Pedagógicos y de Estilo:
1. PROHIBICIÓN ABSOLUTA DE SALUDOS Y PREÁMBULOS:
   - NUNCA uses saludos ni frases introductorias conversacionales. Ve DIRECTAMENTE al diagnóstico formativo.
2. ANÁLISIS DE AUTO-REPARACIÓN (LEARNER UPTAKE):
   Compara exhaustivamente el Borrador 1 y el Borrador 2. Identifica si el alumno corrigió con éxito errores o brechas que estaban presentes en el Borrador 1 y elogia los aciertos autónomos.
3. DOBLE REFORMULACIÓN DE TEXTO COMPLETO (RF-WRT-07):
   - Versión estructural limpia: corrige exclusivamente errores gramaticales, ortográficos (spelling) y de concordancia, PRESERVANDO la voz, sintaxis y vocabulario original del estudiante.
   - Versión nativa (Recast): reescribe el texto completo como un profesional nativo C1/C2 con colocaciones idiomáticas, variedad sintáctica y transiciones fluidas.
4. PANEL CONTRASTIVO "NOTICING THE GAP" (RF-WRT-08):
   Destaca los contrastes directos entre los fragmentos del alumno y la reformulación nativa, explicando por qué la formulación nativa suena natural.
5. RÚBRICA MULTIDIMENSIONAL ANALÍTICA DE 4 EJES (RF-WRT-09):
   Evalúa en escala 0-10 la precisión morfosintáctica (accuracy), amplitud de vocabulario (range_and_precision), cohesión y conectores (cohesion_and_flow), y pragmática/estilo (pragmatics_and_complexity), además de los puntajes estándar y CEFR estimado.
6. EJERCICIOS EXCLUSIVOS DE PRODUCCIÓN POSITIVA (CERO PRIMING NEGATIVO, RF-ERR-02):
   Para cada error persistente en las correcciones, proporciona un ejercicio pedagógico de producción positiva (Contextual Cloze, C-Test, Sentence Rewrite o Chunk Scramble).
   ¡ESTRICTAMENTE PROHIBIDO incluir opciones múltiples que muestren el error del alumno como distractor!
7. EXCLUSIÓN TOTAL DE PUNTUACIÓN:
   - ESTRICTAMENTE PROHIBIDO señalar, catalogar o corregir errores basados en signos de puntuación (comas, puntos faltantes, punto y coma, delimitación oracional o comma splices).
   - La ortografía (spelling/typos) es totalmente válida para corregir, pero ignora por completo cualquier ausencia o uso de comas y puntos. No incluyas correcciones de puntuación ni afectes negativamente la evaluación por signos de puntuación.
`;

    const payloadUser = `Borrador 2 para evaluación final:\n"""\n${draft2}\n"""`;

    return this.executeWithQuotaFailover(
      'Taller de Redacción (Fase 2: Evaluación Final)',
      systemPrompt,
      payloadUser,
      WritingEvaluationJsonSchema,
      (json) => WritingEvaluationResponseSchema.parse(json),
    );
  }

  public async lookupVocabWord(word: string): Promise<VocabEnrichmentResponse> {
    const systemPrompt = `
Eres un lexicógrafo y lingüista experto en el idioma inglés y en lingüística aplicada para hispanohablantes.
Tu tarea es analizar la palabra, frase o término en inglés proporcionado y generar una ficha léxica completa orientada a hispanohablantes.
Las explicaciones y traducciones deben ser en español neutro, claras, concisas y pedagógicas (estilo Oxford Learner's Dictionary).
Incluye pronunciación IPA (General American y Received Pronunciation si aplica), nivel CEFR, colocaciones naturales habituales, oraciones de ejemplo contextualizadas, detección y explicación de falsos amigos para hispanohablantes, familia morfológica y acepciones secundarias relevantes.
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
