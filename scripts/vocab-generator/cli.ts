import fs from 'fs';
import path from 'path';
import { VocabGeneratorPipeline } from './pipeline';

// Cargar automáticamente variables desde un archivo .env si existe en la raíz
function loadEnvFile(): void {
  const envPaths = [path.resolve('.env'), path.resolve('.env.local'), path.resolve('scripts/.env')];
  for (const envPath of envPaths) {
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf-8');
      for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx !== -1) {
          const key = trimmed.slice(0, eqIdx).trim();
          let val = trimmed.slice(eqIdx + 1).trim();
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
          }
          if (!process.env[key]) {
            process.env[key] = val;
          }
        }
      }
    }
  }
}

async function main() {
  loadEnvFile();

  const args = process.argv.slice(2);
  const storage = new (await import('./storage-manager')).BatchStorageManager('scripts/.cache/vocab_pipeline');

  // Comandos de mantenimiento y limpieza rápida que no requieren claves API
  if (args.includes('--clean-cache')) {
    const { deletedBatches, deletedFailed } = storage.clearCache();
    console.log(`🧹 Caché de pipeline limpiada: ${deletedBatches} lotes eliminados. Registro de fallos eliminado: ${deletedFailed}`);
    return;
  }

  if (args.includes('--reset-corpus')) {
    storage.resetCorpus('src/data/core-vocab-corpus.json');
    console.log('🔄 Archivos src/data/core-vocab-corpus.json y core-phrasal-units.json reseteados a []');
    return;
  }

  if (args.includes('--compile')) {
    const summary = storage.compileFinalCorpus('src/data/core-vocab-corpus.json');
    console.log(`📦 Corpus compilado exitosamente: ${summary.totalWords} palabras guardadas en ${summary.destination}`);
    return;
  }

  // 1. Obtener claves API desde variables de entorno o archivo .env
  // Formato: GEMINI_API_KEYS="key1,key2,key3" o GEMINI_API_KEY="key1"
  const envKeysRaw = process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || '';
  const apiKeys = envKeysRaw
    .split(',')
    .map((k) => k.trim())
    .filter((k) => k.length > 0);

  if (apiKeys.length === 0) {
    console.error('❌ Error: No se encontraron claves API de Gemini configuradas.');
    console.error('Uso:');
    console.error('  $env:GEMINI_API_KEYS="AIzaSy...,AIzaSy..."');
    console.error('  npx tsx scripts/vocab-generator/cli.ts [--input <archivo_semilla>] [--limit <numero>] [--batch-size <numero>]');
    console.error('Comandos auxiliares:');
    console.error('  npx tsx scripts/vocab-generator/cli.ts --clean-cache   (Limpia la caché de lotes)');
    console.error('  npx tsx scripts/vocab-generator/cli.ts --reset-corpus  (Vacía el archivo del catálogo)');
    console.error('  npx tsx scripts/vocab-generator/cli.ts --compile       (Compila lotes cacheados al corpus)');
    process.exit(1);
  }

  // 2. Argumentos CLI
  let seedFilePath = 'scripts/.cache/seed_words.json';
  let limit: number | undefined;
  let batchSize = 4;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--input' && args[i + 1]) {
      seedFilePath = args[i + 1];
    } else if (args[i] === '--limit' && args[i + 1]) {
      limit = parseInt(args[i + 1], 10);
    } else if (args[i] === '--batch-size' && args[i + 1]) {
      batchSize = parseInt(args[i + 1], 10);
    }
  }

  // 3. Cargar palabras semilla (preservando fonética oficial y nivel CEFR si existen)
  let lemmas: Array<string | any> = [];
  const resolvedSeedPath = path.resolve(seedFilePath);

  if (fs.existsSync(resolvedSeedPath)) {
    const raw = JSON.parse(fs.readFileSync(resolvedSeedPath, 'utf-8'));
    if (Array.isArray(raw)) {
      lemmas = raw;
    } else {
      lemmas = Object.keys(raw);
    }
  } else {
    // Si no existe un archivo semilla explícito, extraer automáticamente de NGSL oficial
    console.log(`[Info] No se encontró ${seedFilePath}. Extrayendo lista oficial de NGSL...`);
    const { extractAllSeedLemmas } = await import('./extract-seed-words');
    lemmas = await extractAllSeedLemmas();
    const cacheDir = path.dirname(resolvedSeedPath);
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }
    fs.writeFileSync(resolvedSeedPath, JSON.stringify(lemmas, null, 2), 'utf-8');
    console.log(`[Info] Semillas generadas y cacheadas en ${resolvedSeedPath}`);
  }

  if (lemmas.length === 0) {
    console.error('❌ Error: No se pudieron cargar palabras semilla para procesar.');
    process.exit(1);
  }

  // Deduplicar respetando que pueden ser objetos SeedWordEntry o strings
  const seen = new Set<string>();
  const uniqueLemmas: any[] = [];
  for (const item of lemmas) {
    const w = (typeof item === 'string' ? item : item.word).toLowerCase().trim();
    if (!seen.has(w)) {
      seen.add(w);
      uniqueLemmas.push(item);
    }
  }

  const finalLemmas = limit ? uniqueLemmas.slice(0, limit) : uniqueLemmas;

  // 4. Instanciar y ejecutar el Pipeline (Lotes de 4 palabras, máx 10 peticiones/min por worker = ~40 palabras/min por worker)
  const pipeline = new VocabGeneratorPipeline(apiKeys, 'scripts/.cache/vocab_pipeline', {
    batchSize,
    minIntervalMs: 6000,
    modelId: 'gemini-3.5-flash-lite',
    destinationCorpusPath: 'src/data/core-vocab-corpus.json',
  });

  await pipeline.run(finalLemmas);
}

main().catch((err) => {
  console.error('\n💥 Error fatal en la ejecución del pipeline:', err);
  process.exit(1);
});
