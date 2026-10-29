import fs from 'node:fs';
import path from 'node:path';
import { GoldenDatasetSchema, GoldenSample } from '../schemas/golden-dataset.schema';
import { LayerEvaluator, LayerEvaluationResult } from '../runners/layer-evaluator';

const DATASET_PATH = path.resolve(process.cwd(), 'evals/datasets/vocab/vocab-golden-dataset.v1.json');

export function runLayer1And2Evaluations() {
  console.log('🚀 =========================================================================');
  console.log('   SUITE DE EVALUACIÓN CAPA 1 (DETERMINISTA) Y CAPA 2 (HEURÍSTICAS)');
  console.log('   Módulo 09: Calidad Probabilística & Pirámide de Evals de IA');
  console.log('=========================================================================\n');

  if (!fs.existsSync(DATASET_PATH)) {
    console.error(`❌ Error: No se encontró el dataset en ${DATASET_PATH}`);
    process.exit(1);
  }

  const dataset = GoldenDatasetSchema.parse(JSON.parse(fs.readFileSync(DATASET_PATH, 'utf-8')));
  console.log(`📦 Dataset cargado: ${dataset.description} (${dataset.samples.length} muestras, versión ${dataset.version})\n`);

  // =========================================================================
  // PARTE 1: Verificación de Consistencia Canónica (Golden Ground Truth)
  // =========================================================================
  console.log('▶️ [PARTE 1] Evaluando Ground Truth Canónico contra Capas 1 y 2...');
  console.log('--------------------------------------------------------------------------------------------------------');
  console.log('| ID Muestra     | Categoría     | L1 Pass | L2 Pass | Score | Latencia | Estado                      |');
  console.log('--------------------------------------------------------------------------------------------------------');

  let passedCount = 0;
  let totalDurationMs = 0;
  const results: LayerEvaluationResult[] = [];

  for (const sample of dataset.samples) {
    const res = LayerEvaluator.evaluateSample(sample, sample.expected_output);
    results.push(res);
    totalDurationMs += res.durationMs;

    if (res.passed) passedCount++;

    const statusBadge = res.passed ? '✅ APROBADO' : `❌ FALLÓ L${res.failedLayer}`;
    console.log(
      `| ${sample.id.padEnd(14)} | ${sample.category.padEnd(13)} | ${String(res.layer1.passed).padStart(7)} | ${String(res.layer2.passed).padStart(7)} | ${res.overallScore.toFixed(2).padStart(5)} | ${(res.durationMs.toFixed(2) + 'ms').padStart(8)} | ${statusBadge.padEnd(27)} |`,
    );
  }

  console.log('--------------------------------------------------------------------------------------------------------');
  const passRate = ((passedCount / dataset.samples.length) * 100).toFixed(1);
  const avgLat = (totalDurationMs / dataset.samples.length).toFixed(2);
  console.log(`\n📊 Resumen de Ground Truth: ${passedCount}/${dataset.samples.length} aprobados (${passRate}%). Latencia media: ${avgLat} ms por muestra.\n`);

  if (passedCount !== dataset.samples.length) {
    console.error('❌ Error: El Ground Truth canónico no obtuvo 100% de aprobación.');
    process.exit(1);
  }

  // =========================================================================
  // PARTE 2: Verificación de Sensibilidad a Errores y Cortocircuito (Fail-Fast)
  // =========================================================================
  console.log('▶️ [PARTE 2] Verificando Sensibilidad de Aserciones y Cortocircuito (Fail-Fast)...');

  const testMutations: Array<{
    name: string;
    sampleId: string;
    mutatedOutput: Record<string, any> | string;
    expectedLayerFail: 1 | 2;
    expectedErrorCode?: string;
  }> = [
    {
      name: 'Detección de saludo conversacional inicial prohibido ("¡Hola! Aquí tienes...")',
      sampleId: 'GS-VOCAB-001',
      mutatedOutput: '¡Hola! Aquí tienes la ficha de vocabulario de run.',
      expectedLayerFail: 1,
      expectedErrorCode: 'PROHIBITED_GREETING_DETECTED',
    },
    {
      name: 'Detección de token que solo contiene signos de puntuación ("...")',
      sampleId: 'GS-VOCAB-001',
      mutatedOutput: {
        ...dataset.samples.find((s: GoldenSample) => s.id === 'GS-VOCAB-001')!.expected_output,
        word: '...',
      },
      expectedLayerFail: 1,
      expectedErrorCode: 'PUNCTUATION_ONLY_TOKEN',
    },
    {
      name: 'Detección de omisión de forma débil (ipaWeakForm) en palabra funcional',
      sampleId: 'GS-VOCAB-011', // to
      mutatedOutput: {
        ...dataset.samples.find((s: GoldenSample) => s.id === 'GS-VOCAB-011')!.expected_output,
        ipaWeakForm: null, // Debería ser 'tə'
      },
      expectedLayerFail: 1,
      expectedErrorCode: 'MISSING_WEAK_FORM',
    },
    {
      name: 'Detección de alófono incorrecto de -ed (/t/ en vez de /ɪd/ para depend)',
      sampleId: 'GS-VOCAB-003', // depend
      mutatedOutput: {
        ...dataset.samples.find((s: GoldenSample) => s.id === 'GS-VOCAB-003')!.expected_output,
        phoneticEdEnding: '/t/', // Debería ser '/ɪd/'
      },
      expectedLayerFail: 1,
      expectedErrorCode: 'INVALID_PHONETIC_ED_ENDING',
    },
    {
      name: 'Detección de término prohibido en Capa 2 ("have a run" en lema run)',
      sampleId: 'GS-VOCAB-001',
      mutatedOutput: {
        ...dataset.samples.find((s: GoldenSample) => s.id === 'GS-VOCAB-001')!.expected_output,
        senses: [
          {
            ...dataset.samples.find((s: GoldenSample) => s.id === 'GS-VOCAB-001')!.expected_output.senses[0],
            definitionEn: 'To have a run in the morning park.', // Inyección de término prohibido
          },
          dataset.samples.find((s: GoldenSample) => s.id === 'GS-VOCAB-001')!.expected_output.senses[1],
        ],
      },
      expectedLayerFail: 2,
    },
  ];

  let mutationPasses = 0;
  for (const mut of testMutations) {
    const sample = dataset.samples.find((s: GoldenSample) => s.id === mut.sampleId)!;
    const res = LayerEvaluator.evaluateSample(sample, mut.mutatedOutput);

    const caughtCorrectly = !res.passed && res.failedLayer === mut.expectedLayerFail &&
      (mut.expectedErrorCode ? res.layer1.errorCode === mut.expectedErrorCode : true);

    if (caughtCorrectly) {
      mutationPasses++;
      console.log(`  ✅ [Captura Correcta] ${mut.name}`);
      console.log(`     -> Falla esperada en Capa ${res.failedLayer}. Cortocircuito: ${res.shortCircuited}. Código: ${res.layer1.errorCode || 'L2_VIOLATION'}`);
    } else {
      console.error(`  ❌ [Fallo de Detección] ${mut.name}`);
      console.error(`     -> Recibido: passed=${res.passed}, failedLayer=${res.failedLayer}, code=${res.layer1.errorCode}`);
    }
  }

  console.log(`\n🛡️ Sensibilidad de Fallos: ${mutationPasses}/${testMutations.length} mutaciones anómalas interceptadas.`);
  if (mutationPasses !== testMutations.length) {
    console.error('❌ Error: Algunas mutaciones anómalas no fueron interceptadas.');
    process.exit(1);
  }

  console.log('\n✨ [Fase C] Implementación de Capa 1 y Capa 2 verificada con 100% de éxito.');
}

runLayer1And2Evaluations();
