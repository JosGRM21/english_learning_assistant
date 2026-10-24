import fs from 'fs';
import path from 'path';

export interface SeedWordEntry {
  word: string;
  rank: number;
}

const CACHE_DIR = path.resolve('scripts/.cache');
const CORPUS_DIR = path.resolve('vocab_corpus');
const NGSL_CSV_PATH = path.join(CORPUS_DIR, 'NGSL_stats.csv');
const NGSL_REMOTE_URL = 'https://www.newgeneralservicelist.com/s/NGSL_12_stats.csv';

function cleanLemma(word: string): string | null {
  const clean = word
    .trim()
    .toLowerCase()
    .replace(/^to\s+/i, '')
    .replace(/[^\w\s-]/g, '')
    .trim();

  if (!clean || /^\d+$/.test(clean) || clean.length < 1) {
    return null;
  }
  return clean;
}

async function ensureNgslCsvExists(): Promise<string> {
  if (fs.existsSync(NGSL_CSV_PATH)) {
    return NGSL_CSV_PATH;
  }

  // Si no existe localmente, descargarlo de la web oficial
  console.log(`[Descargando] NGSL 1.2 oficial desde ${NGSL_REMOTE_URL}...`);
  if (!fs.existsSync(CORPUS_DIR)) {
    fs.mkdirSync(CORPUS_DIR, { recursive: true });
  }

  const res = await fetch(NGSL_REMOTE_URL);
  if (!res.ok) throw new Error(`HTTP ${res.status} al descargar ${NGSL_REMOTE_URL}`);
  const text = await res.text();
  fs.writeFileSync(NGSL_CSV_PATH, text, 'utf-8');
  console.log(`[Guardado] ${NGSL_CSV_PATH}`);
  return NGSL_CSV_PATH;
}

export async function extractAllSeedLemmas(): Promise<SeedWordEntry[]> {
  console.log('=== Extrayendo palabras semilla oficiales de NGSL 1.2 ===');
  const csvPath = await ensureNgslCsvExists();
  const fileContent = fs.readFileSync(csvPath, 'utf-8');

  const lines = fileContent.split(/\r?\n/).filter((line) => line.trim().length > 0 && !line.startsWith('##'));
  if (lines.length <= 1) {
    throw new Error(`El archivo CSV ${csvPath} no contiene datos válidos.`);
  }

  // Omitir cabecera: 'Lemma,SFI Rank,SFI,Adjusted Frequency per Million (U)'
  const dataLines = lines.slice(1);
  const seenWords = new Set<string>();
  const result: SeedWordEntry[] = [];

  for (const line of dataLines) {
    const parts = line.split(',');
    if (parts.length < 2) continue;

    const rawWord = parts[0]?.trim();
    const rawRank = parts[1]?.trim();
    if (!rawWord || !rawRank) continue;

    const clean = cleanLemma(rawWord);
    const parsedRank = parseInt(rawRank, 10);

    if (!clean || isNaN(parsedRank) || seenWords.has(clean)) {
      continue;
    }
    seenWords.add(clean);

    result.push({
      word: clean,
      rank: parsedRank,
    });
  }

  // Ordenar de forma determinista por rank ascendente (#1 'the' -> #2809)
  result.sort((a, b) => a.rank - b.rank);

  console.log(`[NGSL] Lemas procesados y ordenados por ranking: ${result.length}`);
  return result;
}

async function main() {
  const seedLemmas = await extractAllSeedLemmas();

  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }

  const outPath = path.join(CACHE_DIR, 'seed_words.json');
  fs.writeFileSync(outPath, JSON.stringify(seedLemmas, null, 2), 'utf-8');
  console.log(`\n✔ Archivo semilla minimalista generado exitosamente en: ${outPath}`);
  console.log(`   Total de lemas almacenados: ${seedLemmas.length}`);
  console.log(`   Primer lema: #${seedLemmas[0]?.rank} '${seedLemmas[0]?.word}'`);
  console.log(`   Último lema: #${seedLemmas[seedLemmas.length - 1]?.rank} '${seedLemmas[seedLemmas.length - 1]?.word}'`);
}

if (process.argv[1]?.endsWith('extract-seed-words.ts')) {
  main().catch((err) => {
    console.error('Error extrayendo palabras semilla:', err);
    process.exit(1);
  });
}
