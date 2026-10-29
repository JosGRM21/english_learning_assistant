import { GoogleGenAI } from '@google/genai';
import { toJSONSchema } from 'zod';
import { KeyPoolManager } from './key-pool-manager';
import { BatchStorageManager } from './storage-manager';
import { classifyGeminiError, GeminiErrorKind } from './error-classifier';
import { VOCAB_GENERATOR_SYSTEM_PROMPT, buildBatchUserPrompt, LemmaInputItem } from './prompt-builder';
import { BatchVocabResponseSchema, GeneratedVocabWord } from './schema';
import {
  isCanonicalWeakFormLemma,
  getCanonicalWeakFormSpec,
  calculatePhoneticEdEnding,
  COMMON_IRREGULAR_VERBS,
  isModalAuxiliaryVerb,
} from '../../src/core/phonetics/phonetic-rules';

/**
 * Aplica una capa de sanitización y guardarraíles deterministas post-LLM (Capa 1 en memoria)
 * para garantizar cumplimiento absoluto de invariantes fonológicas, morfológicas y léxicas.
 */
export function sanitizeGeneratedVocabWord(rawWord: GeneratedVocabWord): GeneratedVocabWord {
  const word = { ...rawWord };
  const lemma = word.word.toLowerCase().trim();

  // 1. Guardarraíl de Verbos, Irregulares y Modales Defectivos
  const hasVerbSense = word.senses.some((s) => s.partOfSpeech === 'VERB');
  const isKnownIrregular = COMMON_IRREGULAR_VERBS.has(lemma);
  const isModal = isModalAuxiliaryVerb(lemma);
  const isMarkedIrregular = word.verbTenses?.isIrregular ?? false;
  const isIrregular = isKnownIrregular || isMarkedIrregular;

  if (word.verbTenses && isKnownIrregular) {
    word.verbTenses.isIrregular = true;
  }

  if (!hasVerbSense || isIrregular || isModal || word.verbTenses === null) {
    // Si no tiene acepción verbal, es irregular, es verbo modal o no tiene conjugación regular, phoneticEdEnding DEBE ser null
    word.phoneticEdEnding = null;
    if (!hasVerbSense || isModal) {
      word.verbTenses = null;
    }
  } else if (hasVerbSense && !isIrregular && !isModal && word.verbTenses !== null) {
    // Verbo regular con conjugación completa: calcular y forzar deterministamente el alófono exacto
    word.phoneticEdEnding = calculatePhoneticEdEnding(word.ipaGeneralAmerican || lemma, lemma);
  }

  // 2. Guardarraíl de Formas Débiles (ipaWeakForm)
  if (word.grammaticalDimension === 'CONTENT') {
    // Palabras de contenido NUNCA tienen ipaWeakForm
    word.ipaWeakForm = null;
  } else if (word.grammaticalDimension === 'FUNCTION') {
    if (!isCanonicalWeakFormLemma(lemma)) {
      // Si la palabra funcional no está en el catálogo canónico (ej. each, during, if, etc.), debe ser null
      word.ipaWeakForm = null;
    } else {
      const spec = getCanonicalWeakFormSpec(lemma);
      if (spec) {
        // Si el LLM omitió la forma débil o la copió idéntica a la fuerte, asignar la forma canónica
        if (!word.ipaWeakForm || word.ipaWeakForm === word.ipaGeneralAmerican) {
          word.ipaWeakForm = spec.weakIpa;
        }
      }
    }
  }

  return word;
}

export interface PipelineConfig {
  batchSize: number; // 4 palabras por lote (def: 4)
  minIntervalMs?: number; // def: 6000 (10 RPM por worker)
  maxRetriesPerBatch: number; // def: 5
  modelId: string; // def: 'gemini-3.5-flash-lite'
  destinationCorpusPath: string; // def: 'src/data/core-vocab-corpus.json'
}

export class VocabGeneratorPipeline {
  private readonly keyPool: KeyPoolManager;
  private readonly storage: BatchStorageManager;
  private readonly config: PipelineConfig;

  constructor(
    apiKeys: string[],
    storageBaseDir = 'scripts/.cache/vocab_pipeline',
    configPartial: Partial<PipelineConfig> = {}
  ) {
    const minIntervalMs = configPartial.minIntervalMs ?? 6000;
    this.keyPool = new KeyPoolManager(apiKeys, minIntervalMs);
    this.storage = new BatchStorageManager(storageBaseDir);
    this.config = {
      batchSize: configPartial.batchSize ?? 4,
      minIntervalMs,
      maxRetriesPerBatch: configPartial.maxRetriesPerBatch ?? 5,
      modelId: configPartial.modelId ?? 'gemini-3.5-flash-lite',
      destinationCorpusPath: configPartial.destinationCorpusPath ?? 'src/data/core-vocab-corpus.json',
    };
  }

