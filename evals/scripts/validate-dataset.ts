import fs from 'node:fs';
import path from 'node:path';
import { GoldenDatasetSchema, GoldenSample } from '../schemas/golden-dataset.schema';

const DATASET_PATH = path.resolve(process.cwd(), 'evals/datasets/vocab/vocab-golden-dataset.v1.json');
const JSONL_PATH = path.resolve(process.cwd(), 'evals/datasets/vocab/vocab-golden-dataset.v1.jsonl');

export function validateGoldenDataset() {
  console.log('🔍 Iniciando validación formal del Golden Dataset Canónico...');
  console.log(`📂 Archivo fuente: ${DATASET_PATH}\n`);

  if (!fs.existsSync(DATASET_PATH)) {
    console.error(`❌ Error: No existe el archivo de dataset en ${DATASET_PATH}`);
    process.exit(1);
  }

  const rawContent = fs.readFileSync(DATASET_PATH, 'utf-8');
  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(rawContent);
  } catch (err) {
    console.error(`❌ Error de sintaxis JSON en ${DATASET_PATH}:`, (err as Error).message);
    process.exit(1);
  }

  const parseResult = GoldenDatasetSchema.safeParse(parsedJson);
  if (!parseResult.success) {
    console.error('❌ Fallo de validación de esquema Zod en el Golden Dataset:');
    console.error(JSON.stringify(parseResult.error.format(), null, 2));
    process.exit(1);
  }

  const dataset = parseResult.data;
  console.log(`✅ Esquema Zod validado exitosamente.`);
  console.log(`   - Versión: ${dataset.version}`);
  console.log(`   - Dominio: ${dataset.domain}`);
  console.log(`   - Total de muestras: ${dataset.samples.length}`);
  console.log(`   - Descripción: ${dataset.description}\n`);

  // 1. Verificación de unicidad de IDs
  const idMap = new Set<string>();
  for (const sample of dataset.samples) {
    if (idMap.has(sample.id)) {
      console.error(`❌ Error de integridad: ID duplicado detectado: "${sample.id}"`);
      process.exit(1);
    }
    idMap.add(sample.id);
  }
  console.log('✅ Integridad de identificadores: Todos los IDs son únicos y canónicos.');

  // 2. Análisis de distribución estratificada
  const categories: Record<string, number> = {
    nominal: 0,
    edge_case: 0,
    adversarial: 0,
    out_of_domain: 0,
  };

  for (const sample of dataset.samples) {
    categories[sample.category] = (categories[sample.category] || 0) + 1;
  }

  const total = dataset.samples.length;
  console.log('\n📊 Desglose de Distribución Estratificada:');
  console.log('---------------------------------------------------------------------');
  console.log('| Estrato        | Cantidad | Porcentaje Actual | Objetivo Estándar |');
  console.log('---------------------------------------------------------------------');

  const targets: Record<string, string> = {
    nominal: '~ 50%',
    edge_case: '~ 20%',
    adversarial: '~ 15%',
    out_of_domain: '~ 15%',
  };

  for (const [cat, count] of Object.entries(categories)) {
    const pct = ((count / total) * 100).toFixed(1);
    console.log(`| ${cat.padEnd(14)} | ${String(count).padStart(8)} | ${(pct + '%').padStart(17)} | ${targets[cat].padStart(17)} |`);
  }
  console.log('---------------------------------------------------------------------');

  const edgeAndAdv = categories.edge_case + categories.adversarial + categories.out_of_domain;
  const edgeAndAdvPct = (edgeAndAdv / total) * 100;
  console.log(`\n🛡️ Casos no nominales (Bordes + Adversarios + Out-of-Domain): ${edgeAndAdvPct.toFixed(1)}% (Mínimo recomendado: >= 30%)`);
  if (edgeAndAdvPct < 30) {
    console.warn('⚠️ Advertencia: El dataset contiene menos del 30% de casos no-nominales.');
  } else {
    console.log('✅ Cumple el criterio de robustez industrial contra el sesgo de complacencia.');
  }

  // 3. Generación / Sincronización de JSONL inmutable
  console.log(`\n💾 Sincronizando formato JSONL en: ${JSONL_PATH}...`);
  const jsonlLines = dataset.samples.map((s: GoldenSample) => JSON.stringify(s)).join('\n') + '\n';
  fs.writeFileSync(JSONL_PATH, jsonlLines, 'utf-8');
  console.log(`✅ Archivo JSONL exportado con éxito (${dataset.samples.length} líneas).`);

  console.log('\n✨ [Fase B] Verificación del Golden Dataset completada con 100% de éxito.');
}

validateGoldenDataset();

