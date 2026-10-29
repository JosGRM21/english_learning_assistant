import fs from 'fs';
import path from 'path';
import { GoldenDatasetSchema, GoldenSample } from '../schemas/golden-dataset.schema';
import { LiveGeneratorRunner } from '../runners/live-generator-runner';
import { RegressionRunner } from '../runners/regression-runner';
import { VocabLlmJudge } from '../judges/vocab-llm-judge';

async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Uso: npx tsx evals/scripts/run-live-generator-eval.ts [OPCIONES]

Ejecuta el pipeline de generación (scripts/vocab-generator) en vivo contra los lemas
del Golden Dataset y evalúa las salidas generadas en memoria a través de la pirámide de evals.

Opciones:
  --fast                Ejecuta únicamente Capa 1 y Capa 2 sobre lo generado (Coste $0.00). [Por defecto]
  --full                Ejecuta las 3 Capas completas incluyendo el Juez LLM (Gemini 3.5 Flash-Lite).
  --limit <n>           Procesa solo los primeros n lemas del dataset (ideal para smoke tests rápidos).
  --sample <id>         Filtra la evaluación para una muestra específica (ej. GS-VOCAB-001).
  --compare [archivo]   Compara contra la línea base ('baseline-vocab.json') y bloquea si hay regresiones (Delta R > 0%).
  --help, -h            Muestra esta ayuda.
    `);
    process.exit(0);
  }

  const isFull = args.includes('--full');
  const compareIdx = args.indexOf('--compare');
  const shouldCompare = compareIdx !== -1;
  const baselineFile = shouldCompare && args[compareIdx + 1] && !args[compareIdx + 1].startsWith('--')
    ? args[compareIdx + 1]
    : 'baseline-vocab.json';

  const limitIdx = args.indexOf('--limit');
  const limit = limitIdx !== -1 && args[limitIdx + 1] ? parseInt(args[limitIdx + 1], 10) : undefined;

  const sampleIdx = args.indexOf('--sample');
  const targetSampleId = sampleIdx !== -1 && args[sampleIdx + 1] ? args[sampleIdx + 1] : null;

  console.log('='.repeat(80));
  console.log('EVALUACIÓN EN VIVO DEL GENERADOR DE VOCABULARIO (MÓDULO 09 SLA)');
  console.log('='.repeat(80));

  // 1. Cargar Golden Dataset
  const datasetPath = path.resolve(process.cwd(), 'evals/datasets/vocab/vocab-golden-dataset.v1.json');
  if (!fs.existsSync(datasetPath)) {
    console.error(`❌ Dataset no encontrado en: ${datasetPath}`);
    process.exit(1);
  }

  const rawJson = JSON.parse(fs.readFileSync(datasetPath, 'utf-8'));
  const dataset = GoldenDatasetSchema.parse(rawJson);

  let samplesToRun = dataset.samples;
  if (targetSampleId) {
    samplesToRun = dataset.samples.filter((s) => s.id === targetSampleId);
    if (samplesToRun.length === 0) {
      console.error(`❌ Muestra no encontrada con ID: ${targetSampleId}`);
      process.exit(1);
    }
  }

  if (limit) {
    samplesToRun = samplesToRun.slice(0, limit);
  }

  console.log(`📚 Golden Dataset: ${dataset.domain} (v${dataset.version})`);
  console.log(`🎯 Modo: ${isFull ? 'FULL (Generación en vivo + Capas 1, 2 y 3 con Juez Gemini)' : 'FAST (Generación en vivo + Capas 1 y 2 en CPU)'}`);
  console.log(`🔢 Lemas a generar y auditar: ${samplesToRun.length}\n`);

  let judge: VocabLlmJudge | undefined;
  if (isFull) {
    judge = new VocabLlmJudge();
  }

  // 2. Ejecutar evaluación viva
  const { runReport } = await LiveGeneratorRunner.executeLiveEvaluation(
    samplesToRun,
    dataset.version,
    {
      isFull,
      judge,
      onProgress: (index, total, sample, result, gen) => {
        const icon = result.passed ? '✅' : '❌';
        const info = result.passed
          ? `(Score: ${(result.overallScore * 100).toFixed(0)}%)`
          : `(Falló Capa ${result.failedLayer}: ${result.layer1.error ?? result.layer2.warnings[0] ?? 'L3'})`;
        console.log(`  [${index}/${total}] ${icon} [${sample.id}] ${sample.user_input.padEnd(14)} ${info} [${result.durationMs}ms]`);
      },
    },
  );

  console.log('\n' + '─'.repeat(80));
  console.log(`📊 RESUMEN DE GENERACIÓN EN VIVO (${runReport.runId}):`);
  console.log(`   └─ Aprobadas: ${runReport.passedSamples}/${runReport.totalSamples} (${runReport.passRate}%)`);
  console.log(`   └─ Puntuación Media: ${(runReport.averageScore * 100).toFixed(1)}%`);
  console.log(`   └─ Latencia Media Evaluación: ${runReport.averageDurationMs} ms por muestra`);
  console.log(`   └─ Trace guardado en: evals/reports/runs/${runReport.runId}.json`);

  // 3. Comparación de regresión si fue solicitada
  if (shouldCompare) {
    console.log('\n' + '='.repeat(80));
    console.log(`COMPARACIÓN DE REGRESIÓN FRENTE A: ${baselineFile}`);
    console.log('='.repeat(80));

    const baseline = RegressionRunner.loadBaseline(baselineFile);
    if (!baseline) {
      console.warn(`⚠️ No se encontró línea base en '${baselineFile}'.`);
      process.exit(0);
    }

    const comparison = RegressionRunner.compareRuns(baseline, runReport);
    console.log(comparison.summaryMarkdown);

    RegressionRunner.saveComparisonMarkdown(comparison);

    if (
      comparison.verdict === 'REJECTED_CRITICAL_REGRESSION' ||
      comparison.verdict === 'REJECTED_EXCESSIVE_DELTA'
    ) {
      console.error(`\n❌ PIPELINE BLOQUEADO: Se detectó una regresión crítica en las salidas vivas generadas.`);
      process.exit(1);
    } else {
      console.log(`\n✨ PIPELINE APROBADO: No se detectaron regresiones críticas en la generación en vivo.`);
    }
  }
}

main().catch((err) => {
  console.error('\n💥 Error fatal en la ejecución de evaluación en vivo:', err);
  process.exit(1);
});
