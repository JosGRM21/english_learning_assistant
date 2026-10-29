/**
 * Fuente única de verdad canónica para reglas fonológicas y ortológicas en inglés.
 * Utilizado por el motor de enriquecimiento con IA y los evaluadores de calidad (SLA).
 */

export interface WeakFormSpec {
  weakIpa: string;
  allowsSchwa: boolean;
  isQuantitativeReduction?: boolean;
}

/**
 * Catálogo canónico cerrado de palabras funcionales en inglés que poseen forma débil legítima
 * en habla conectada no enfática (estándar Daniel Jones EPD, J.C. Wells LPD, Peter Roach).
 */
export const CANONICAL_WEAK_FORMS: Record<string, WeakFormSpec> = {
  // Artículos
  a: { weakIpa: 'ə', allowsSchwa: true },
  an: { weakIpa: 'ən', allowsSchwa: true },
  the: { weakIpa: 'ðə', allowsSchwa: true },

  // Preposiciones
  at: { weakIpa: 'ət', allowsSchwa: true },
  for: { weakIpa: 'fər', allowsSchwa: true },
  from: { weakIpa: 'frəm', allowsSchwa: true },
  of: { weakIpa: 'əv', allowsSchwa: true },
  to: { weakIpa: 'tə', allowsSchwa: true },
  as: { weakIpa: 'əz', allowsSchwa: true },

  // Conjunciones
  and: { weakIpa: 'ənd', allowsSchwa: true },
  but: { weakIpa: 'bət', allowsSchwa: true },
  than: { weakIpa: 'ðən', allowsSchwa: true },
  that: { weakIpa: 'ðət', allowsSchwa: true },

  // Pronombres personales (Schwa o Reducción Cuantitativa /i/, /u/)
  we: { weakIpa: 'wi', allowsSchwa: false, isQuantitativeReduction: true },
  she: { weakIpa: 'ʃi', allowsSchwa: false, isQuantitativeReduction: true },
  he: { weakIpa: 'hi', allowsSchwa: false, isQuantitativeReduction: true },
  who: { weakIpa: 'hu', allowsSchwa: false, isQuantitativeReduction: true },
  him: { weakIpa: 'ɪm', allowsSchwa: false },
  his: { weakIpa: 'ɪz', allowsSchwa: false },
  her: { weakIpa: 'hər', allowsSchwa: true },
  them: { weakIpa: 'ðəm', allowsSchwa: true },
  us: { weakIpa: 'əs', allowsSchwa: true },
  you: { weakIpa: 'jʊ', allowsSchwa: false },
  your: { weakIpa: 'jər', allowsSchwa: true },

  // Verbos Auxiliares y Modales
  can: { weakIpa: 'kən', allowsSchwa: true },
  could: { weakIpa: 'kəd', allowsSchwa: true },
  have: { weakIpa: 'həv', allowsSchwa: true },
  has: { weakIpa: 'həz', allowsSchwa: true },
  had: { weakIpa: 'həd', allowsSchwa: true },
  do: { weakIpa: 'də', allowsSchwa: true },
  does: { weakIpa: 'dəz', allowsSchwa: true },
  am: { weakIpa: 'əm', allowsSchwa: true },
  are: { weakIpa: 'ər', allowsSchwa: true },
  was: { weakIpa: 'wəz', allowsSchwa: true },
  were: { weakIpa: 'wər', allowsSchwa: true },
  will: { weakIpa: 'əl', allowsSchwa: true },
  would: { weakIpa: 'wəd', allowsSchwa: true },
  shall: { weakIpa: 'ʃəl', allowsSchwa: true },
  should: { weakIpa: 'ʃəd', allowsSchwa: true },
  must: { weakIpa: 'məst', allowsSchwa: true },
};

/**
 * Comprueba si un lema pertenece al grupo cerrado de palabras con forma débil en inglés.
 */
export function isCanonicalWeakFormLemma(lemma: string): boolean {
  if (!lemma || typeof lemma !== 'string') return false;
  return CANONICAL_WEAK_FORMS[lemma.toLowerCase().trim()] !== undefined;
}

/**
 * Obtiene la especificación de forma débil canónica o null si no aplica.
 */
export function getCanonicalWeakFormSpec(lemma: string): WeakFormSpec | null {
  if (!lemma || typeof lemma !== 'string') return null;
  return CANONICAL_WEAK_FORMS[lemma.toLowerCase().trim()] ?? null;
}

/**
 * Comprueba si una transcripción de forma débil provista es aceptable para el lema.
 * Permite variantes fonéticas válidas como /wi/ para 'we', /ʃi/ para 'she', /ð/ para 'the', etc.
 */
export function isValidWeakFormIpa(lemma: string, ipa: string | null | undefined): boolean {
  const spec = getCanonicalWeakFormSpec(lemma);
  if (!spec) {
    // Si la palabra no tiene forma débil, DEBE ser null o vacío
    return ipa === null || ipa === undefined || ipa.trim() === '';
  }

  if (!ipa || typeof ipa !== 'string') return false;
  const clean = ipa.replace(/[\/ˈˌ\s]/g, '').trim();

  // Caso Schwa general
  if (spec.allowsSchwa && clean.includes('ə')) return true;

  // Caso reducciones cuantitativas específicas
  if (spec.isQuantitativeReduction) {
    if (clean === spec.weakIpa || clean.startsWith(spec.weakIpa)) return true;
  }

  // Coincidencia con la transcripción canónica base
  return clean === spec.weakIpa.replace(/[\/ˈˌ\s]/g, '');
}

