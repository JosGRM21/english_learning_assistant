import fs from 'fs';
import path from 'path';
import { GoldenDatasetSchema, GoldenSample } from '../schemas/golden-dataset.schema';
import { RegressionRunner, RunReport } from '../runners/regression-runner';
import { VocabLlmJudge } from '../judges/vocab-llm-judge';

async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Uso: npx tsx evals/scripts/run-regression-eval.ts [OPCIONES]

Opciones:
  --fast                Ejecuta únicamente Capa 1 y Capa 2 (Coste $0.00, ultrarrápido). [Por defecto]
  --full                Ejecuta las 3 Capas completas incluyendo el Juez LLM (Gemini 3.5 Flash-Lite).
  --save-baseline       Guarda el resultado de este run como línea base oficial ('baseline-vocab.json').
  --compare [archivo]   Compara este run contra una línea base existente y reporta Delta R (ΔR).
  --sample <id>         Filtra la evaluación para una muestra específica (ej. GS-VOCAB-001).
  --simulate-mutation   Inyecta una mutación para verificar la detección y bloqueo de regresiones.
  --help, -h            Muestra esta ayuda.
    `);
    process.exit(0);
  }

  const isFull = args.includes('--full');
  const shouldSaveBaseline = args.includes('--save-baseline');
  const compareIdx = args.indexOf('--compare');
  const shouldCompare = compareIdx !== -1;
  const baselineFile = shouldCompare && args[compareIdx + 1] && !args[compareIdx + 1].startsWith('--')
    ? args[compareIdx + 1]
    : 'baseline-vocab.json';

  const sampleIdx = args.indexOf('--sample');
  const targetSampleId = sampleIdx !== -1 && args[sampleIdx + 1] ? args[sampleIdx + 1] : null;
  const simulateMutation = args.includes('--simulate-mutation');

  console.log('='.repeat(80));
  console.log('SUITE DE REGRESIÓN DE PROMPTS E IA (MÓDULO 09: EVALS & QA PROBABILÍSTICO)');
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

  // Si se simula una mutación para probar la sensibilidad de regresión
  if (simulateMutation) {
    console.log('⚠️ [MODO SIMULACIÓN] Inyectando mutación de regresión en GS-VOCAB-002 ("decision")...');
    samplesToRun = samplesToRun.map((s) => {
      if (s.id === 'GS-VOCAB-002') {
        const mutated = JSON.parse(JSON.stringify(s));
        // Mutar para romper Capa 1 (token con signos de puntuación prohibido)
        mutated.expected_output.word = '...';
        return mutated;
      }
      return s;
    });
  }

  console.log(`\n📚 Golden Dataset: ${dataset.domain} (v${dataset.version})`);
  console.log(`🎯 Modo de Ejecución: ${isFull ? 'FULL (Capas 1, 2 y 3 con Juez Gemini 3.5 Flash-Lite)' : 'FAST (Capas 1 y 2 Determinista + Heurística)'}`);
  console.log(`🔢 Muestras a evaluar: ${samplesToRun.length}\n`);

  let judge: VocabLlmJudge | undefined;
  if (isFull) {
    judge = new VocabLlmJudge();
  }

  // 2. Ejecutar la suite
  console.log('Ejecutando suite...');
  const runReport = await RegressionRunner.executeSuite(
    samplesToRun,
    dataset.version,
    judge,
    (index, total, sample, result) => {
      const statusIcon = result.passed ? '✅' : '❌';
      const layerInfo = result.passed ? `(Score: ${(result.overallScore * 100).toFixed(0)}%)` : `(Falló Capa ${result.failedLayer})`;
      console.log(`  [${index}/${total}] ${statusIcon} [${sample.id}] ${sample.user_input.padEnd(14)} ${layerInfo} [${result.durationMs}ms]`);
    },
  );

  console.log('\n' + '─'.repeat(80));
  console.log(`📊 RESUMEN DE EJECUCIÓN (${runReport.runId}):`);
  console.log(`   └─ Aprobadas: ${runReport.passedSamples}/${runReport.totalSamples} (${runReport.passRate}%)`);
  console.log(`   └─ Puntuación Media: ${(runReport.averageScore * 100).toFixed(1)}%`);
  console.log(`   └─ Latencia Media: ${runReport.averageDurationMs} ms por muestra`);
  console.log(`   └─ Archivo de corrida guardado en: evals/reports/runs/${runReport.runId}.json`);

  // 3. Guardar como baseline si se solicita
  if (shouldSaveBaseline) {
    const savedPath = RegressionRunner.saveAsBaseline(runReport, baselineFile);
    console.log(`\n💾 Línea Base (Baseline) guardada exitosamente en:\n   ${savedPath}`);
  }

  // 4. Comparar contra línea base si se solicita
  if (shouldCompare) {
    console.log('\n' + '='.repeat(80));
    console.log(`COMPARACIÓN DE REGRESIÓN FRENTE A: ${baselineFile}`);
    console.log('='.repeat(80));

    const baseline = RegressionRunner.loadBaseline(baselineFile);
    if (!baseline) {
      console.warn(`⚠️ No se encontró el archivo de baseline '${baselineFile}'. Ejecuta primero con --save-baseline.`);
    } else {
      const comparison = RegressionRunner.compareRuns(baseline, runReport);
      console.log(comparison.summaryMarkdown);

      // Guardar el reporte en markdown
      const reportMdPath = path.resolve(process.cwd(), `evals/reports/regression_${Date.now()}.md`);
      fs.writeFileSync(reportMdPath, comparison.summaryMarkdown, 'utf-8');
      console.log(`📄 Reporte Markdown de regresión guardado en:\n   ${reportMdPath}`);

      if (comparison.verdict.startsWith('REJECTED')) {
        console.error(`\n🚨 PIPELINE BLOQUEADO: Se detectó una regresión inadmisible.`);
        process.exit(1);
      } else {
        console.log(`\n✨ PIPELINE APROBADO: No se detectaron regresiones críticas.`);
      }
    }
  }

  process.exit(0);
}

main().catch((err) => {
  console.error('\n💥 Error fatal en runner de regresión:', err);
  process.exit(1);
});