  /**
   * Ejecuta una petición individual de lote contra Gemini con el modelo flash lite
   */
  private async processSingleBatchWithRetry(
    batchId: string,
    lemmas: Array<string | LemmaInputItem>
  ): Promise<GeneratedVocabWord[]> {
    let attempt = 0;

    while (attempt < this.config.maxRetriesPerBatch) {
      attempt++;
      const managedKey = await this.keyPool.acquireKey();

      try {
        const ai = new GoogleGenAI({ apiKey: managedKey.key });
        const userPrompt = buildBatchUserPrompt(lemmas);

        const response = await ai.models.generateContent({
          model: this.config.modelId,
          contents: [
            {
              role: 'user',
              parts: [{ text: userPrompt }],
            },
          ],
          config: {
            systemInstruction: VOCAB_GENERATOR_SYSTEM_PROMPT,
            responseMimeType: 'application/json',
            responseSchema: toJSONSchema(BatchVocabResponseSchema) as any,
            temperature: 0.2,
          },
        });

        const rawText = response.text?.trim() ?? '{}';
        const parsed = JSON.parse(rawText);
        const batchResponse = BatchVocabResponseSchema.parse(parsed);

        if (batchResponse.items.length === 0) {
          throw new Error('La IA devolvió una lista vacía de palabras');
        }

        const items: GeneratedVocabWord[] = batchResponse.items.map((raw, idx) => {
          const inputLemma = lemmas[idx];
          let frequencyBand: GeneratedVocabWord['frequencyBand'] = raw.frequencyBand;

          // Derivar banda de frecuencia matemática desde rank para cumplir con el esquema Zod sin redundancia
          if (inputLemma && typeof inputLemma !== 'string') {
            if ('rank' in inputLemma && typeof (inputLemma as any).rank === 'number') {
              const r = (inputLemma as any).rank;
              frequencyBand = r <= 500 ? 'TOP_500' : r <= 1000 ? 'TOP_1000' : r <= 3000 ? 'TOP_3000' : 'TOP_5000';
            } else if ('frequencyBand' in inputLemma && (inputLemma as any).frequencyBand) {
              frequencyBand = (inputLemma as any).frequencyBand;
            }
          }

          return sanitizeGeneratedVocabWord({
            ...raw,
            word: raw.word.toLowerCase().trim(),
            frequencyBand,
            senses: raw.senses.map((s, sIdx) => ({
              ...s,
              senseId: s.senseId || `sense_${sIdx + 1}`,
            })),
          });
        });

        // Éxito comprobado
        this.keyPool.recordSuccess(managedKey.id);
        this.keyPool.releaseKey(managedKey.id);
        return items;
      } catch (err) {
        this.keyPool.releaseKey(managedKey.id);
        const classified = classifyGeminiError(err, attempt);

        console.warn(
          `[Batch ${batchId}] Intento ${attempt}/${this.config.maxRetriesPerBatch} falló (${classified.kind}) en ${managedKey.label}: ${classified.originalMessage.slice(0, 160)}`
        );

        if (classified.shouldDeactivateKey) {
          this.keyPool.markExhaustedDaily(managedKey.id);
        }

        if (classified.kind === GeminiErrorKind.RATE_LIMIT_RPM) {
          this.keyPool.recordRpmError(managedKey.id);
        }

        if (attempt >= this.config.maxRetriesPerBatch) {
          const stringLemmas = lemmas.map((l) => (typeof l === 'string' ? l : l.word));
          this.storage.recordFailedBatch(batchId, stringLemmas, classified.originalMessage);
          throw new Error(`Batch ${batchId} agotó los reintentos: ${classified.originalMessage}`);
        }

        if (classified.suggestedBackoffMs > 0) {
          console.log(`[Resiliencia] Esperando ${Math.round(classified.suggestedBackoffMs / 1000)}s antes de reintentar lote...`);
          await new Promise((resolve) => setTimeout(resolve, classified.suggestedBackoffMs));
        }
      }
    }

    throw new Error(`Batch ${batchId} falló inesperadamente.`);
  }

