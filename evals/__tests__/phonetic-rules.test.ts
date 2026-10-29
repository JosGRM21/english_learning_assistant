import { describe, it, expect } from 'vitest';
import {
  isCanonicalWeakFormLemma,
  isValidWeakFormIpa,
  calculatePhoneticEdEnding,
  CANONICAL_WEAK_FORMS,
  isModalAuxiliaryVerb,
} from '../../src/core/phonetics/phonetic-rules';

describe('Phonetic Rules Canonical Tests', () => {
  describe('Formas Débiles Canónicas (Weak Forms)', () => {
    it('debe reconocer palabras funcionales canónicas con forma débil', () => {
      const validLemmas = ['to', 'for', 'can', 'that', 'and', 'the', 'of', 'we', 'she', 'he'];
      for (const word of validLemmas) {
        expect(isCanonicalWeakFormLemma(word)).toBe(true);
      }
    });

    it('debe rechazar palabras funcionales que NO poseen forma débil en inglés', () => {
      const nonWeakFunctionWords = ['each', 'every', 'if', 'through', 'during', 'only', 'off', 'such', 'might', 'may'];
      for (const word of nonWeakFunctionWords) {
        expect(isCanonicalWeakFormLemma(word)).toBe(false);
      }
    });

    it('debe validar formas débiles con Schwa y reducciones cuantitativas legítimas', () => {
      expect(isValidWeakFormIpa('to', 'tə')).toBe(true);
      expect(isValidWeakFormIpa('for', 'fər')).toBe(true);
      expect(isValidWeakFormIpa('can', 'kən')).toBe(true);
      // Pronombres con reducción cuantitativa (/i/, /u/)
      expect(isValidWeakFormIpa('we', 'wi')).toBe(true);
      expect(isValidWeakFormIpa('she', 'ʃi')).toBe(true);
      expect(isValidWeakFormIpa('he', 'hi')).toBe(true);
      expect(isValidWeakFormIpa('who', 'hu')).toBe(true);
    });

    it('debe rechazar formas débiles espurias en palabras que no la poseen', () => {
      expect(isValidWeakFormIpa('each', 'ətʃ')).toBe(false);
      expect(isValidWeakFormIpa('each', null)).toBe(true);
      expect(isValidWeakFormIpa('during', null)).toBe(true);
      expect(isValidWeakFormIpa('if', null)).toBe(true);
    });
  });

  describe('Alófonos de Pasado Regular -ed (/t/, /d/, /ɪd/)', () => {
    it('debe asignar /ɪd/ para bases que terminan en /t/ o /d/', () => {
      expect(calculatePhoneticEdEnding('stɑːrt', 'start')).toBe('/ɪd/');
      expect(calculatePhoneticEdEnding('wɑːnt', 'want')).toBe('/ɪd/');
      expect(calculatePhoneticEdEnding('steɪt', 'state')).toBe('/ɪd/');
      expect(calculatePhoneticEdEnding('ɛnd', 'end')).toBe('/ɪd/');
      expect(calculatePhoneticEdEnding('niːd', 'need')).toBe('/ɪd/');
    });

    it('debe asignar /t/ para bases que terminan en consonantes sordas', () => {
      expect(calculatePhoneticEdEnding('lʊk', 'look')).toBe('/t/');
      expect(calculatePhoneticEdEnding('wɑːtʃ', 'watch')).toBe('/t/');
      expect(calculatePhoneticEdEnding('mɪs', 'miss')).toBe('/t/');
      expect(calculatePhoneticEdEnding('wɑːʃ', 'wash')).toBe('/t/');
      expect(calculatePhoneticEdEnding('hɛlp', 'help')).toBe('/t/');
      expect(calculatePhoneticEdEnding('lɑːf', 'laugh')).toBe('/t/');
    });

    it('debe asignar /d/ para bases que terminan en vocales o consonantes sonoras', () => {
      expect(calculatePhoneticEdEnding('pleɪ', 'play')).toBe('/d/');
      expect(calculatePhoneticEdEnding('siːm', 'seem')).toBe('/d/');
      expect(calculatePhoneticEdEnding('muːv', 'move')).toBe('/d/');
      expect(calculatePhoneticEdEnding('juːz', 'use')).toBe('/d/');
      expect(calculatePhoneticEdEnding('kɔːl', 'call')).toBe('/d/');
      expect(calculatePhoneticEdEnding('lɪv', 'live')).toBe('/d/');
      expect(calculatePhoneticEdEnding('ˈfɑːloʊ', 'follow')).toBe('/d/');
      expect(calculatePhoneticEdEnding('ˈnʌmbər', 'number')).toBe('/d/');
    });
  });

  describe('Verbos Modales Auxiliares (Defectivos)', () => {
    it('debe identificar todos los modales canónicos que nunca admiten -ed', () => {
      const modals = ['can', 'could', 'may', 'might', 'shall', 'should', 'will', 'would', 'must'];
      for (const m of modals) {
        expect(isModalAuxiliaryVerb(m)).toBe(true);
      }
    });

    it('debe devolver false para verbos regulares o no modales', () => {
      const nonModals = ['play', 'start', 'make', 'do', 'have', 'run', 'walk'];
      for (const v of nonModals) {
        expect(isModalAuxiliaryVerb(v)).toBe(false);
      }
    });
  });
});
