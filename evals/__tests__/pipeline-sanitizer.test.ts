import { describe, it, expect } from 'vitest';
import { sanitizeGeneratedVocabWord, VocabGeneratorPipeline } from '../../scripts/vocab-generator/pipeline';
import { KeyPoolManager } from '../../scripts/vocab-generator/key-pool-manager';
import { GeneratedVocabWord } from '../../scripts/vocab-generator/schema';

describe('Sanitización Determinista Post-LLM (pipeline.ts)', () => {
  const baseMockWord = (overrides: Partial<GeneratedVocabWord> = {}): GeneratedVocabWord => ({
    word: 'test',
    grammaticalDimension: 'CONTENT',
    frequencyBand: 'TOP_500',
    ipaGeneralAmerican: 'tɛst',
    ipaReceivedPronunciation: null,
    ipaWeakForm: null,
    phoneticEdEnding: null,
    verbTenses: null,
    isFalseFriend: false,
    falseFriendNote: null,
    register: 'NEUTRAL',
    senses: [
      {
        senseId: 'sense_1',
        contextualHint: 'a test procedure',
        partOfSpeech: 'NOUN',
        definitionEn: 'A procedure intended to establish the quality, performance, or reliability of something.',
        translationEs: 'prueba, examen',
        cefrLevel: 'A1',
        grammarPattern: null,
        countability: 'COUNTABLE',
        connotation: 'NEUTRAL',
        graduatedExamples: {
          sentenceBasicEn: 'I have a test tomorrow.',
          sentenceBasicEs: 'Tengo un examen mañana.',
          clozeTargetBasic: 'test',
          sentenceAdvancedEn: 'The experiment was a rigorous test of the hypothesis.',
          sentenceAdvancedEs: 'El experimento fue una prueba rigurosa de la hipótesis.',
          clozeTargetAdvanced: 'test',
        },
      },
    ],
    phrasalVerbs: [],
    ...overrides,
  });

  describe('Guardarraíl de Verbos Irregulares y No-Verbos', () => {
    it('debe anular phoneticEdEnding si el verbo es irregular (ej. make)', () => {
      const sanitized = sanitizeGeneratedVocabWord(
        baseMockWord({
          word: 'make',
          phoneticEdEnding: '/t/',
          verbTenses: {
            infinitive: 'make',
            thirdPersonPresent: 'makes',
            pastSimple: 'made',
            pastParticiple: 'made',
            gerund: 'making',
            isIrregular: true,
          },
          senses: [
            {
              senseId: 'sense_1',
              contextualHint: 'create something',
              partOfSpeech: 'VERB',
              definitionEn: 'To create or produce something.',
              translationEs: 'hacer, crear',
              cefrLevel: 'A1',
              grammarPattern: null,
              countability: null,
              connotation: 'NEUTRAL',
              graduatedExamples: {
                sentenceBasicEn: 'I make breakfast.',
                sentenceBasicEs: 'Hago el desayuno.',
                clozeTargetBasic: 'make',
                sentenceAdvancedEn: 'They make significant progress.',
                sentenceAdvancedEs: 'Hacen un progreso significativo.',
                clozeTargetAdvanced: 'make',
              },
            },
          ],
        }),
      );

      expect(sanitized.phoneticEdEnding).toBeNull();
      expect(sanitized.verbTenses?.isIrregular).toBe(true);
    });

    it('debe anular phoneticEdEnding en verbos modales auxiliares defectivos (ej. could, would, may, can, should)', () => {
      const modals = ['could', 'would', 'should', 'may', 'can'];
      for (const m of modals) {
        const sanitized = sanitizeGeneratedVocabWord(
          baseMockWord({
            word: m,
            grammaticalDimension: 'FUNCTION',
            phoneticEdEnding: '/ɪd/', // Error que antes inyectaba el calculador
            verbTenses: null, // Los modales no tienen objeto verbTenses
            senses: [
              {
                senseId: 'sense_1',
                contextualHint: 'modal ability or possibility',
                partOfSpeech: 'VERB',
                definitionEn: 'Modal auxiliary verb.',
                translationEs: 'poder / modal',
                cefrLevel: 'A1',
                grammarPattern: null,
                countability: null,
                connotation: 'NEUTRAL',
                graduatedExamples: {
                  sentenceBasicEn: `You ${m} help.`,
                  sentenceBasicEs: 'Puedes ayudar.',
                  clozeTargetBasic: m,
                  sentenceAdvancedEn: `They ${m} have arrived earlier.`,
                  sentenceAdvancedEs: 'Podrían haber llegado antes.',
                  clozeTargetAdvanced: m,
                },
              },
            ],
          }),
        );

        expect(sanitized.phoneticEdEnding).toBeNull();
        expect(sanitized.verbTenses).toBeNull();
      }
    });

    it('debe anular phoneticEdEnding si la palabra no tiene ninguna acepción como VERB', () => {
      const sanitized = sanitizeGeneratedVocabWord(
        baseMockWord({
          word: 'end',
          phoneticEdEnding: '/ɪd/',
          senses: [
            {
              senseId: 'sense_1',
              contextualHint: 'final part',
              partOfSpeech: 'NOUN',
              definitionEn: 'The final part of something.',
              translationEs: 'final',
              cefrLevel: 'A1',
              grammarPattern: null,
              countability: 'COUNTABLE',
              connotation: 'NEUTRAL',
              graduatedExamples: {
                sentenceBasicEn: 'At the end of the day.',
                sentenceBasicEs: 'Al final del día.',
                clozeTargetBasic: 'end',
                sentenceAdvancedEn: 'Marked the end of an era.',
                sentenceAdvancedEs: 'Marcó el final de una era.',
                clozeTargetAdvanced: 'end',
              },
            },
          ],
        }),
      );

      expect(sanitized.phoneticEdEnding).toBeNull();
      expect(sanitized.verbTenses).toBeNull();
    });
  });

  describe('Corrección Mecánica de Alófonos de Verbos Regulares', () => {
    it('debe corregir /t/ a /ɪd/ en verbos regulares que terminan en /t/ (ej. state, start, want)', () => {
      const verbsToTest = [
        { word: 'state', ipa: 'steɪt' },
        { word: 'start', ipa: 'stɑːrt' },
        { word: 'want', ipa: 'wɑːnt' },
      ];

      for (const v of verbsToTest) {
        const sanitized = sanitizeGeneratedVocabWord(
          baseMockWord({
            word: v.word,
            ipaGeneralAmerican: v.ipa,
            phoneticEdEnding: '/t/', // Error común del LLM
            verbTenses: {
              infinitive: v.word,
              thirdPersonPresent: `${v.word}s`,
              pastSimple: `${v.word}ed`,
              pastParticiple: `${v.word}ed`,
              gerund: `${v.word}ing`,
              isIrregular: false,
            },
            senses: [
              {
                senseId: 'sense_1',
                contextualHint: 'verb action',
                partOfSpeech: 'VERB',
                definitionEn: 'To express something.',
                translationEs: 'expresar',
                cefrLevel: 'B1',
                grammarPattern: null,
                countability: null,
                connotation: 'NEUTRAL',
                graduatedExamples: {
                  sentenceBasicEn: 'State your name.',
                  sentenceBasicEs: 'Indica tu nombre.',
                  clozeTargetBasic: 'state',
                  sentenceAdvancedEn: 'The report stated the facts.',
                  sentenceAdvancedEs: 'El informe expuso los hechos.',
                  clozeTargetAdvanced: 'stated',
                },
              },
            ],
          }),
        );

        expect(sanitized.phoneticEdEnding).toBe('/ɪd/');
      }
    });

    it('debe corregir /t/ a /d/ en verbos regulares que terminan en sonidos sonoros (ej. move, use, play)', () => {
      const verbsToTest = [
        { word: 'move', ipa: 'muːv' },
        { word: 'use', ipa: 'juːz' },
        { word: 'play', ipa: 'pleɪ' },
      ];

      for (const v of verbsToTest) {
        const sanitized = sanitizeGeneratedVocabWord(
          baseMockWord({
            word: v.word,
            ipaGeneralAmerican: v.ipa,
            phoneticEdEnding: '/t/', // Error común del LLM
            verbTenses: {
              infinitive: v.word,
              thirdPersonPresent: `${v.word}s`,
              pastSimple: `${v.word}ed`,
              pastParticiple: `${v.word}ed`,
              gerund: `${v.word}ing`,
              isIrregular: false,
            },
            senses: [
              {
                senseId: 'sense_1',
                contextualHint: 'verb action',
                partOfSpeech: 'VERB',
                definitionEn: 'Perform action.',
                translationEs: 'actuar',
                cefrLevel: 'A1',
                grammarPattern: null,
                countability: null,
                connotation: 'NEUTRAL',
                graduatedExamples: {
                  sentenceBasicEn: 'Move forward.',
                  sentenceBasicEs: 'Avanza.',
                  clozeTargetBasic: 'move',
                  sentenceAdvancedEn: 'They moved steadily.',
                  sentenceAdvancedEs: 'Avanzaron con firmeza.',
                  clozeTargetAdvanced: 'moved',
                },
              },
            ],
          }),
        );

        expect(sanitized.phoneticEdEnding).toBe('/d/');
      }
    });
  });

  describe('Guardarraíl de Formas Débiles (Weak Forms)', () => {
    it('debe forzar null en palabras de contenido léxico (ej. then, all)', () => {
      const sanitizedThen = sanitizeGeneratedVocabWord(
        baseMockWord({
          word: 'then',
          grammaticalDimension: 'CONTENT',
          ipaWeakForm: 'ðən', // Error por confusión con 'than'
        }),
      );
      expect(sanitizedThen.ipaWeakForm).toBeNull();

      const sanitizedAll = sanitizeGeneratedVocabWord(
        baseMockWord({
          word: 'all',
          grammaticalDimension: 'CONTENT',
          ipaWeakForm: 'əl', // Forma débil inventada
        }),
      );
      expect(sanitizedAll.ipaWeakForm).toBeNull();
    });

    it('debe forzar null en palabras funcionales que no tienen forma débil (ej. each, during, if)', () => {
      const nonWeak = ['each', 'during', 'if', 'through', 'only', 'off', 'such'];
      for (const w of nonWeak) {
        const sanitized = sanitizeGeneratedVocabWord(
          baseMockWord({
            word: w,
            grammaticalDimension: 'FUNCTION',
            ipaWeakForm: 'test',
          }),
        );
        expect(sanitized.ipaWeakForm).toBeNull();
      }
    });

    it('debe preservar o autocompletar la forma débil canónica en palabras legítimas (ej. to, for, we)', () => {
      const sanitizedTo = sanitizeGeneratedVocabWord(
        baseMockWord({
          word: 'to',
          grammaticalDimension: 'FUNCTION',
          ipaWeakForm: null,
        }),
      );
      expect(sanitizedTo.ipaWeakForm).toBe('tə');

      const sanitizedWe = sanitizeGeneratedVocabWord(
        baseMockWord({
          word: 'we',
          grammaticalDimension: 'FUNCTION',
          ipaWeakForm: 'wi',
        }),
      );
      expect(sanitizedWe.ipaWeakForm).toBe('wi');
    });
  });

  describe('Configuración de ritmo y tamaño de lote (10 RPM / 4 palabras por lote)', () => {
    it('KeyPoolManager debe inicializar por defecto con minIntervalMs = 6000 (10 RPM)', () => {
      const pool = new KeyPoolManager(['AIzaFakeKey1']);
      // @ts-expect-error Acceso a propiedad privada para testing
      expect(pool.minIntervalMs).toBe(6000);
    });

    it('VocabGeneratorPipeline debe configurar batchSize = 4 y minIntervalMs = 6000 por defecto', () => {
      const testDir = 'scripts/.cache/test_pipeline_tmp';
      try {
        const pipeline = new VocabGeneratorPipeline(['AIzaFakeKey1'], testDir);
        // @ts-expect-error Acceso a propiedad privada para testing
        expect(pipeline.config.batchSize).toBe(4);
        // @ts-expect-error Acceso a propiedad privada para testing
        expect(pipeline.config.minIntervalMs).toBe(6000);
      } finally {
        const fs = require('fs');
        if (fs.existsSync(testDir)) {
          fs.rmSync(testDir, { recursive: true, force: true });
        }
      }
    });
  });
});
