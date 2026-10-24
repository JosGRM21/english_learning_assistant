/**
 * Normalizes user text input for lenient comparison by stripping punctuation,
 * trimming leading/trailing whitespace, and collapsing internal whitespace to single spaces.
 */
export function normalizeInput(str: string): string {
  if (!str) return '';
  return str
    .trim()
    .toLowerCase()
    .replace(/[.,/#!$%^&*;:{}=\-_`~()'"?¿¡«»]/g, '')
    .replace(/\s+/g, ' ');
}
