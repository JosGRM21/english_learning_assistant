import '@testing-library/jest-dom';
import { afterEach } from 'vitest';

afterEach(() => {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
  } catch {
    // ignore
  }
});
