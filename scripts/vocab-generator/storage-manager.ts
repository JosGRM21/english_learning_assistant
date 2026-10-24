import fs from 'fs';
import path from 'path';
import { GeneratedVocabWord } from './schema';

export interface BatchMetadata {
  batchId: string;
  startIndex: number;
  endIndex: number;
  lemmas: string[];
  processedAt?: string;
}

export class BatchStorageManager {
  private readonly outputDir: string;
  private readonly batchesDir: string;
  private readonly failedFile: string;

  constructor(baseDir = 'scripts/.cache/vocab_pipeline') {
    this.outputDir = path.resolve(baseDir);
    this.batchesDir = path.join(this.outputDir, 'batches');
    this.failedFile = path.join(this.outputDir, 'failed_batches.json');

    if (!fs.existsSync(this.batchesDir)) {
      fs.mkdirSync(this.batchesDir, { recursive: true });
    }
  }

  public getBatchFilePath(batchId: string): string {
    return path.join(this.batchesDir, `${batchId}.json`);
  }

  public isBatchCompleted(batchId: string): boolean {
    const filePath = this.getBatchFilePath(batchId);
    return fs.existsSync(filePath);
  }

  public saveBatchResults(batchId: string, items: GeneratedVocabWord[]): void {
    const filePath = this.getBatchFilePath(batchId);
    const tmpPath = `${filePath}.tmp`;
    
    // Escritura atómica para evitar corrupción de archivo si se aborta el proceso
    fs.writeFileSync(tmpPath, JSON.stringify(items, null, 2), 'utf-8');
    fs.renameSync(tmpPath, filePath);
  }

  public recordFailedBatch(batchId: string, lemmas: string[], reason: string): void {
    let failed: Array<{ batchId: string; lemmas: string[]; reason: string; timestamp: string }> = [];
    if (fs.existsSync(this.failedFile)) {
      try {
        failed = JSON.parse(fs.readFileSync(this.failedFile, 'utf-8'));
      } catch {
        failed = [];
      }
    }
    failed.push({
      batchId,
      lemmas,
      reason,
      timestamp: new Date().toISOString(),
    });
    fs.writeFileSync(this.failedFile, JSON.stringify(failed, null, 2), 'utf-8');
  }

  public getCompletedBatchesCount(): number {
    if (!fs.existsSync(this.batchesDir)) return 0;
    return fs.readdirSync(this.batchesDir).filter((f) => f.endsWith('.json') && !f.endsWith('.tmp')).length;
  }

  /**
   * Elimina todos los lotes cacheados y registros de fallos.
   */
  public clearCache(): { deletedBatches: number; deletedFailed: boolean } {
    let deletedBatches = 0;
    if (fs.existsSync(this.batchesDir)) {
      const files = fs.readdirSync(this.batchesDir);
      for (const file of files) {
        fs.unlinkSync(path.join(this.batchesDir, file));
        deletedBatches++;
      }
    }
    let deletedFailed = false;
    if (fs.existsSync(this.failedFile)) {
      fs.unlinkSync(this.failedFile);
      deletedFailed = true;
    }
    return { deletedBatches, deletedFailed };
  }

  public resetCorpus(destinationFilePath: string): void {
    const resolvedPath = path.resolve(destinationFilePath);
    const targetDir = path.dirname(resolvedPath);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    fs.writeFileSync(resolvedPath, '[]', 'utf-8');
    const phrasesPath = path.join(targetDir, 'core-phrasal-units.json');
    fs.writeFileSync(phrasesPath, '[]', 'utf-8');
  }

