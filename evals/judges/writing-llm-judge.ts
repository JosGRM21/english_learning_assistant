import { GoogleGenAI } from '@google/genai';
import { toJSONSchema } from 'zod';
import {
  WritingSocraticJudgeInput,
  WritingEvaluationJudgeInput,
  WritingSocraticJudgeVerdict,
  WritingEvaluationJudgeVerdict,
  WritingSocraticJudgeVerdictSchema,
  WritingEvaluationJudgeVerdictSchema,
} from '../schemas/writing-judge-verdict.schema';
import { resolveGeminiApiKeys } from './vocab-llm-judge';
import { KeyPoolManager, ManagedApiKey } from '../../scripts/vocab-generator/key-pool-manager';
import { classifyGeminiError, GeminiErrorKind } from '../../scripts/vocab-generator/error-classifier';

const SocraticJudgeJsonSchema = toJSONSchema(WritingSocraticJudgeVerdictSchema);
const EvaluationJudgeJsonSchema = toJSONSchema(WritingEvaluationJudgeVerdictSchema);

export class WritingLlmJudge {
  private readonly keyPool: KeyPoolManager;
  private readonly modelId: string;

  constructor(apiKey?: string, modelId = 'gemini-3.5-flash-lite', keyPool?: KeyPoolManager) {
    const keys = resolveGeminiApiKeys(apiKey);
    // Intervalo de seguridad de 4100ms para asegurar < 15 RPM en cuota gratuita
    this.keyPool = keyPool ?? new KeyPoolManager(keys, 4100, 1);
    this.modelId = modelId;
  }

  public getActiveKeysCount(): number {
    return this.keyPool.getActiveKeysCount();
  }

  public getTotalKeysCount(): number {
    return this.keyPool.getTotalKeysCount();
  }

  public getKeyPoolStatus(): string {
    return this.keyPool.getStatusSummary();
  }

  // =========================================================================
  // FASE 1: PROMPTS PARA EL JUEZ SOCRÁTICO
  // =========================================================================
  private buildSocraticSystemPrompt(): string {
    return `
Eres un Juez Auditor Pedagógico de Sistemas de IA en Adquisición de Segundas Lenguas (SLA), especializado en estudiantes hispanohablantes.
Tu misión es auditar las PISTAS SOCRÁTICAS Y ANDAMIAJE ZPD (Fase 1) generadas por un modelo para un borrador escrito en inglés.

Eres escéptico, exigente y riguroso.
Debes evaluar la salida generada contrastándola con el borrador original y las especificaciones pedagógicas.

### PROCEDIMIENTO DE AUDITORÍA OBLIGATORIO:
1. Analiza el BORRADOR ORIGINAL y el JSON GENERADO por la IA.
2. Escribe PRIMERO una cadena analítica profunda en 'chainOfThought' examinando la pertinencia pedagógica antes de emitir ningún veredicto booleano.
3. Evalúa estrictamente los 6 CRITERIOS ATÓMICOS INDEPENDIENTES (W1 a W6):
   - W1_SOCRATIC_SCAFFOLDING_PURITY: Deslices de rendimiento (Slips: concordancia, tiempos conocidos, orden) deben formular preguntas socráticas sin revelar la respuesta. Brechas de competencia (Gaps: preposiciones dependientes arbitrarias, colocaciones fijas, modismos) deben recibir reformulación directa (recast) con explicación contrastiva de uso.
   - W2_ERROR_DIAGNOSIS_FIDELITY: Los fragmentos señalados ('highlighted_area') corresponden a errores lingüísticos genuinos presentes en el texto y no a alucinaciones.
   - W3_L1_TRANSFER_ACCURACY: 'is_l1_spanish_transfer' debe ser TRUE solo para calcos o interferencias directas del español (ej. 'depend of', 'have 20 years', omisión de sujeto). Para errores intralingüísticos o de desarrollo ('goed', 'teached', -s de 3ª persona), DEBE ser FALSE.
   - W4_PEDAGOGICAL_TONE: Tono formativo, empático, sin condescendencia ni preámbulos vacíos.
   - W5_ZPD_CALIBRATION: Las pistas y modelos se sitúan en la Zona de Desarrollo Próximo del nivel CEFR objetivo indicado, sin vocabulario inaccesible ni explicaciones infantiles.
   - W6_CONCISENESS_NO_GREETINGS: Ausencia total de saludos ("Hola", "Saludos") y fórmulas conversacionales en todas las pistas e impresiones globales.
4. Para cada criterio:
   - Extrae en 'evidenceExtracted' la cita textual del JSON que sustenta tu veredicto.
   - Asigna 'passed': true si y solo si cumple impecablemente el estándar; false ante cualquier fallo o desvío.
   - Redacta una 'critique' técnica concisa.
6. CASOS ESPECIALES (TEXTO EN ESPAÑOL O SIN ERRORES EN INGLÉS):
   Si el texto del alumno está redactado íntegramente en español (fuera de dominio) o no contiene errores en inglés, el comportamiento esperado y correcto es 'error_count: 0' y 'scaffolded_clues: []', indicando en 'overall_impression_es' que redacte en inglés. En tales casos, W1 y W2 deben calificarse como 'passed: true'.
`;
  }

