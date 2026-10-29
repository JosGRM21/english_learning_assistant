import { GoogleGenAI } from '@google/genai';
import { toJSONSchema } from 'zod';
import fs from 'fs';
import path from 'path';
import {
  VocabJudgeInput,
  VocabJudgeVerdict,
  VocabJudgeVerdictSchema,
  VocabCriterionId,
} from '../schemas/judge-verdict.schema';
import { KeyPoolManager, ManagedApiKey } from '../../scripts/vocab-generator/key-pool-manager';
import { classifyGeminiError, GeminiErrorKind } from '../../scripts/vocab-generator/error-classifier';

const VocabJudgeJsonSchema = toJSONSchema(VocabJudgeVerdictSchema);

/**
 * Carga las claves de API de Gemini desde el entorno o archivos .env / .env.local
 */
export function resolveGeminiApiKeys(explicitKey?: string): string[] {
  if (explicitKey && explicitKey.trim().length > 0) {
    return [explicitKey.trim()];
  }

  const keys: string[] = [];
  const envCandidates = [
    process.env.GEMINI_API_KEYS,
    process.env.GEMINI_API_KEY,
  ];

  for (const candidate of envCandidates) {
    if (candidate) {
      const parts = candidate.split(',').map((k) => k.trim().replace(/["']/g, '')).filter((k) => k.length > 0);
      keys.push(...parts);
    }
  }

  if (keys.length === 0) {
    const diskPaths = ['.env', '.env.local', 'scripts/.env'];
    for (const relPath of diskPaths) {
      const fullPath = path.resolve(process.cwd(), relPath);
      if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath, 'utf-8');
        for (const line of content.split('\n')) {
          const trimmed = line.trim();
          if (
            trimmed.startsWith('GEMINI_API_KEYS=') ||
            trimmed.startsWith('GEMINI_API_KEY=')
          ) {
            const val = trimmed.split('=')[1].trim().replace(/["']/g, '');
            const parts = val.split(',').map((k) => k.trim().replace(/["']/g, '')).filter((k) => k.length > 0);
            keys.push(...parts);
          }
        }
      }
    }
  }

  if (keys.length === 0) {
    throw new Error(
      'No se encontró ninguna clave GEMINI_API_KEYS o GEMINI_API_KEY configurada.',
    );
  }

  return [...new Set(keys)];
}

/**
 * Evaluador LLM-as-a-Judge de Capa 3 para Fichas de Vocabulario (SLA).
 * Utiliza Gemini 3.5 Flash-Lite con rúbricas booleanas atomizadas,
 * razonamiento Chain-of-Thought previo obligatorio y guardarraíl determinista.
 */
export class VocabLlmJudge {
  private readonly keyPool: KeyPoolManager;
  private readonly modelId: string;

  constructor(apiKey?: string, modelId = 'gemini-3.5-flash-lite', keyPool?: KeyPoolManager) {
    const keys = resolveGeminiApiKeys(apiKey);
    // Intervalo de seguridad de 4100ms: < 15 RPM por clave para cuota gratuita de Gemini
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

  /**
   * Genera el System Prompt del Juez Evaluador con Rúbricas Atómicas y Few-Shot Guidados.
   */
  private buildSystemPrompt(): string {
    return `
Eres un Juez Auditor de Calidad Lingüística y Pedagógica en Lingüística Aplicada y Adquisición de Segundas Lenguas (SLA), especializado en sistemas de IA para estudiantes hispanohablantes.

Tu función es auditar fichas léxicas de vocabulario en inglés generadas por modelos de lenguaje frente a especificaciones canónicas de dominio. Eres escéptico, riguroso e implacable: NO toleres calcos literales, combinaciones libres triviales ni explicaciones confusas.

### PROCEDIMIENTO DE EVALUACIÓN OBLIGATORIO:
1. Analiza minuciosamente el LEMA, las ESPECIFICACIONES CANÓNICAS y el JSON GENERADO A AUDITAR.
2. Genera PRIMERO un razonamiento crítico paso a paso en 'chainOfThought' examinando cada dimensión pedagógica antes de emitir ningún veredicto.
3. Evalúa de manera independiente y atómica CADA UNO de los 6 CRITERIOS (C1, C2, C4, C5, C6, C7).
4. Para cada criterio:
   - Extrae en 'evidenceExtracted' la cita textual literal del JSON que fundamenta tu juicio, o describe explícitamente lo que fue omitido.
   - Determina el booleano 'passed': 'true' ÚNICAMENTE si cumple plenamente el estándar; 'false' ante cualquier defecto, ambigüedad o violación.
   - Redacta una 'critique' concisa y técnica.
5. Emite 'overallPassed' en true SOLO SI los 6 criterios son true. Si tan solo 1 criterio falla, 'overallPassed' DEBE ser false.
6. Proporciona en 'actionableFeedback' una recomendación técnica directa para corregir los fallos.

### CATÁLOGO DE LOS 6 CRITERIOS ATÓMICOS ($c_i \in \{0, 1\}$):

1. C1_NATURALNESS_AND_IDIOMATICITY:
   - Las oraciones de ejemplo y definiciones están redactadas en inglés nativo, fluido e idiomático.
   - Libre de traducciones forzadas, calcos del español ("Spanglish") o construcciones artificiales de "translationese".

2. C2_CEFR_CALIBRATION:
   - El nivel de dificultad de las definiciones y oraciones de ejemplo graduadas se ajusta con rigor al nivel CEFR objetivo indicado en las especificaciones.
   - No contiene vocabulario inaccesible en ejemplos básicos (A1-B1) ni oraciones infantiles/triviales para niveles avanzados (B2-C1).

3. C4_SYNTACTIC_PRECISION:
   - El patrón gramatical ('grammarPattern') es formalmente correcto (ej. 'depend + ON + noun/gerund') si el término lo exige.
   - La contabilidad ('countability') es adecuada para sustantivos (COUNTABLE, UNCOUNTABLE o BOTH).
   - Los ejemplos graduados aplican fielmente el régimen sintáctico declarado.

4. C5_PHONETIC_FIDELITY:
   - Para palabras funcionales ('FUNCTION': preposiciones, conjunciones, pronombres, modales), 'ipaWeakForm' debe incluir la transcripción fonética reducida en habla conectada si y solo si la palabra pertenece al grupo cerrado de palabras con forma débil del inglés (ej. 'to' /tə/, 'for' /fər/, 'can' /kən/, 'that' /ðət/).
   - Pronombres personales ('we', 'she', 'who', 'he') admiten válidamente reducciones cuantitativas estándar sin Schwa (/wi/, /ʃi/, /hu/, /hi/).
   - Si la palabra funcional carece de forma débil en la fonología inglesa (ej. 'each', 'every', 'if', 'through', 'during', 'only', 'off', 'such', 'might', 'may'), 'ipaWeakForm' DEBE ser null.
   - Para palabras de contenido léxico ('CONTENT'), 'ipaWeakForm' debe ser obligatoriamente null.
   - Si es un verbo regular, 'phoneticEdEnding' debe indicar el alófono exacto del pasado: '/t/', '/d/' o '/ɪd/' (/ɪd/ tras /t/ o /d/; /t/ tras consonantes sordas; /d/ tras vocales o consonantes sonoras).
   - Para verbos irregulares o palabras no verbales, 'phoneticEdEnding' DEBE ser null.

5. C6_LEXICAL_DISAMBIGUATION:
   - Las acepciones diferencian con claridad los sentidos de la palabra con 'contextualHint' precisos.
   - Si la palabra es un falso amigo (false friend), está marcado correctamente en 'isFalseFriend' y explicado en 'falseFriendNote' sin ambigüedad.

6. C7_CONCISENESS_NO_VERBOSITY:
   - La ficha léxica es concisa, pedagógicamente eficiente y desprovista de relleno discursivo o preámbulos conversacionales innecesarios.

---
### EJEMPLOS FEW-SHOT DE CALIBRACIÓN:

#### CASO 1: CASO APROBADO (Passing Golden Example)
Entrada:
- Lema: "schedule"
- Especificaciones: CEFR B1, CONTENT, NOUN/VERB, patrón sintáctico opcional.
Salida generada:
{
  "word": "schedule",
  "grammaticalDimension": "CONTENT",
  "ipaGeneralAmerican": "/ˈskedʒ.uːl/",
  "ipaWeakForm": null,
  "phoneticEdEnding": "/d/",
  "senses": [
    {
      "partOfSpeech": "NOUN",
      "cefrLevel": "B1",
      "definitionEn": "A plan of activities or events and when they will happen.",
      "countability": "COUNTABLE"
    }
  ]
}
Veredicto del Juez:
{
  "chainOfThought": "El lema 'schedule' es palabra de contenido (CONTENT) y tiene ipaWeakForm en null correctamente. Las definiciones y ejemplos están calibrados al nivel B1. La contabilidad es COUNTABLE y la terminación -ed '/d/' es correcta para la base /l/ sonora.",
  "criteriaEvaluations": [
    { "criterionId": "C1_NATURALNESS_AND_IDIOMATICITY", "criterionName": "Naturalidad", "evidenceExtracted": "A plan of activities or events and when they will happen.", "passed": true, "critique": "Inglés nativo fluido y natural." },
    { "criterionId": "C2_CEFR_CALIBRATION", "criterionName": "Nivel CEFR", "evidenceExtracted": "cefrLevel: B1", "passed": true, "critique": "Vocabulario de soporte plenamente alineado a B1." },
    { "criterionId": "C4_SYNTACTIC_PRECISION", "criterionName": "Precisión Sintáctica", "evidenceExtracted": "countability: COUNTABLE", "passed": true, "critique": "Contabilidad correcta para este sentido." },
    { "criterionId": "C5_PHONETIC_FIDELITY", "criterionName": "Fonética", "evidenceExtracted": "ipaWeakForm: null, phoneticEdEnding: '/d/'", "passed": true, "critique": "CONTENT sin forma débil y alófono sonoro /d/ tras /l/." },
    { "criterionId": "C6_LEXICAL_DISAMBIGUATION", "criterionName": "Desambiguación", "evidenceExtracted": "definitionEn: A plan of activities...", "passed": true, "critique": "Sentido nominal bien delimitado." },
    { "criterionId": "C7_CONCISENESS_NO_VERBOSITY", "criterionName": "Concisión", "evidenceExtracted": "Estructura JSON compacta", "passed": true, "critique": "Sin relleno ni texto superfluo." }
  ],
  "overallPassed": true,
  "score": 1.0,
  "criticalFailures": [],
  "actionableFeedback": "Excelente generación, cumple los 6 estándares de calidad SLA."
}

#### CASO 2: CASO REPROBADO (Failing Edge-Case con Fallo Sutil)
Entrada:
- Lema: "start"
- Especificaciones: CEFR A1, CONTENT, VERB regular (exige alófono fonético /ɪd/ tras /t/).
Salida generada:
{
  "word": "start",
  "grammaticalDimension": "CONTENT",
  "ipaGeneralAmerican": "/stɑːrt/",
  "ipaWeakForm": null,
  "phoneticEdEnding": "/d/",
  "senses": [
    {
      "partOfSpeech": "VERB",
      "cefrLevel": "A1",
      "definitionEn": "To begin doing something.",
      "countability": null
    }
  ]
}
Veredicto del Juez:
{
  "chainOfThought": "El lema 'start' es un verbo regular terminado en consonante alveolar /t/. La regla fonológica del inglés exige obligatoriamente el alófono '/ɪd/' (con inserción de vocal de apoyo). La salida generó '/d/', lo cual constituye un fallo fonético crítico (C5_PHONETIC_FIDELITY).",
  "criteriaEvaluations": [
    { "criterionId": "C1_NATURALNESS_AND_IDIOMATICITY", "criterionName": "Naturalidad", "evidenceExtracted": "To begin doing something.", "passed": true, "critique": "Definición simple y natural en inglés." },
    { "criterionId": "C2_CEFR_CALIBRATION", "criterionName": "Nivel CEFR", "evidenceExtracted": "cefrLevel: A1", "passed": true, "critique": "Calibrado para nivel A1." },
    { "criterionId": "C4_SYNTACTIC_PRECISION", "criterionName": "Precisión Sintáctica", "evidenceExtracted": "partOfSpeech: VERB", "passed": true, "critique": "Categoría morfosintáctica correcta." },
    { "criterionId": "C5_PHONETIC_FIDELITY", "criterionName": "Fonética", "evidenceExtracted": "phoneticEdEnding: '/d/'", "passed": false, "critique": "Violación fonológica: la base termina en oclusiva alveolar /t/, por lo que exige obligatoriamente el alófono '/ɪd/', no '/d/'." },
    { "criterionId": "C6_LEXICAL_DISAMBIGUATION", "criterionName": "Desambiguación", "evidenceExtracted": "To begin doing something.", "passed": true, "critique": "Sentido básico bien definido." },
    { "criterionId": "C7_CONCISENESS_NO_VERBOSITY", "criterionName": "Concisión", "evidenceExtracted": "Estructura JSON compacta", "passed": true, "critique": "Sin verbosidad innecesaria." }
  ],
  "overallPassed": false,
  "score": 0.83,
  "criticalFailures": ["C5_PHONETIC_FIDELITY"],
  "actionableFeedback": "Corregir el alófono phoneticEdEnding a '/ɪd/' para el verbo 'start' terminado en /t/."
}
`;
  }

  /**
   * Construye el prompt de usuario con las aserciones canónicas y la salida generada.
   */
  private buildUserPrompt(input: VocabJudgeInput): string {
    const candidateStr =
      typeof input.candidateOutput === 'string'
        ? input.candidateOutput
        : JSON.stringify(input.candidateOutput, null, 2);

    const ca = input.canonicalAssertions;

    return `
AUDITORÍA DE FICHA LÉXICA:

1. LEMA A AUDITAR: "${input.lemma}"

2. ESPECIFICACIONES Y ASERCIONES CANÓNICAS:
- Dimensión Gramatical: ${ca.expected_grammatical_dimension ?? 'CONTENT'}
- Categoría Gramatical Principal: ${ca.expected_primary_part_of_speech ?? 'N/A'}
- Requiere Forma Débil (ipaWeakForm): ${ca.require_weak_form ? 'SÍ (obligatoria reducción legítima en habla conectada)' : 'NO (debe ser null)'}
- Requiere Alófono de Pasado -ed: ${ca.require_phonetic_ed_ending ? `SÍ (${ca.require_phonetic_ed_ending})` : 'NO (debe ser null)'}

3. HECHOS OBLIGATORIOS ESPERADOS:
${input.mandatoryFacts && input.mandatoryFacts.length > 0 ? input.mandatoryFacts.map((f) => `- ${f}`).join('\n') : '- Ninguno específico adicional'}

4. TÉRMINOS O PATRONES PROHIBIDOS:
${input.prohibitedTerms && input.prohibitedTerms.length > 0 ? input.prohibitedTerms.map((t) => `- ${t}`).join('\n') : '- Ninguno específico adicional'}

5. FICHA LÉXICA GENERADA A AUDITAR:
\`\`\`json
${candidateStr}
\`\`\`

Ejecuta el procedimiento estricto: analiza en 'chainOfThought', extrae evidencias y califica los 6 criterios atómicos.
`;
  }

  /**
   * Audita una ficha léxica utilizando el modelo Gemini 3.5 Flash-Lite
   * gestionando claves con KeyPoolManager (espaciado dinámico anti-RPM y aislamiento RPD).
   */
  public async evaluateCandidate(input: VocabJudgeInput): Promise<VocabJudgeVerdict> {
    const systemPrompt = this.buildSystemPrompt();
    const userPrompt = this.buildUserPrompt(input);

    let lastError: Error | null = null;
    const maxRetries = 3;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      let activeManagedKey: ManagedApiKey | null = null;

      try {
        activeManagedKey = await this.keyPool.acquireKey();
        const ai = new GoogleGenAI({ apiKey: activeManagedKey.key });
        const response = await ai.models.generateContent({
          model: this.modelId,
          contents: [
            {
              role: 'user',
              parts: [{ text: userPrompt }],
            },
          ],
          config: {
            systemInstruction: systemPrompt,
            responseMimeType: 'application/json',
            responseSchema: VocabJudgeJsonSchema as any,
            temperature: 0.1, // Temperatura baja para máxima consistencia y reproducibilidad
          },
        });

        const rawText = response.text?.trim() ?? '{}';
        let parsedJson: unknown;
        try {
          parsedJson = JSON.parse(rawText);
        } catch (jsonErr) {
          throw new Error(
            `El Juez LLM emitió una respuesta con formato JSON inválido: ${(jsonErr as Error).message}. Salida: ${rawText}`,
          );
        }

        // Validación estructural Zod
        const validated = VocabJudgeVerdictSchema.parse(parsedJson);

        // =========================================================================
        // GUARDARRAÍL DETERMINISTA EN CÓDIGO (Regla 3.4 y 5 del Knowledge Vault):
        // Nunca confiar ciegamente en el booleano 'overallPassed' del LLM.
        // Si algún criterio atómico tiene passed = false, se fuerza overallPassed = false.
        // =========================================================================
        const failedCriteria = validated.criteriaEvaluations.filter((c) => !c.passed);
        const criticalFailures = failedCriteria.map((c) => c.criterionId);

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
        };
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

  /**
   * Audita una lista de candidatos en paralelo distribuyendo las peticiones
   * entre las claves API activas en el pool con protección estricta anti-RPM y anti-RPD.
   * Concurrencia por defecto = número de claves API disponibles (ej. 5 workers paralelos).
   */
  public async evaluateCandidatesParallel(
    candidates: VocabJudgeInput[],
    options: {
      concurrency?: number;
      onProgress?: (
        completed: number,
        total: number,
        candidate: VocabJudgeInput,
        verdict?: VocabJudgeVerdict,
        error?: Error,
      ) => void;
    } = {},
  ): Promise<Array<{ input: VocabJudgeInput; verdict?: VocabJudgeVerdict; error?: string }>> {
    const total = candidates.length;
    if (total === 0) return [];

    const concurrency = Math.min(
      Math.max(1, options.concurrency ?? this.keyPool.getActiveKeysCount()),
      total,
    );

    const results: Array<{ input: VocabJudgeInput; verdict?: VocabJudgeVerdict; error?: string }> = new Array(total);
    let completedCount = 0;
    let nextQueueIndex = 0;

    const worker = async (_workerId: number) => {
      while (true) {
        if (this.keyPool.getActiveKeysCount() === 0) {
          throw new Error('Todas las claves API del pool han agotado su cuota diaria. Deteniendo evaluación.');
        }

        const currentIndex = nextQueueIndex++;
        if (currentIndex >= total) {
          break; // Fin de la cola de muestras
        }

        const candidate = candidates[currentIndex];
        try {
          const verdict = await this.evaluateCandidate(candidate);
          results[currentIndex] = { input: candidate, verdict };
          completedCount++;
          options.onProgress?.(completedCount, total, candidate, verdict);
        } catch (err: unknown) {
          const errorMsg = err instanceof Error ? err.message : String(err);
          results[currentIndex] = { input: candidate, error: errorMsg };
          completedCount++;
          options.onProgress?.(
            completedCount,
            total,
            candidate,
            undefined,
            err instanceof Error ? err : new Error(errorMsg),
          );
        }
      }
    };

    const workers = Array.from({ length: concurrency }, (_, idx) => worker(idx + 1));
    await Promise.all(workers);

    return results;
  }
}
