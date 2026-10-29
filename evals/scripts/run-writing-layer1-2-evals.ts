import fs from 'fs';
import path from 'path';
import {
  WritingSocraticDatasetSchema,
  WritingEvaluationDatasetSchema,
} from '../schemas/writing-golden-dataset.schema';
import { WritingLayerEvaluator } from '../runners/writing-layer-evaluator';

function main() {
  console.log('='.repeat(80));
  console.log('EVALUACIÓN RÁPIDA: CAPA 1 Y CAPA 2 (TALLER DE REDACCIÓN - COSTE $0.00)');
  console.log('='.repeat(80));

  const socraticPath = path.resolve(process.cwd(), 'evals/datasets/writing/writing-socratic-golden-dataset.v1.json');
  const evalPath = path.resolve(process.cwd(), 'evals/datasets/writing/writing-evaluation-golden-dataset.v1.json');

  const socraticDataset = WritingSocraticDatasetSchema.parse(JSON.parse(fs.readFileSync(socraticPath, 'utf-8')));
  const evalDataset = WritingEvaluationDatasetSchema.parse(JSON.parse(fs.readFileSync(evalPath, 'utf-8')));

  let totalPassed = 0;
  let totalEvaluated = 0;
  let totalMs = 0;

  console.log(`\n--- FASE 1: PISTAS SOCRÁTICAS Y ANDAMIAJE (${socraticDataset.samples.length} muestras) ---`);
  for (const sample of socraticDataset.samples) {
    totalEvaluated++;
    const res = WritingLayerEvaluator.evaluateSocraticSample(sample, sample.expected_output);
    totalMs += res.durationMs;
    if (res.passed) {
      totalPassed++;
      console.log(`  ✅ [${sample.id}] ${sample.category.padEnd(12)} APROBADO (Score: ${res.overallScore}, ${res.durationMs}ms)`);
    } else {
      console.log(`  ❌ [${sample.id}] ${sample.category.padEnd(12)} FALLO EN CAPA ${res.failedLayer}`);
      if (res.layer1.error) console.log(`     └─ L1 Error: ${res.layer1.error}`);
      if (res.layer2.warnings.length > 0) console.log(`     └─ L2 Warnings: ${res.layer2.warnings.join('; ')}`);
    }
  }

  console.log(`\n--- FASE 2: EVALUACIÓN, DOBLE RECAST Y NOTICING THE GAP (${evalDataset.samples.length} muestras) ---`);
  for (const sample of evalDataset.samples) {
    totalEvaluated++;
    const res = WritingLayerEvaluator.evaluateEvaluationSample(sample, sample.expected_output);
    totalMs += res.durationMs;
    if (res.passed) {
      totalPassed++;
      console.log(`  ✅ [${sample.id}] ${sample.category.padEnd(12)} APROBADO (Score: ${res.overallScore}, ${res.durationMs}ms)`);
    } else {
      console.log(`  ❌ [${sample.id}] ${sample.category.padEnd(12)} FALLO EN CAPA ${res.failedLayer}`);
      if (res.layer1.error) console.log(`     └─ L1 Error: ${res.layer1.error}`);
      if (res.layer2.warnings.length > 0) console.log(`     └─ L2 Warnings: ${res.layer2.warnings.join('; ')}`);
    }
  }

  const passRate = ((totalPassed / totalEvaluated) * 100).toFixed(1);
  const avgMs = (totalMs / totalEvaluated).toFixed(2);

  console.log('\n' + '='.repeat(80));
  console.log(`RESUMEN CAPAS 1 Y 2: ${totalPassed}/${totalEvaluated} APROBADAS (${passRate}%) | Latencia Media: ${avgMs} ms | Coste: $0.00`);
  console.log('='.repeat(80));

  if (totalPassed < totalEvaluated) {
    process.exit(1);
  }
}

main();
