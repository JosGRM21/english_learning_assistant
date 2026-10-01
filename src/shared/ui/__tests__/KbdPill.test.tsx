import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { KbdPill } from '../KbdPill';

describe('KbdPill Component', () => {
  it('renders key label correctly', () => {
    render(<KbdPill keyLabel="Space" />);
    const kbd = screen.getByText('Space');
    expect(kbd).toBeDefined();
    expect(kbd.tagName.toLowerCase()).toBe('kbd');
  });

  it('renders with accessible title', () => {
    render(<KbdPill keyLabel="Ctrl + Enter" title="Presiona Ctrl+Enter para enviar" />);
    const kbd = screen.getByTitle('Presiona Ctrl+Enter para enviar');
    expect(kbd).toBeDefined();
  });

  it('applies default accessible title when none provided', () => {
    render(<KbdPill keyLabel="R" />);
    const kbd = screen.getByTitle('Atajo de teclado: R');
    expect(kbd).toBeDefined();
  });

  it('renders different size classes properly', () => {
    const { rerender } = render(<KbdPill keyLabel="1" size="xs" />);
    let kbd = screen.getByText('1');
    expect(kbd.className).toContain('text-[10px]');

    rerender(<KbdPill keyLabel="1" size="lg" />);
    kbd = screen.getByText('1');
    expect(kbd.className).toContain('text-sm');
  });

  it('renders accent variant correctly', () => {
    render(<KbdPill keyLabel="Space" variant="accent" />);
    const kbd = screen.getByText('Space');
    expect(kbd.className).toContain('bg-indigo-50');
  });
});
