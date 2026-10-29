import fs from 'fs';
import path from 'path';
import {
  WritingSocraticDatasetSchema,
  WritingEvaluationDatasetSchema,
} from '../schemas/writing-golden-dataset.schema';
import { WritingLiveRunner } from '../runners/writing-live-runner';
import { WritingLlmJudge } from '../judges/writing-llm-judge';
import { resolveGeminiApiKeys } from '../judges/vocab-llm-judge';

async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Uso: npx tsx evals/scripts/run-writing-live-eval.ts [OPCIONES]

Ejecuta el pipeline del Taller de Redacción en vivo contra la API de Gemini
y evalúa las salidas generadas a través de la pirámide de evaluación.

Opciones:
  --fast                Modo rápido: Capa 1 y 2 en CPU sin Juez LLM.
  --full                Modo completo: Capas 1, 2 y 3 con Juez LLM (Gemini 3.5 Flash-Lite).
  --limit <n>           Procesa como máximo n muestras (def: 2 para smoke tests).
  --concurrency <n>     Número de workers simultáneos (def: cantidad de API keys activas).
  --model <id>          Modelo Gemini para generación (def: gemini-3.5-flash-lite).
  --domain <fase>       Filtra por 'socratic' (Fase 1) o 'eval' (Fase 2).
  --help, -h            Muestra esta ayuda.
    `);
    process.exit(0);
  }

  const isFull = args.includes('--full');
  const limitIdx = args.indexOf('--limit');
  const limit = limitIdx !== -1 && args[limitIdx + 1] ? parseInt(args[limitIdx + 1], 10) : 2;
  const modelIdx = args.indexOf('--model');
  const modelId = modelIdx !== -1 && args[modelIdx + 1] ? args[modelIdx + 1] : 'gemini-3.5-flash-lite';

  const domainIdx = args.indexOf('--domain');
  const domainFilter = domainIdx !== -1 && args[domainIdx + 1] ? args[domainIdx + 1] : null;

  const concurrencyIdx = args.indexOf('--concurrency');
  const customConcurrency = concurrencyIdx !== -1 && args[concurrencyIdx + 1] ? parseInt(args[concurrencyIdx + 1], 10) : undefined;

  const keys = resolveGeminiApiKeys();
  const effectiveConcurrency = customConcurrency ?? Math.max(1, keys.length);

  console.log('='.repeat(80));
  console.log(`EVALUACIÓN EN VIVO DEL TALLER DE REDACCIÓN [Modelo: ${modelId}]`);
  console.log(`🔑 Claves Gemini detectadas: ${keys.length} | ⚡ Concurrencia: ${effectiveConcurrency} worker(s)`);
  console.log('='.repeat(80));

  const socraticPath = path.resolve(process.cwd(), 'evals/datasets/writing/writing-socratic-golden-dataset.v1.json');
  const evalPath = path.resolve(process.cwd(), 'evals/datasets/writing/writing-evaluation-golden-dataset.v1.json');

  const socraticDataset = WritingSocraticDatasetSchema.parse(JSON.parse(fs.readFileSync(socraticPath, 'utf-8')));
  const evalDataset = WritingEvaluationDatasetSchema.parse(JSON.parse(fs.readFileSync(evalPath, 'utf-8')));

  const judge = isFull ? new WritingLlmJudge(undefined, modelId) : undefined;

  if (!domainFilter || domainFilter === 'socratic') {
    console.log(`\n▶️ Fase 1: Pistas Socráticas (Límite: ${limit} muestras)...`);
    const sResult = await WritingLiveRunner.executeLiveSocraticSuite(
      socraticDataset.samples,
      socraticDataset.version,
      {
        isFull,
        limit,
        modelId,
        judge,
        concurrency: effectiveConcurrency,
        onProgress: (idx, total, id, res) => {
          console.log(`   [${idx}/${total}] ${id.padEnd(16)} ${res.passed ? '✅' : '❌'} (Score: ${res.overallScore}, ${res.durationMs}ms)`);
        },
      },
    );
    console.log(`Resumen Fase 1 en vivo: ${sResult.runReport.passedSamples}/${sResult.runReport.totalSamples} aprobadas (${sResult.runReport.passRate}%)`);
  }

  if (!domainFilter || domainFilter === 'eval') {
    console.log(`\n▶️ Fase 2: Doble Reformulación y Rúbricas (Límite: ${limit} muestras)...`);
    const eResult = await WritingLiveRunner.executeLiveEvaluationSuite(
      evalDataset.samples,
      evalDataset.version,
      {
        isFull,
        limit,
        modelId,
        judge,
        concurrency: effectiveConcurrency,
        onProgress: (idx, total, id, res) => {
          console.log(`   [${idx}/${total}] ${id.padEnd(16)} ${res.passed ? '✅' : '❌'} (Score: ${res.overallScore}, ${res.durationMs}ms)`);
        },
      },
    );
    console.log(`Resumen Fase 2 en vivo: ${eResult.runReport.passedSamples}/${eResult.runReport.totalSamples} aprobadas (${eResult.runReport.passRate}%)`);
  }

  console.log('\n' + '='.repeat(80));
  console.log('✅ Evaluación en vivo concluida.');
}

main().catch((err) => {
  console.error('Error fatal:', err);
  process.exit(1);
});