  /**
   * Consolida todos los lotes completados en el archivo final estructurado core-vocab-corpus.json
   * de forma acumulativa (merge inteligente con el corpus ya existente para no destruir palabras previas).
   */
  public compileFinalCorpus(destinationFilePath: string): { totalWords: number; destination: string } {
    const resolvedDest = path.resolve(destinationFilePath);
    const targetDir = path.dirname(resolvedDest);
    const phrasesPath = path.join(targetDir, 'core-phrasal-units.json');

    // 1. Cargar corpus existente si existe para no destruir datos al compilar lotes parciales
    const existingCorpusMap = new Map<string, any>();
    if (fs.existsSync(resolvedDest)) {
      try {
        const rawExisting = JSON.parse(fs.readFileSync(resolvedDest, 'utf-8'));
        if (Array.isArray(rawExisting)) {
          for (const item of rawExisting) {
            const w = (item.word || '').toLowerCase().trim();
            if (w) existingCorpusMap.set(w, item);
          }
        }
      } catch {
        // En caso de archivo corrupto o vacío
      }
    }

    const existingPhrasesMap = new Map<string, any>();
    if (fs.existsSync(phrasesPath)) {
      try {
        const rawPhrases = JSON.parse(fs.readFileSync(phrasesPath, 'utf-8'));
        if (Array.isArray(rawPhrases)) {
          for (const phr of rawPhrases) {
            if (phr.text) existingPhrasesMap.set(phr.text.toLowerCase().trim(), phr);
          }
        }
      } catch {}
    }

    const files = fs
      .readdirSync(this.batchesDir)
      .filter((f) => f.endsWith('.json') && !f.endsWith('.tmp'))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

    const batchWords: GeneratedVocabWord[] = [];
    const seenBatchWords = new Set<string>();

    for (const file of files) {
      const fullPath = path.join(this.batchesDir, file);
      try {
        const batchItems: any[] = JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
        for (const item of batchItems) {
          const w = (item.word || item.lemma || '').toLowerCase().trim();
          if (w && !seenBatchWords.has(w)) {
            seenBatchWords.add(w);
            // Normalizar el objeto asegurando campos consistentes
            const normalized: GeneratedVocabWord = {
              word: w,
              grammaticalDimension: item.grammaticalDimension || 'CONTENT',
              frequencyBand: item.frequencyBand || 'TOP_500',
              ipaGeneralAmerican: item.ipaGeneralAmerican || item.phonetic?.ipaGeneralAmerican || `${w}`,
              ipaReceivedPronunciation: item.ipaReceivedPronunciation || item.phonetic?.ipaReceivedPronunciation || null,
              ipaWeakForm: item.ipaWeakForm || item.phonetic?.ipaWeakForm || null,
              phoneticEdEnding: item.phoneticEdEnding || item.phonetic?.phoneticEdEnding || null,
              verbTenses: item.verbTenses || null,
              isFalseFriend: Boolean(item.isFalseFriend),
              falseFriendNote: item.falseFriendNote || null,
              register: item.register || 'NEUTRAL',
              senses: item.senses || [],
              phrasalVerbs: item.phrasalVerbs || [],
            };
            batchWords.push(normalized);
          }
        }
      } catch (err) {
        console.error(`[Compilador] Error leyendo archivo ${file}:`, err);
      }
    }

    // 2. Fusionar lotes nuevos en el mapa del corpus
    let currentMaxIdNum = 0;
    for (const item of existingCorpusMap.values()) {
      if (item.id && item.id.startsWith('voc_core_')) {
        const num = parseInt(item.id.replace('voc_core_', ''), 10);
        if (!isNaN(num) && num > currentMaxIdNum) currentMaxIdNum = num;
      }
    }

    let currentMaxPhraseNum = 0;
    for (const phr of existingPhrasesMap.values()) {
      if (phr.id && phr.id.startsWith('phr_core_')) {
        const num = parseInt(phr.id.replace('phr_core_', ''), 10);
        if (!isNaN(num) && num > currentMaxPhraseNum) currentMaxPhraseNum = num;
      }
    }

    for (const item of batchWords) {
      const existing = existingCorpusMap.get(item.word);
      const vocabId = existing?.id || `voc_core_${String(++currentMaxIdNum).padStart(5, '0')}`;
      const firstSense = item.senses[0];
      if (!firstSense) {
        console.warn(`[Compilador] Advertencia: La palabra ${item.word} no tiene acepciones válidas. Se omitirá del corpus.`);
        continue;
      }
      const graduated = firstSense.graduatedExamples || {
        sentenceBasicEn: `Context example demonstrating ${item.word}.`,
        sentenceBasicEs: `Ejemplo de contexto demostrando ${item.word}.`,
        clozeTargetBasic: item.word,
        sentenceAdvancedEn: `Advanced pedagogical context incorporating ${item.word}.`,
        sentenceAdvancedEs: `Contexto pedagógico avanzado incorporando ${item.word}.`,
        clozeTargetAdvanced: item.word,
      };

      // Extraer y vincular sus phrasal verbs si existen
      if (item.phrasalVerbs && item.phrasalVerbs.length > 0) {
        for (const pv of item.phrasalVerbs) {
          const phrKey = pv.text.toLowerCase().trim();
          const existingPhr = existingPhrasesMap.get(phrKey);
          const phraseId = existingPhr?.id || `phr_core_${String(++currentMaxPhraseNum).padStart(5, '0')}`;

          existingPhrasesMap.set(phrKey, {
            id: phraseId,
            primaryVocabId: vocabId,
            chunkType: 'PHRASAL_VERB',
            text: pv.text.trim(),
            meaningEs: pv.meaningEs.trim(),
            definitionEn: pv.definitionEn ? pv.definitionEn.trim() : '',
            ipaGeneralAmerican: pv.ipaGeneralAmerican?.trim() || '',
            ipaReceivedPronunciation: pv.ipaReceivedPronunciation?.trim() || null,
            phrasalVerbType: pv.type,
            pronounMustSplit: pv.pronounMustSplit ? 1 : 0,
            example1: pv.example1.trim(),
            example1Es: pv.example1Es ? pv.example1Es.trim() : '',
            example2: pv.example2 ? pv.example2.trim() : null,
            example2Es: pv.example2Es ? pv.example2Es.trim() : null,
            cefrLevel: pv.cefrLevel,
          });
        }
      }

      // Consolidar colocaciones únicas enriquecidas de todas las acepciones
      const consolidatedCollocations: string[] = [];
      const seenCollocs = new Set<string>();
      for (const sense of item.senses) {
        if (sense.collocations && Array.isArray(sense.collocations)) {
          for (const c of sense.collocations) {
            const clean = c.trim();
            if (clean && !seenCollocs.has(clean.toLowerCase())) {
              seenCollocs.add(clean.toLowerCase());
              consolidatedCollocations.push(clean);
            }
          }
        }
      }

      // Solo las acepciones alternas (a partir del índice 1) deben ir a alternateSensesJson
      // para evitar que la primera acepción aparezca duplicada en la UI
      const alternateSenses = item.senses.slice(1);

      existingCorpusMap.set(item.word, {
        id: vocabId,
        word: item.word,
        grammaticalDimension: item.grammaticalDimension,
        partOfSpeech: firstSense.partOfSpeech,
        subcategory: null,
        definitionEn: firstSense.definitionEn,
        translationEs: firstSense.translationEs,
        ipaGeneralAmerican: item.ipaGeneralAmerican,
        ipaReceivedPronunciation: item.ipaReceivedPronunciation || null,
        ipaWeakForm: item.ipaWeakForm || null,
        cefrLevel: firstSense.cefrLevel,
        frequencyBand: item.frequencyBand,
        grammarPattern: firstSense.grammarPattern || null,
        countability: firstSense.countability || null,
        connotation: firstSense.connotation || 'NEUTRAL',
        isCore: 1,
        masteryStatus: existing?.masteryStatus || 'INACTIVE',
        collocationsJson: consolidatedCollocations,
        isSeparable: null,
        phoneticEdEnding: item.phoneticEdEnding || null,
        isFalseFriend: item.isFalseFriend ? 1 : 0,
        falseFriendNote: item.falseFriendNote || null,
        verbTensesJson: item.verbTenses || null,
        domainCategory: 'Uso General',
        alternateSensesJson: alternateSenses.length > 0 ? alternateSenses : null,
        phrasalVerbsJson: item.phrasalVerbs || [],
        graduatedExamples: {
          sentenceBasicEn: graduated.sentenceBasicEn,
          sentenceBasicEs: graduated.sentenceBasicEs,
          clozeTargetBasic: graduated.clozeTargetBasic || item.word,
          sentenceAdvancedEn: graduated.sentenceAdvancedEn,
          sentenceAdvancedEs: graduated.sentenceAdvancedEs,
          clozeTargetAdvanced: graduated.clozeTargetAdvanced || item.word,
        },
      });
    }

    const finalCorpusList = Array.from(existingCorpusMap.values());
    const finalPhrasesList = Array.from(existingPhrasesMap.values());

    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    fs.writeFileSync(
      resolvedDest,
      JSON.stringify(finalCorpusList, null, 2),
      'utf-8'
    );

    fs.writeFileSync(
      phrasesPath,
      JSON.stringify(finalPhrasesList, null, 2),
      'utf-8'
    );

    return {
      totalWords: finalCorpusList.length,
      destination: resolvedDest,
    };
  }
}
