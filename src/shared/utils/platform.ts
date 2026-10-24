/**
 * Detects whether the current runtime environment is inside a Tauri desktop webview.
 */
export function isTauri(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean(
    (window as unknown as { isTauri?: boolean }).isTauri ||
      '__TAURI_INTERNALS__' in window ||
      '__TAURI__' in window,
  );
}