/**
 * Lista de verbos irregulares de alta frecuencia en inglés para guardarraíl preventivo.
 */
export const COMMON_IRREGULAR_VERBS = new Set([
  'be', 'have', 'do', 'say', 'go', 'get', 'make', 'know', 'think', 'take',
  'see', 'come', 'find', 'give', 'tell', 'become', 'leave', 'feel', 'put',
  'bring', 'begin', 'keep', 'hold', 'write', 'stand', 'hear', 'let', 'mean',
  'set', 'meet', 'run', 'pay', 'sit', 'speak', 'lie', 'lead', 'read', 'grow',
  'lose', 'fall', 'send', 'build', 'understand', 'draw', 'break', 'spend',
  'cut', 'rise', 'drive', 'buy', 'wear', 'choose', 'seek', 'throw', 'catch',
  'deal', 'win', 'forget', 'lay', 'sell', 'fight', 'bear', 'teach', 'eat',
  'sing', 'strike', 'hang', 'shake', 'ride', 'feed', 'shoot', 'drink', 'hit',
  'sleep', 'hide', 'fly', 'bite', 'beat', 'cost', 'hurt', 'shut', 'blow',
]);

/**
 * Verbos modales auxiliares y defectivos del inglés que NUNCA admiten flexión regular -ed.
 */
export const MODAL_AUXILIARY_VERBS = new Set([
  'can', 'could', 'may', 'might', 'shall', 'should', 'will', 'would', 'must', 'ought',
]);

export function isModalAuxiliaryVerb(lemma: string): boolean {
  if (!lemma || typeof lemma !== 'string') return false;
  return MODAL_AUXILIARY_VERBS.has(lemma.toLowerCase().trim());
}

/**
 * Determina el alófono exacto del sufijo regular de pasado '-ed' (/t/, /d/, /ɪd/)
 * analizando el sonido consonántico o vocálico final en IPA General American y ortografía.
 *
 * Reglas fonológicas estándar:
 * 1. Base termina en oclusiva alveolar /t/ o /d/ -> /ɪd/
 * 2. Base termina en consonante sorda (/p, k, f, s, ʃ, tʃ, θ/) -> /t/
 * 3. Base termina en vocal, diptongo o consonante sonora (/b, ɡ, v, z, ʒ, dʒ, ð, m, n, ŋ, l, r/, vocales) -> /d/
 */
export function calculatePhoneticEdEnding(baseIpa: string, lemma: string): '/t/' | '/d/' | '/ɪd/' {
  const cleanIpa = (baseIpa || '').replace(/[\/ˈˌ\s:ː]/g, '').trim();
  const cleanLemma = (lemma || '').toLowerCase().trim();

  // 1. Regla /ɪd/: finaliza en /t/ o /d/
  if (cleanIpa.endsWith('t') || cleanIpa.endsWith('d')) {
    return '/ɪd/';
  }

  // Respaldo ortográfico si el IPA estuviese incompleto pero el lema termina en t/d
  if (
    cleanLemma.endsWith('t') ||
    cleanLemma.endsWith('te') ||
    cleanLemma.endsWith('d') ||
    cleanLemma.endsWith('de')
  ) {
    // Excepciones donde 'te' o 'de' no representan /t/ o /d/ son raras en verbos regulares
    if (!cleanIpa || cleanIpa.endsWith('t') || cleanIpa.endsWith('d')) {
      return '/ɪd/';
    }
  }

  // 2. Regla /t/: consonantes sordas excepto /t/ (/p, k, f, s, ʃ, tʃ, θ/)
  const voicelessEndings = ['tʃ', 'ʃ', 'θ', 'p', 'k', 'f', 's'];
  for (const ending of voicelessEndings) {
    if (cleanIpa.endsWith(ending)) {
      return '/t/';
    }
  }

  // Respaldo ortográfico para sordas si falta IPA
  if (!cleanIpa) {
    if (
      cleanLemma.endsWith('p') ||
      cleanLemma.endsWith('k') ||
      cleanLemma.endsWith('ck') ||
      cleanLemma.endsWith('f') ||
      cleanLemma.endsWith('ff') ||
      cleanLemma.endsWith('gh') ||
      cleanLemma.endsWith('s') ||
      cleanLemma.endsWith('ss') ||
      cleanLemma.endsWith('sh') ||
      cleanLemma.endsWith('ch') ||
      cleanLemma.endsWith('x')
    ) {
      return '/t/';
    }
  }

  // 3. Regla /d/: vocales, diptongos y consonantes sonoras restantes (/b, ɡ, v, z, ʒ, dʒ, ð, m, n, ŋ, l, r/, vocales)
  return '/d/';
}
