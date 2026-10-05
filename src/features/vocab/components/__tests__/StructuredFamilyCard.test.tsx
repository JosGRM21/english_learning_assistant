import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StructuredFamilyCard } from '../StructuredFamilyCard';
import { StructuredWordFamily } from '@/core/types/vocab';

describe('StructuredFamilyCard Component', () => {
  const structuredFamily: StructuredWordFamily = {
    nouns: ['decision', 'decisiveness'],
    verbs: ['decide'],
    adjectives: ['decisive', 'undecided'],
    adverbs: ['decisively'],
  };

  it('renders all grammatical categories with corresponding tags', () => {
    render(<StructuredFamilyCard family={structuredFamily} />);

    expect(screen.getByText(/Familia de Palabras/i)).toBeDefined();
    expect(screen.getByText('decision')).toBeDefined();
    expect(screen.getByText('decide')).toBeDefined();
    expect(screen.getByText('decisive')).toBeDefined();
    expect(screen.getByText('decisively')).toBeDefined();
  });

  it('renders compact mode with category pills', () => {
    render(<StructuredFamilyCard family={structuredFamily} compact />);

    expect(screen.getByText('decision')).toBeDefined();
    expect(screen.getByText('decide')).toBeDefined();
  });

  it('renders legacy flat string array as fallback if structured is null', () => {
    render(<StructuredFamilyCard family={null} legacyFamily={['decide', 'decision']} />);

    expect(screen.getByText('Familia Léxica')).toBeDefined();
    expect(screen.getByText('decide')).toBeDefined();
    expect(screen.getByText('decision')).toBeDefined();
  });

  it('renders nothing when both family and legacyFamily are empty', () => {
    const { container } = render(<StructuredFamilyCard family={null} legacyFamily={null} />);
    expect(container.firstChild).toBeNull();
  });
});
