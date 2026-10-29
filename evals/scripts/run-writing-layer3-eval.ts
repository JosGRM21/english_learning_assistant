import fs from 'fs';
import path from 'path';
import {
  WritingSocraticDatasetSchema,
  WritingEvaluationDatasetSchema,
  WritingSocraticSample,
  WritingEvaluationSample,
} from '../schemas/writing-golden-dataset.schema';
import { WritingLayerEvaluator } from '../runners/writing-layer-evaluator';
import { WritingLlmJudge } from '../judges/writing-llm-judge';

async function main() {
  const args = process.argv.slice(2);
  const sampleIdx = args.indexOf('--sample');
  const targetSampleId = sampleIdx !== -1 && args[sampleIdx + 1] ? args[sampleIdx + 1] : null;
  const modelIdx = args.indexOf('--model');
  const modelId = modelIdx !== -1 && args[modelIdx + 1] ? args[modelIdx + 1] : 'gemini-3.5-flash-lite';

  console.log('='.repeat(80));
  console.log(`AUDITORÍA CAPA 3: JUEZ LLM (TALLER DE REDACCIÓN) [Modelo: ${modelId}]`);
  console.log('='.repeat(80));

  const socraticPath = path.resolve(process.cwd(), 'evals/datasets/writing/writing-socratic-golden-dataset.v1.json');
  const evalPath = path.resolve(process.cwd(), 'evals/datasets/writing/writing-evaluation-golden-dataset.v1.json');

  const socraticDataset = WritingSocraticDatasetSchema.parse(JSON.parse(fs.readFileSync(socraticPath, 'utf-8')));
  const evalDataset = WritingEvaluationDatasetSchema.parse(JSON.parse(fs.readFileSync(evalPath, 'utf-8')));

  const allSamples: Array<WritingSocraticSample | WritingEvaluationSample> = [
    ...socraticDataset.samples,
    ...evalDataset.samples,
  ];

  const samplesToRun = targetSampleId
    ? allSamples.filter((s) => s.id === targetSampleId)
    : allSamples.slice(0, 3); // Por defecto una muestra representativa para preservar cuota si no se pasa --sample

  if (samplesToRun.length === 0) {
    console.error(`❌ Muestra no encontrada con ID: ${targetSampleId}`);
    process.exit(1);
  }

  const judge = new WritingLlmJudge(undefined, modelId);
  console.log(`🔑 Claves activas en pool: ${judge.getActiveKeysCount()}/${judge.getTotalKeysCount()}`);
  console.log(`Auditoría en curso sobre ${samplesToRun.length} muestra(s)...`);

  for (const sample of samplesToRun) {
    console.log(`\nAuditoría de muestra: ${sample.id} (${sample.category}) [${sample.domain}]`);
    const startTime = Date.now();
    const result = await WritingLayerEvaluator.evaluateSampleWithJudge(sample, sample.expected_output, judge);
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log(`Resultado global: ${result.passed ? '✅ APROBADO' : '❌ REPROBADO'} | Score: ${result.overallScore} | Tiempo: ${duration}s`);

    const verdict = result.layer3?.socraticVerdict || result.layer3?.evaluationVerdict;
    if (verdict) {
      console.log(`Razonamiento CoT:\n${verdict.chainOfThought}`);
      console.log('\nEvaluación por criterio atómico:');
      for (const crit of verdict.criteriaEvaluations) {
        console.log(`  ${crit.passed ? '🟢' : '🔴'} ${crit.criterionId}: ${crit.critique} (Cita: "${crit.evidenceExtracted.slice(0, 50)}...")`);
      }
      if (verdict.criticalFailures.length > 0) {
        console.log(`⚠️ Criterios fallidos: ${verdict.criticalFailures.join(', ')}`);
      }
      console.log(`Feedback de mejora: ${verdict.actionableFeedback}`);
    } else if (result.layer3?.error) {
      console.error(`❌ Error en Juez LLM: ${result.layer3.error}`);
    }
  }
}

main().catch((err) => {
  console.error('Error fatal:', err);
  process.exit(1);
});
