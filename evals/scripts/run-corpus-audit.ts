import path from 'path';
import { CorpusAuditRunner } from '../runners/corpus-audit-runner';

async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Uso: npx tsx evals/scripts/run-corpus-audit.ts [OPCIONES]

Ejecuta el control de calidad estadístico sobre un corpus o archivo de lote generado.
Aplica un Censo Determinista al 100% (Capas 1 y 2) y Muestreo Estratificado con Juez LLM (Capa 3).

Opciones:
  --file <ruta>         Ruta al archivo JSON a auditar (por defecto: 'src/data/core-vocab-corpus.json').
  --sample-size <n>     Cantidad de muestras a evaluar con el Juez LLM (por defecto: calculado con Cochran/Wilson).
  --confidence <num>    Nivel de confianza estadístico [0.80 - 0.99] (por defecto: 0.95 = 95%).
  --threshold <num>     Umbral SLA mínimo de aceptación [0.80 - 0.99] (por defecto: 0.95 = 95%).
  --fast                Ejecuta únicamente el Censo Determinista al 100% en CPU sin invocar al Juez LLM ($0.00 coste).
  --help, -h            Muestra esta ayuda.
    `);
    process.exit(0);
  }

  const fileIdx = args.indexOf('--file');
  const filePath = fileIdx !== -1 && args[fileIdx + 1] ? args[fileIdx + 1] : 'src/data/core-vocab-corpus.json';

  const sampleSizeIdx = args.indexOf('--sample-size');
  const sampleSize = sampleSizeIdx !== -1 && args[sampleSizeIdx + 1] ? parseInt(args[sampleSizeIdx + 1], 10) : undefined;

  const confIdx = args.indexOf('--confidence');
  const confidenceLevel = confIdx !== -1 && args[confIdx + 1] ? parseFloat(args[confIdx + 1]) : 0.95;

  const threshIdx = args.indexOf('--threshold');
  const slaThreshold = threshIdx !== -1 && args[threshIdx + 1] ? parseFloat(args[threshIdx + 1]) : 0.95; // 95% SLA

  const isFast = args.includes('--fast');

  try {
    const report = await CorpusAuditRunner.auditCorpus(filePath, {
      sampleSize,
      confidenceLevel,
      slaThreshold,
      isFast,
    });

    // Código de salida según veredicto
    if (report.statisticalAudit) {
      if (report.statisticalAudit.decision.verdict === 'REJECTED') {
        console.error(`\n❌ AUDITORÍA RECHAZADA: El archivo '${filePath}' incumple el SLA exigido.`);
        process.exit(1);
      } else if (report.statisticalAudit.decision.verdict === 'QUARANTINE') {
        console.warn(`\n🟡 AUDITORÍA EN CUARENTENA: Se requiere revisión o ampliación de muestra.`);
        // No bloquea de inmediato si pasó el censo, pero advierte
      }
    } else if (report.deterministicAudit.failedCount > 0) {
      console.error(`\n❌ CENSO DETERMINISTA FALLIDO: Se detectaron ${report.deterministicAudit.failedCount} errores estructurales.`);
      process.exit(1);
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`\n💥 Error en la ejecución de la auditoría: ${msg}`);
    process.exit(1);
  }
}

main();