  /**
   * Ejecuta el pipeline completo de principio a fin de manera concurrente
   */
  public async run(seedLemmas: Array<string | LemmaInputItem>): Promise<void> {
    console.log('================================================================');
    console.log('🚀 Iniciando Pipeline de Generación Léxica con IA (Gemini)');
    console.log(`Lemas totales: ${seedLemmas.length}`);
    console.log(`Tamaño de lote: ${this.config.batchSize}`);
    console.log(`Modelo: ${this.config.modelId}`);
    console.log(`Pool de claves: ${this.keyPool.getStatusSummary()}`);
    console.log('================================================================');

    // 1. Fragmentar en lotes
    const batches: Array<{ batchId: string; lemmas: Array<string | LemmaInputItem> }> = [];
    for (let i = 0; i < seedLemmas.length; i += this.config.batchSize) {
      const slice = seedLemmas.slice(i, i + this.config.batchSize);
      const batchNum = Math.floor(i / this.config.batchSize) + 1;
      const batchId = `batch_${String(batchNum).padStart(5, '0')}`;
      batches.push({ batchId, lemmas: slice });
    }

    console.log(`Total de lotes generados: ${batches.length}`);

    // 2. Filtrar lotes ya completados (Idempotencia / Resume)
    const pendingBatches = batches.filter((b) => !this.storage.isBatchCompleted(b.batchId));
    const alreadyDone = batches.length - pendingBatches.length;
    console.log(`Lotes ya completados previamente en disco: ${alreadyDone}`);
    console.log(`Lotes pendientes por procesar: ${pendingBatches.length}`);

    if (pendingBatches.length === 0) {
      console.log('✨ Todos los lotes ya han sido procesados. Procediendo a compilar corpus...');
      const summary = this.storage.compileFinalCorpus(this.config.destinationCorpusPath);
      console.log(`✅ Compilación completa: ${summary.totalWords} palabras guardadas en ${summary.destination}`);
      return;
    }

    // 3. Concurrencia adaptativa: cantidad de workers simultáneos = número de claves activas
    const concurrency = Math.max(1, this.keyPool.getActiveKeysCount());
    console.log(`Iniciando ${concurrency} workers concurrentes para procesar la cola...`);

    let queueIndex = 0;
    let completedCount = alreadyDone;

    const worker = async (workerId: number) => {
      while (true) {
        if (this.keyPool.getActiveKeysCount() === 0) {
          throw new Error('Todas las claves han agotado cuota diaria. Deteniendo workers.');
        }

        const currentTaskIndex = queueIndex++;
        if (currentTaskIndex >= pendingBatches.length) {
          break; // Fin de la cola
        }

        const task = pendingBatches[currentTaskIndex];
        const startTime = Date.now();

        try {
          const items = await this.processSingleBatchWithRetry(task.batchId, task.lemmas);
          this.storage.saveBatchResults(task.batchId, items);
          completedCount++;

          const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(1);
          const percent = ((completedCount / batches.length) * 100).toFixed(1);
          const remainingBatches = batches.length - completedCount;
          const minIntervalSec = (this.config.minIntervalMs ?? 6000) / 1000;
          const etaMinutes = ((remainingBatches * Math.max(parseFloat(elapsedSec), minIntervalSec)) / (60 * concurrency)).toFixed(1);
          console.log(
            `[Progreso ${percent}% | ETA ~${etaMinutes}m] [Worker ${workerId}] Lote ${task.batchId} (${task.lemmas.length} palabras) completado en ${elapsedSec}s. (${completedCount}/${batches.length})`
          );
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          console.error(`[Error crítico en worker ${workerId}] Lote ${task.batchId}: ${msg}`);
          if (msg.includes('TODAS las claves')) {
            throw err;
          }
        }
      }
    };

    // Lanzar workers concurrentes
    const workers = Array.from({ length: concurrency }, (_, idx) => worker(idx + 1));
    await Promise.all(workers);

    // 4. Compilación final
    console.log('\n📦 Ensamblando y compilando lotes finales...');
    const result = this.storage.compileFinalCorpus(this.config.destinationCorpusPath);
    console.log(`\n🎉 ¡Proceso finalizado con éxito!`);
    console.log(`Palabras generadas e indexadas: ${result.totalWords}`);
    console.log(`Archivo compilado en: ${result.destination}`);
  }

  /**
   * Genera lemas directamente en memoria sin persistir en disco ni compilar corpus.
   * Diseñado para testing en vivo, suites de regresión y benchmarks sin efectos colaterales.
   */
  public async generateLemmasDirectly(
    seedLemmas: Array<string | LemmaInputItem>,
    onBatchProgress?: (completedBatches: number, totalBatches: number, currentBatchItems: GeneratedVocabWord[]) => void
  ): Promise<GeneratedVocabWord[]> {
    const results: GeneratedVocabWord[] = [];
    const batches: Array<{ batchId: string; lemmas: Array<string | LemmaInputItem> }> = [];

    for (let i = 0; i < seedLemmas.length; i += this.config.batchSize) {
      const slice = seedLemmas.slice(i, i + this.config.batchSize);
      const batchNum = Math.floor(i / this.config.batchSize) + 1;
      const batchId = `eval_live_batch_${String(batchNum).padStart(4, '0')}`;
      batches.push({ batchId, lemmas: slice });
    }

    for (let i = 0; i < batches.length; i++) {
      const b = batches[i];
      const items = await this.processSingleBatchWithRetry(b.batchId, b.lemmas);
      results.push(...items);
      onBatchProgress?.(i + 1, batches.length, items);
    }

    return results;
  }
}
