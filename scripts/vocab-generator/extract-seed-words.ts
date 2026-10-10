import fs from 'fs';
import path from 'path';

export interface OxfordPhonetics {
  us?: string | null;
  uk?: string | null;
}

export interface SeedWordEntry {
  word: string;
  source: 'NGSL' | 'OXFORD' | 'BOTH';
  priorityRank: number;
  frequencyBand: 'TOP_500' | 'TOP_1000' | 'TOP_3000' | 'TOP_5000';
  cefrHint?: string; // Nivel oficial de Oxford (A1 a C1) si existe
  phonetics?: OxfordPhonetics; // Transcripciones AFI US y UK oficiales de Oxford
}

const CACHE_DIR = path.resolve('scripts/.cache');

async function fetchCachedJson<T>(url: string, filename: string): Promise<T> {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
  const filePath = path.join(CACHE_DIR, filename);
  if (fs.existsSync(filePath)) {
    console.log(`[Cache Hit] Cargando ${filename}...`);
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  }
  console.log(`[Descargando] ${url}...`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} al descargar ${url}`);
  const data = await res.json();
  fs.writeFileSync(filePath, JSON.stringify(data), 'utf-8');
  console.log(`[Guardado en Cache] ${filename}`);
  return data;
}

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

function cleanIpa(ipaRaw?: string | null): string | null {
  if (!ipaRaw) return null;
  return ipaRaw.replace(/^\/|\/$/g, '').trim() || null;
}

/**
 * Enfoque Híbrido Frecuencia-CEFR:
 * 1. Si la palabra está en NGSL, se usa la banda estadística empírica de frecuencia.
 * 2. Si la palabra es exclusiva de Oxford, se infiere su banda a partir de la correlación estándar CEFR:
 *    - A1: TOP_500 / TOP_1000
 *    - A2: TOP_1000
 *    - B1: TOP_3000
 *    - B2: TOP_5000
 *    - C1: TOP_5000 / EXTENDED_CORPUS
 */
function inferFrequencyBand(
  ngslBand: string | undefined,
  ngslRank: number | undefined,
  cefrLevel: string | undefined
): 'TOP_500' | 'TOP_1000' | 'TOP_3000' | 'TOP_5000' {
  if (ngslRank !== undefined) {
    if (ngslRank <= 500) return 'TOP_500';
    if (ngslRank <= 1000) return 'TOP_1000';
    if (ngslBand === '1000') return 'TOP_1000';
    if (ngslBand === '2000' || ngslBand === '3000') return 'TOP_3000';
    return 'TOP_5000';
  }

  // Palabra exclusiva de Oxford: Inferencia correlacionada por nivel CEFR
  const lvl = (cefrLevel || '').trim().toUpperCase();
  switch (lvl) {
    case 'A1':
      return 'TOP_1000';
    case 'A2':
      return 'TOP_1000';
    case 'B1':
      return 'TOP_3000';
    case 'B2':
    case 'C1':
    default:
      return 'TOP_5000';
  }
}

export async function extractAllSeedLemmas(): Promise<SeedWordEntry[]> {
  console.log('=== Extrayendo TODOS los lemas de NGSL y Oxford (Sin Límites) ===');

  // 1. Descargar o cargar NGSL
  const ngslUrl =
    'https://raw.githubusercontent.com/lpmi-13/machine_readable_wordlists/master/General/NGSL/NGSL.json';
  const ngsl = await fetchCachedJson<Record<string, Record<string, unknown>>>(ngslUrl, 'ngsl.json');

  // 2. Descargar o cargar Oxford 5000 (5.948 entradas que abarcan 4.958 lemas únicos)
  const oxfordUrl =
    'https://raw.githubusercontent.com/tyypgzl/Oxford-5000-words/master/full-word.json';
  const oxford = await fetchCachedJson<
    Array<{
      id: number;
      value: {
        word: string;
        level?: string;
        type?: string;
        phonetics?: { us?: string; uk?: string };
      };
    }>
  >(oxfordUrl, 'oxford_full.json');

  // Indexar Oxford agrupando por lema (preserva fonética y tipos)
  const oxfordMap = new Map<
    string,
    {
      level?: string;
      phonetics: { us?: string | null; uk?: string | null };
      posTypes: Set<string>;
    }
  >();

  for (const entry of oxford) {
    if (entry?.value?.word) {
      const clean = cleanLemma(entry.value.word);
      if (!clean) continue;

      const usIpa = cleanIpa(entry.value.phonetics?.us);
      const ukIpa = cleanIpa(entry.value.phonetics?.uk);
      const level = entry.value.level?.trim();
      const pos = entry.value.type?.trim();

      if (!oxfordMap.has(clean)) {
        oxfordMap.set(clean, {
          level,
          phonetics: { us: usIpa, uk: ukIpa },
          posTypes: new Set(pos ? [pos] : []),
        });
      } else {
        const existing = oxfordMap.get(clean)!;
        if (!existing.level && level) existing.level = level;
        if (!existing.phonetics.us && usIpa) existing.phonetics.us = usIpa;
        if (!existing.phonetics.uk && ukIpa) existing.phonetics.uk = ukIpa;
        if (pos) existing.posTypes.add(pos);
      }
    }
  }

  console.log(`[Oxford] Lemas únicos indexados con fonética: ${oxfordMap.size}`);

  // 3. Procesar NGSL con su orden de bandas
  const ngslMap = new Map<string, { band: string; rank: number }>();
  let currentRank = 1;
  const ngslBands = ['1000', '2000', '3000'];

  for (const bandKey of ngslBands) {
    const bandWords = ngsl[bandKey] || {};
    for (const rawWord of Object.keys(bandWords)) {
      const clean = cleanLemma(rawWord);
      if (clean && !ngslMap.has(clean)) {
        ngslMap.set(clean, { band: bandKey, rank: currentRank++ });
      }
    }
  }

  console.log(`[NGSL] Lemas únicos indexados con rango: ${ngslMap.size}`);

  // 4. Consolidar el conjunto total unificado (NGSL + TODOS los de Oxford)
  const result: SeedWordEntry[] = [];
  const processedSet = new Set<string>();

  // Paso A: Lemas de NGSL (con metadatos cruzados de Oxford si existen)
  for (const [cleanWord, ngslMeta] of ngslMap.entries()) {
    processedSet.add(cleanWord);
    const ox = oxfordMap.get(cleanWord);

    result.push({
      word: cleanWord,
      source: ox ? 'BOTH' : 'NGSL',
      priorityRank: result.length + 1,
      frequencyBand: inferFrequencyBand(ngslMeta.band, ngslMeta.rank, ox?.level),
      cefrHint: ox?.level || (ngslMeta.rank <= 1000 ? 'A1' : ngslMeta.rank <= 2000 ? 'A2' : 'B1'),
      phonetics: ox ? { us: ox.phonetics.us, uk: ox.phonetics.uk } : undefined,
    });
  }

  // Paso B: Lemas exclusivos de Oxford (TODO lo que queda en Oxford)
  // Se ordenan por nivel pedagógico CEFR: A1 -> A2 -> B1 -> B2 -> C1
  const cefrOrder: Record<string, number> = { A1: 1, A2: 2, B1: 3, B2: 4, C1: 5 };
  const exclusiveOxford = Array.from(oxfordMap.entries())
    .filter(([word]) => !processedSet.has(word))
    .sort((a, b) => {
      const oA = cefrOrder[a[1].level || 'C1'] || 5;
      const oB = cefrOrder[b[1].level || 'C1'] || 5;
      return oA - oB;
    });

  for (const [cleanWord, oxData] of exclusiveOxford) {
    processedSet.add(cleanWord);
    result.push({
      word: cleanWord,
      source: 'OXFORD',
      priorityRank: result.length + 1,
      frequencyBand: inferFrequencyBand(undefined, undefined, oxData.level),
      cefrHint: oxData.level || 'B2',
      phonetics: { us: oxData.phonetics.us, uk: oxData.phonetics.uk },
    });
  }

  console.log(`[Consolidación] Total exhaustivo de lemas combinados: ${result.length}`);
  return result;
}

async function main() {
  const seedLemmas = await extractAllSeedLemmas();
  const outPath = path.resolve('scripts/.cache/seed_words.json');
  fs.writeFileSync(outPath, JSON.stringify(seedLemmas, null, 2), 'utf-8');
  console.log(`✅ Archivo semilla completo generado exitosamente en: ${outPath}`);
  console.log(`   Total de lemas almacenados: ${seedLemmas.length}`);
  
  // Desglose de bandas
  const bandCounts: Record<string, number> = {};
  for (const s of seedLemmas) {
    bandCounts[s.frequencyBand] = (bandCounts[s.frequencyBand] || 0) + 1;
  }
  console.log('   Distribución por Banda de Frecuencia:', bandCounts);
}

if (process.argv[1]?.endsWith('extract-seed-words.ts')) {
  main().catch((err) => {
    console.error('Error extrayendo palabras semilla:', err);
    process.exit(1);
  });
}
