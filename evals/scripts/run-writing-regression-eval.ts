import fs from 'fs';
import path from 'path';
import {
  WritingSocraticDatasetSchema,
  WritingEvaluationDatasetSchema,
  WritingSocraticSample,
  WritingEvaluationSample,
} from '../schemas/writing-golden-dataset.schema';
import { WritingRegressionRunner, WritingRunReport } from '../runners/writing-regression-runner';
import { WritingLlmJudge } from '../judges/writing-llm-judge';

async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Uso: npx tsx evals/scripts/run-writing-regression-eval.ts [OPCIONES]

Opciones:
  --fast                Ejecuta únicamente Capa 1 y Capa 2 (Coste $0.00, ultrarrápido). [Por defecto]
  --full                Ejecuta las 3 Capas completas incluyendo el Juez LLM.
  --concurrency <n>     Número de workers simultáneos (def: cantidad de API keys activas).
  --domain [fase]       Filtra por 'socratic' (Fase 1) o 'eval' (Fase 2). [Por defecto ambas]
  --save-baseline       Guarda el resultado como línea base oficial ('baseline-writing-*.json').
  --compare [archivo]   Compara este run contra una línea base existente y reporta Delta R (ΔR).
  --sample <id>         Filtra la evaluación para una muestra específica (ej. GS-WRT-SOC-001).
  --simulate-mutation   Inyecta una mutación para verificar la detección y bloqueo de regresiones.
  --help, -h            Muestra esta ayuda.
    `);
    process.exit(0);
  }

  const isFull = args.includes('--full');
  const shouldSaveBaseline = args.includes('--save-baseline');
  const compareIdx = args.indexOf('--compare');
  const shouldCompare = compareIdx !== -1;
  const sampleIdx = args.indexOf('--sample');
  const targetSampleId = sampleIdx !== -1 && args[sampleIdx + 1] ? args[sampleIdx + 1] : null;
  const simulateMutation = args.includes('--simulate-mutation');

  const concurrencyIdx = args.indexOf('--concurrency');
  const customConcurrency = concurrencyIdx !== -1 && args[concurrencyIdx + 1] ? parseInt(args[concurrencyIdx + 1], 10) : undefined;

  const domainIdx = args.indexOf('--domain');
  const domainFilter = domainIdx !== -1 && args[domainIdx + 1] ? args[domainIdx + 1] : null;

  console.log('='.repeat(80));
  console.log('SUITE DE REGRESIÓN DE PROMPTS E IA: TALLER DE REDACCIÓN');
  console.log('='.repeat(80));

  const socraticPath = path.resolve(process.cwd(), 'evals/datasets/writing/writing-socratic-golden-dataset.v1.json');
  const evalPath = path.resolve(process.cwd(), 'evals/datasets/writing/writing-evaluation-golden-dataset.v1.json');

  const socraticDataset = WritingSocraticDatasetSchema.parse(JSON.parse(fs.readFileSync(socraticPath, 'utf-8')));
  const evalDataset = WritingEvaluationDatasetSchema.parse(JSON.parse(fs.readFileSync(evalPath, 'utf-8')));

  const runPhase = async (
    samples: Array<WritingSocraticSample | WritingEvaluationSample>,
    domain: 'writing_socratic' | 'writing_evaluation',
    version: string,
    baselineFilename: string,
  ) => {
    let filtered = targetSampleId ? samples.filter((s) => s.id === targetSampleId) : samples;
    if (filtered.length === 0) return null;

    console.log(`\n▶️ Ejecutando suite de regresión para [${domain}] (${filtered.length} muestras, Modo: ${isFull ? 'FULL' : 'FAST'})...`);

    const candidateOutputsMap = new Map<string, unknown>();

    // Simulación de mutación si se solicita
    if (simulateMutation && filtered.length > 0) {
      const mutSample = filtered[0];
      console.log(`🧪 Inyectando mutación de prueba en muestra ${mutSample.id} para verificar detección de regresión...`);
      if (domain === 'writing_socratic') {
        candidateOutputsMap.set(mutSample.id, {
          overall_impression_es: 'Hola estimado alumno! ' + (mutSample.expected_output as any).overall_impression_es,
          error_count: 5,
          allow_self_correction: true,
          scaffolded_clues: [
            ...(mutSample.expected_output as any).scaffolded_clues,
            {
              paragraph_index: 1,
              clue_type: 'PREPOSITION',
              hint_question_es: '¿Falta una coma aquí?',
              highlighted_area: ',',
              sentence_context: 'Test, context',
              is_l1_spanish_transfer: false,
            },
          ],
        });
      } else {
        candidateOutputsMap.set(mutSample.id, {
          ...(mutSample.expected_output as any),
          overall_feedback_es: 'Hola estudiante! ' + (mutSample.expected_output as any).overall_feedback_es,
        });
      }
    }

    const judge = isFull ? new WritingLlmJudge() : undefined;

    const runReport = await WritingRegressionRunner.executeSuite(
      filtered,
      domain,
      version,
      {
        isFull,
        judge,
        concurrency: customConcurrency,
        candidateOutputsMap: candidateOutputsMap.size > 0 ? candidateOutputsMap : undefined,
        onProgress: (idx, total, sampleId, res) => {
          const statusIcon = res.passed ? '✅' : '❌';
          console.log(`   [${idx}/${total}] ${sampleId.padEnd(16)} ${statusIcon} Score: ${res.overallScore} (${res.durationMs}ms)`);
        },
      },
    );

    let comparisonReport;
    const baselineFile = baselineFilename;
    const baselinePath = path.resolve(process.cwd(), 'evals/reports', baselineFile);

    if (shouldCompare && fs.existsSync(baselinePath)) {
      const baselineJson: WritingRunReport = JSON.parse(fs.readFileSync(baselinePath, 'utf-8'));
      comparisonReport = WritingRegressionRunner.compareRuns(baselineJson, runReport);
      console.log(`\n📊 Comparativa de Regresión vs Línea Base (${baselineFile}):`);
      console.log(`   └─ Veredicto: ${comparisonReport.status}`);
      console.log(`   └─ Tasa de Regresión (ΔR): ${comparisonReport.deltaR}%`);
      console.log(`   └─ Tasa de Mejora (ΔM): ${comparisonReport.deltaM}%`);
      console.log(`   └─ Delta de Puntuación (ΔS): ${comparisonReport.deltaS}`);
      console.log(`   └─ Dictamen: ${comparisonReport.decisionRationale}`);
    }

    if (shouldSaveBaseline) {
      const savedPath = WritingRegressionRunner.saveBaseline(runReport, baselineFile);
      console.log(`💾 Línea base guardada en: ${savedPath}`);
    }

    const mdReport = WritingRegressionRunner.generateMarkdownAuditReport(runReport, comparisonReport);
    const mdPath = path.resolve(process.cwd(), 'evals/reports', `audit_${domain}_${Date.now()}.md`);
    fs.writeFileSync(mdPath, mdReport, 'utf-8');
    console.log(`📄 Reporte Markdown generado en: ${mdPath}`);

    return { runReport, comparisonReport };
  };

  let hadFailure = false;

  if (!domainFilter || domainFilter === 'socratic') {
    const res = await runPhase(
      socraticDataset.samples,
      'writing_socratic',
      socraticDataset.version,
      'baseline-writing-socratic.json',
    );
    if (res && res.runReport.failedSamples > 0 && !simulateMutation) hadFailure = true;
    if (res?.comparisonReport?.status.startsWith('REJECTED')) hadFailure = true;
  }

  if (!domainFilter || domainFilter === 'eval') {
    const res = await runPhase(
      evalDataset.samples,
      'writing_evaluation',
      evalDataset.version,
      'baseline-writing-evaluation.json',
    );
    if (res && res.runReport.failedSamples > 0 && !simulateMutation) hadFailure = true;
    if (res?.comparisonReport?.status.startsWith('REJECTED')) hadFailure = true;
  }

  console.log('\n' + '='.repeat(80));
  if (hadFailure) {
    console.error('❌ La suite de regresión detectó fallos o regresiones inaceptables.');
    process.exit(1);
  } else {
    console.log('✅ Suite de regresión completada con éxito.');
  }
}

main().catch((err) => {
  console.error('Error fatal:', err);
  process.exit(1);
});
