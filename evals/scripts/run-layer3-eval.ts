import fs from 'fs';
import path from 'path';
import { GoldenDatasetSchema, GoldenSample } from '../schemas/golden-dataset.schema';
import { VocabLlmJudge } from '../judges/vocab-llm-judge';
import { LayerEvaluator, LayerEvaluationResult } from '../runners/layer-evaluator';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  console.log('='.repeat(80));
  console.log('FASE D: CAPA 3 - LLM-AS-A-JUDGE (GEMINI 3.5 FLASH-LITE)');
  console.log('Auditoría Pedagógica, Rúbricas Booleanas Atómicas y Guardarraíl Determinista');
  console.log('='.repeat(80));

  // 1. Cargar Golden Dataset
  const datasetPath = path.resolve(process.cwd(), 'evals/datasets/vocab/vocab-golden-dataset.v1.json');
  if (!fs.existsSync(datasetPath)) {
    console.error(`❌ No se encontró el dataset en ${datasetPath}`);
    process.exit(1);
  }

  const rawJson = JSON.parse(fs.readFileSync(datasetPath, 'utf-8'));
  const dataset = GoldenDatasetSchema.parse(rawJson);
  console.log(`\n📚 Dataset cargado: ${dataset.domain} (v${dataset.version})`);
  console.log(`🤖 Modelo Juez configurado: gemini-3.5-flash-lite (Temperature: 0.1)\n`);

  const judge = new VocabLlmJudge(undefined, 'gemini-3.5-flash-lite');

  // =========================================================================
  // SUITE 1: Evaluación Canónica (Ground Truth Nominal vs Juez LLM)
  // =========================================================================
  console.log('─'.repeat(80));
  console.log('SUITE 1: Muestras Canónicas Golden (Verificación de Criterios Nominales)');
  console.log('─'.repeat(80));

  const testIds = ['GS-VOCAB-001', 'GS-VOCAB-002', 'GS-VOCAB-004'];
  const testSamples = dataset.samples.filter((s) => testIds.includes(s.id));

  let suite1Passed = 0;
  for (const sample of testSamples) {
    await sleep(500);
    process.stdout.write(`Evaluando [${sample.id}] "${sample.user_input}" (${sample.canonical_assertions.expected_grammatical_dimension ?? 'CONTENT'})... `);
    const result = await LayerEvaluator.evaluateSampleWithJudge(
      sample,
      sample.expected_output,
      judge,
    );

    if (result.passed && result.layer3?.passed) {
      console.log(`✅ APROBADO (Score: ${(result.overallScore * 100).toFixed(0)}%, Latencia: ${result.durationMs}ms)`);
      console.log(`   └─ CoT: ${result.layer3.verdict?.chainOfThought.slice(0, 110)}...`);
      suite1Passed++;
    } else {
      console.log(`❌ FALLÓ (Capa Fallida: ${result.failedLayer})`);
      if (result.layer1.error) console.log(`   └─ Error Capa 1: ${result.layer1.error}`);
      if (result.layer2.warnings.length > 0) console.log(`   └─ Avisos Capa 2: ${result.layer2.warnings.join(' | ')}`);
      if (result.layer3?.error) console.log(`   └─ Error Capa 3 (LLM): ${result.layer3.error}`);
      if (result.layer3?.verdict) {
        console.log(`   └─ Fallos Críticos: ${result.layer3.verdict.criticalFailures.join(', ')}`);
        console.log(`   └─ Feedback: ${result.layer3.verdict.actionableFeedback}`);
      }
    }
  }

  // =========================================================================
  // SUITE 2: Detección de Fallas Sutiles de SLA (Mutaciones Semánticas Interceptadas)
  // =========================================================================
  console.log('\n' + '─'.repeat(80));
  console.log('SUITE 2: Pruebas de Sensibilidad y Resistencia a Alucinaciones Pedagógicas');
  console.log('─'.repeat(80));

  // Mutación: Verbo Regular 'depend' (GS-VOCAB-003) con alófono de -ed incorrecto ('/t/' en vez de '/ɪd/')
  // Pasa Capa 1 y Capa 2, pero DEBE ser interceptado por el Juez en C5_PHONETIC_FIDELITY!
  const dependSample = dataset.samples.find((s) => s.id === 'GS-VOCAB-003')!;
  const subtleMutationDepend = JSON.parse(JSON.stringify(dependSample.expected_output));
  subtleMutationDepend.phoneticEdEnding = '/t/';

  await sleep(500);
  process.stdout.write(`Probando Mutación [depend con alófono erróneo '/t/']... `);
  const mutationResult = await LayerEvaluator.evaluateSampleWithJudge(
    dependSample,
    subtleMutationDepend,
    judge,
  );

  let suite2Passed = 0;
  if (!mutationResult.passed && mutationResult.layer3?.verdict?.criticalFailures.includes('C5_PHONETIC_FIDELITY')) {
    console.log(`🛡️ INTERCEPTADO EXITOSAMENTE`);
    console.log(`   └─ Veredicto Juez: FAILED (overallPassed: ${mutationResult.layer3.verdict.overallPassed})`);
    console.log(`   └─ Criterio fallido detectado: ${mutationResult.layer3.verdict.criticalFailures.join(', ')}`);
    console.log(`   └─ Evidencia citada: "${mutationResult.layer3.verdict.criteriaEvaluations.find((c) => c.criterionId === 'C5_PHONETIC_FIDELITY')?.evidenceExtracted}"`);
    console.log(`   └─ Crítica del Juez: ${mutationResult.layer3.verdict.criteriaEvaluations.find((c) => c.criterionId === 'C5_PHONETIC_FIDELITY')?.critique}`);
    suite2Passed++;
  } else {
    console.log(`❌ NO INTERCEPTADO (El Juez aprobó incorrectamente el alófono erróneo)`);
  }

  // =========================================================================
  // SUITE 3: Verificación del Principio de Cortocircuito (Short-Circuit)
  // =========================================================================
  console.log('\n' + '─'.repeat(80));
  console.log('SUITE 3: Principio de Cortocircuito (Ahorro de Cuota $0.00 ante Invariantes Violadas)');
  console.log('─'.repeat(80));

  // Violación de saludo en Capa 1: El evaluador no debe invocar la API del Juez LLM
  process.stdout.write(`Probando Cortocircuito en Capa 1 (saludo inicial 'Hello learner!')... `);
  const greetingPayload = `Hello learner! Here is your card: ${JSON.stringify(makeSample.expected_output)}`;
  const shortCircuitResult = await LayerEvaluator.evaluateSampleWithJudge(
    makeSample,
    greetingPayload,
    judge,
  );

  let suite3Passed = 0;
  if (shortCircuitResult.shortCircuited && shortCircuitResult.failedLayer === 1 && !shortCircuitResult.layer3) {
    console.log(`⚡ CORTOCIRCUITO EXITOSO (<${shortCircuitResult.durationMs}ms, $0.00 consumido)`);
    console.log(`   └─ Error Capa 1: ${shortCircuitResult.layer1.error}`);
    console.log(`   └─ Llamada a Gemini 3.5 Flash-Lite: EVITADA (Capa 3 no ejecutada)`);
    suite3Passed++;
  } else {
    console.log(`❌ CORTOCIRCUITO FALLIDO`);
  }

  // =========================================================================
  // REPORTE DE EJECUCIÓN
  // =========================================================================
  console.log('\n' + '='.repeat(80));
  console.log('RESUMEN DE VERIFICACIÓN DE FASE D (LLM-AS-A-JUDGE)');
  console.log('='.repeat(80));
  console.log(`Suite 1 (Muestras Canónicas Golden):        ${suite1Passed}/${testSamples.length} (${((suite1Passed / testSamples.length) * 100).toFixed(1)}%)`);
  console.log(`Suite 2 (Sensibilidad a Fallas Pedagógicas): ${suite2Passed}/1 (${((suite2Passed / 1) * 100).toFixed(1)}%)`);
  console.log(`Suite 3 (Cortocircuito y Ahorro de Cuota):   ${suite3Passed}/1 (${((suite3Passed / 1) * 100).toFixed(1)}%)`);

  const totalPassed = suite1Passed + suite2Passed + suite3Passed;
  const totalTests = testSamples.length + 2;

  if (totalPassed === totalTests) {
    console.log(`\n🎉 FASE D VALIDADA EXITOSAMENTE AL 100% (${totalPassed}/${totalTests})`);
    process.exit(0);
  } else {
    console.error(`\n⚠️ FASE D CON ADVERTENCIAS: ${totalTests - totalPassed} pruebas fallaron.`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('\n💥 Error fatal en runner de Fase D:', err);
  process.exit(1);
});