  private buildSocraticUserPrompt(input: WritingSocraticJudgeInput): string {
    const candidateStr = typeof input.candidateOutput === 'string'
      ? input.candidateOutput
      : JSON.stringify(input.candidateOutput, null, 2);

    return `
1. ENTRADA DEL ESTUDIANTE (BORRADOR 1):
"""
${input.userInput}
"""

2. CONTEXTO DE LA ACTIVIDAD:
- Nivel CEFR Objetivo: ${input.cefrTarget ?? 'B1'}
- Contexto de Lectura Previo: ${input.readingContext ?? 'Ninguno'}
- Consigna de Misión: ${input.missionInstructions ?? 'Escritura libre'}
- Palabras Meta SRS: ${input.targetWords ? input.targetWords.join(', ') : 'Ninguna'}

3. ASERCIONES CANÓNICAS ESPERADAS:
- Códigos taxonómicos esperados: ${input.canonicalAssertions.expected_taxonomy_codes?.join(', ') || 'Cualquiera canónico pertinente'}
- Códigos prohibidos: ${input.canonicalAssertions.forbidden_taxonomy_codes?.join(', ') || 'Ninguno'}
- L1 Transfer flag esperado: ${input.canonicalAssertions.require_l1_transfer_flag !== undefined ? input.canonicalAssertions.require_l1_transfer_flag : 'N/A'}

4. HECHOS OBLIGATORIOS / TÉRMINOS PROHIBIDOS:
- Hechos obligatorios: ${input.mandatoryFacts?.join('; ') || 'Ninguno'}
- Términos prohibidos: ${input.prohibitedTerms?.join('; ') || 'Ninguno'}

5. PISTAS SOCRÁTICAS GENERADAS A AUDITAR:
\`\`\`json
${candidateStr}
\`\`\`

Ejecuta el procedimiento estricto: analiza en 'chainOfThought', extrae citas y califica los 6 criterios W1 a W6.
`;
  }

