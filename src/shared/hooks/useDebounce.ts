import { useState, useEffect } from 'react';

/**
 * Custom hook to debounce a rapidly changing value (e.g. search input).
 * Reduces unneeded renders and expensive queries.
 */
export function useDebounce<T>(value: T, delayMs = 200): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delayMs]);

  return debouncedValue;
}
