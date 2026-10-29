import fs from 'fs';
import path from 'path';
import {
  WritingSocraticDatasetSchema,
  WritingEvaluationDatasetSchema,
} from '../schemas/writing-golden-dataset.schema';

function validateDatasetFile(filePath: string, schema: any, domainName: string): number {
  console.log(`\n🔍 Validando dataset de ${domainName}: ${filePath}`);
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Archivo no encontrado: ${filePath}`);
    process.exit(1);
  }

  const rawJson = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  const parseResult = schema.safeParse(rawJson);

  if (!parseResult.success) {
    console.error(`❌ Falló la validación Zod en ${domainName}:`);
    for (const issue of parseResult.error.issues) {
      console.error(`   [${issue.path.join('.')}] ${issue.message}`);
    }
    process.exit(1);
  }

  const dataset = parseResult.data;
  console.log(`✅ Esquema Zod válido: ${dataset.samples.length} muestras encontradas (versión ${dataset.version}).`);

  // 1. Unicidad de IDs
  const idSet = new Set<string>();
  for (const sample of dataset.samples) {
    if (idSet.has(sample.id)) {
      console.error(`❌ ID duplicado detectado: ${sample.id}`);
      process.exit(1);
    }
    idSet.add(sample.id);
  }
  console.log(`✅ Unicidad de IDs garantizada (0 duplicados).`);

  // 2. Distribución de categorías
  const categories: Record<string, number> = {};
  for (const s of dataset.samples) {
    categories[s.category] = (categories[s.category] || 0) + 1;
  }

  console.log(`📊 Distribución estratificada:`);
  for (const [cat, count] of Object.entries(categories)) {
    const pct = ((count / dataset.samples.length) * 100).toFixed(1);
    console.log(`   - ${cat}: ${count} (${pct}%)`);
  }

  const nonNominalCount = dataset.samples.length - (categories['nominal'] || 0);
  const nonNominalPct = (nonNominalCount / dataset.samples.length) * 100;
  console.log(`   └─ Ratio no-nominal: ${nonNominalPct.toFixed(1)}% (mínimo exigido: 40%)`);
  if (nonNominalPct < 40) {
    console.warn(`⚠️ Advertencia: el ratio no-nominal es inferior al 40% recomendado.`);
  }

  // 3. Sincronización con .jsonl
  const jsonlPath = filePath.replace(/\.json$/, '.jsonl');
  const lines = dataset.samples.map((s: any) => JSON.stringify(s)).join('\n');
  fs.writeFileSync(jsonlPath, lines + '\n', 'utf-8');
  console.log(`🔄 Archivo JSONL sincronizado: ${jsonlPath}`);

  return dataset.samples.length;
}

function main() {
  console.log('='.repeat(80));
  console.log('VALIDADOR DE DATASETS CANÓNICOS: TALLER DE REDACCIÓN');
  console.log('='.repeat(80));

  const socraticPath = path.resolve(process.cwd(), 'evals/datasets/writing/writing-socratic-golden-dataset.v1.json');
  const evalPath = path.resolve(process.cwd(), 'evals/datasets/writing/writing-evaluation-golden-dataset.v1.json');

  const socraticCount = validateDatasetFile(socraticPath, WritingSocraticDatasetSchema, 'Fase 1 (Socrática)');
  const evalCount = validateDatasetFile(evalPath, WritingEvaluationDatasetSchema, 'Fase 2 (Evaluación y Recast)');

  console.log('\n' + '='.repeat(80));
  console.log(`🎉 Validación completada con éxito. Total muestras operativas: ${socraticCount + evalCount}`);
  console.log('='.repeat(80));
}

main();