  // =========================================================================
  // FASE 2: PROMPTS PARA EL JUEZ DE EVALUACIÓN Y DOBLE RECAST
  // =========================================================================
  private buildEvaluationSystemPrompt(): string {
    return `
Eres un Juez Auditor Pedagógico de Sistemas de IA en SLA y Lingüística Aplicada, especializado en producción escrita en inglés para hispanohablantes.
Tu misión es auditar la EVALUACIÓN FORMATIVA FINAL, DOBLE REFORMULACIÓN Y EJERCICIOS (Fase 2) entregados a un estudiante que reescribió su texto (Borrador 1 -> Borrador 2).

Eres un auditor implacable y meticuloso.
Debes evaluar la salida generada contrastando ambos borradores con las especificaciones pedagógicas.

### PROCEDIMIENTO DE AUDITORÍA OBLIGATORIO:
1. Compara minuciosamente el BORRADOR 1 y el BORRADOR 2 frente al JSON GENERADO por la IA.
2. Desarrolla PRIMERO un análisis exhaustivo en 'chainOfThought' antes de emitir ningún dictamen booleano.
3. Evalúa estrictamente los 5 CRITERIOS ATÓMICOS INDEPENDIENTES (W7 a W11):
   - W7_CLEAN_STRUCTURAL_FIDELITY: 'clean_structural_version' repara EXCLUSIVAMENTE desajustes gramaticales, ortográficos y preposicionales del Borrador 2 (incluyendo corregir errores residuales del alumno), PRESERVANDO el vocabulario y la sintaxis básica del alumno (no usurpa su voz ni reescribe con giros idiomáticos avanzados o cambios estructurales, lo cual corresponde a W8).
   - W8_NATIVE_RECAST_NATURALNESS: 'native_recast_version' aporta una reformulación genuina de hablante fluido nativo (C1/C2) con transiciones cohesivas y colocaciones naturales.
   - W9_NOTICING_THE_GAP_EFFICACY: El panel 'noticing_the_gap_contrasts' contrasta fragmentos clave donde el alumno sonaba artificial o traducido, y 'noticing_note_es' explica con claridad el principio comunicativo.
   - W10_CEFR_AND_RUBRIC_COHERENCE: La rúbrica de 4 dimensiones ('accuracy', 'range_and_precision', 'cohesion_and_flow', 'pragmatics_and_complexity') en escala 0-10 y el nivel 'estimated_cefr' están fielmente calibrados a la calidad real del texto, sin notas infladas arbitrariamente.
   - W11_UPTAKE_AUTHENTICITY: Los elementos en 'successful_repairs' reconocen únicamente errores reales que existían en el Borrador 1 y que el estudiante subsanó por sí mismo en el Borrador 2 (cero reparaciones fantasma y cero cambios estilísticos o de contenido libre registrados erróneamente como reparaciones).
4. Para cada criterio:
   - Extrae en 'evidenceExtracted' la cita textual que fundamente tu veredicto.
   - Asigna 'passed': true solo si cumple estrictamente el estándar; false ante cualquier transgresión.
   - Redacta una 'critique' técnica concisa.
5. Veredicto global: 'overallPassed' solo puede ser true si los 5 criterios son 'passed: true'.
`;
  }

  private buildEvaluationUserPrompt(input: WritingEvaluationJudgeInput): string {
    const candidateStr = typeof input.candidateOutput === 'string'
      ? input.candidateOutput
      : JSON.stringify(input.candidateOutput, null, 2);

    return `
1. BORRADOR 1 (ORIGINAL PREVIO):
"""
${input.draft1}
"""

2. BORRADOR 2 (REESCRITURA DEL ESTUDIANTE):
"""
${input.draft2}
"""

3. CONTEXTO DE LA ACTIVIDAD:
- Nivel CEFR Objetivo: ${input.cefrTarget ?? 'B1'}
- Consigna de Misión: ${input.missionInstructions ?? 'Escritura libre'}
- Palabras Meta SRS: ${input.targetWords ? input.targetWords.join(', ') : 'Ninguna'}

4. ASERCIONES CANÓNICAS:
- Rango CEFR esperado: ${input.canonicalAssertions.expected_cefr_range?.join(' o ') || 'Cualquiera adecuado'}
- Reparaciones esperadas: ${input.canonicalAssertions.expected_repaired_snippets?.join('; ') || 'Ninguna obligatoria'}
- Similitud de voz mínima con Draft 2: ${input.canonicalAssertions.min_voice_preservation_similarity}

5. SALIDA DE EVALUACIÓN GENERADA A AUDITAR:
\`\`\`json
${candidateStr}
\`\`\`

Ejecuta el procedimiento estricto: analiza en 'chainOfThought', extrae citas y califica los 6 criterios W7 a W12.
`;
  }

  // =========================================================================
  // EJECUCIÓN CON RESILIENCIA Y GUARDARRAÍL DETERMINISTA
  // =========================================================================
  public async evaluateSocraticCandidate(input: WritingSocraticJudgeInput): Promise<WritingSocraticJudgeVerdict> {
    const systemPrompt = this.buildSocraticSystemPrompt();
    const userPrompt = this.buildSocraticUserPrompt(input);

    return this.executeJudgeQuery(
      systemPrompt,
      userPrompt,
      SocraticJudgeJsonSchema,
      WritingSocraticJudgeVerdictSchema,
    );
  }

  public async evaluateEvaluationCandidate(input: WritingEvaluationJudgeInput): Promise<WritingEvaluationJudgeVerdict> {
    const systemPrompt = this.buildEvaluationSystemPrompt();
    const userPrompt = this.buildEvaluationUserPrompt(input);

    return this.executeJudgeQuery(
      systemPrompt,
      userPrompt,
      EvaluationJudgeJsonSchema,
      WritingEvaluationJudgeVerdictSchema,
    );
  }

  private async executeJudgeQuery<T extends { criteriaEvaluations: any[]; chainOfThought: string; actionableFeedback: string }>(
    systemPrompt: string,
    userPrompt: string,
    responseJsonSchema: unknown,
    zodSchema: any,
  ): Promise<T> {
    let lastError: Error | null = null;
    const maxRetries = 4;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      let activeManagedKey: ManagedApiKey | null = null;

      try {
        activeManagedKey = await this.keyPool.acquireKey();
        const ai = new GoogleGenAI({ apiKey: activeManagedKey.key });
        const response = await ai.models.generateContent({
          model: this.modelId,
          contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
          config: {
            systemInstruction: systemPrompt,
            responseMimeType: 'application/json',
            responseSchema: responseJsonSchema as any,
            temperature: 0.1, // Consistencia máxima
          },
        });

        const rawText = response.text?.trim() ?? '{}';
        let parsedJson: unknown;
        try {
          parsedJson = JSON.parse(rawText);
        } catch (jsonErr) {
          throw new Error(`El Juez LLM emitió un JSON no válido: ${(jsonErr as Error).message}`);
        }

        const validated = zodSchema.parse(parsedJson);

        // =========================================================================
        // GUARDARRAÍL DETERMINISTA EN CÓDIGO TYPESCRIPT
        // La conjunción de criterios individuales manda sobre el booleano del LLM.
        // =========================================================================
        const failedCriteria = validated.criteriaEvaluations.filter((c: any) => !c.passed);
        const criticalFailures = failedCriteria.map((c: any) => c.criterionId);
        const actualOverallPassed = failedCriteria.length === 0;
        const computedScore = Number(
          ((validated.criteriaEvaluations.length - failedCriteria.length) /
            validated.criteriaEvaluations.length).toFixed(2),
        );

        this.keyPool.recordSuccess(activeManagedKey.id);

        return {
          chainOfThought: validated.chainOfThought,
          criteriaEvaluations: validated.criteriaEvaluations,
          overallPassed: actualOverallPassed,
          score: computedScore,
          criticalFailures,
          actionableFeedback: validated.actionableFeedback,
        } as T;
      } catch (err: any) {
        lastError = err;
        const classified = classifyGeminiError(err, attempt);

        if (activeManagedKey) {
          if (classified.shouldDeactivateKey || classified.kind === GeminiErrorKind.DAILY_QUOTA_EXHAUSTED) {
            this.keyPool.markExhaustedDaily(activeManagedKey.id);
          } else if (classified.kind === GeminiErrorKind.RATE_LIMIT_RPM) {
            this.keyPool.recordRpmError(activeManagedKey.id);
          }
        }

        if (classified.isRetryable && attempt < maxRetries && this.keyPool.getActiveKeysCount() > 0) {
          const backoffMs =
            classified.suggestedBackoffMs ||
            Math.min(1000 * Math.pow(2, attempt) + Math.random() * 500, 5000);
          await new Promise((res) => setTimeout(res, backoffMs));
          continue;
        }

        throw err;
      } finally {
        if (activeManagedKey) {
          this.keyPool.releaseKey(activeManagedKey.id);
        }
      }
    }

    throw lastError ?? new Error('El Juez LLM falló tras reintentos');
  }
}
