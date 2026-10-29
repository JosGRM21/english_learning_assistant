import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SenseBlock } from '../SenseBlock';
import { VocabSense } from '@/core/types/vocab';

// Mock useAudio
vi.mock('@/shared/hooks/useAudio', () => ({
  useAudio: () => ({
    audioService: {
      speak: vi.fn(),
      stop: vi.fn(),
    },
  }),
}));

describe('SenseBlock Component - Context Sentences & Graduated Examples', () => {
  it('renders both examples and displays "Oraciones en Contexto (2)" when two distinct examples are provided', () => {
    const senseWithTwoExamples: VocabSense = {
      translationEs: 'aguantar el tirón / resignarse con una sonrisa',
      definitionEn: 'To accept a difficult situation without complaining.',
      partOfSpeech: 'VERB',
      cefrLevel: 'C1',
      domainCategory: 'Phrasal Verb',
      exampleSentenceEn: 'We lost the match, but we just have to grin and bear it.',
      exampleSentenceEs: 'Perdimos el partido, pero simplemente tenemos que aguantarnos con buena cara.',
      graduatedExamples: {
        sentenceBasicEn: 'We lost the match, but we just have to grin and bear it.',
        sentenceBasicEs: 'Perdimos el partido, pero simplemente tenemos que aguantarnos con buena cara.',
        sentenceAdvancedEn: 'When the executive board imposed sudden budget cuts, the department heads had no choice but to grin and bear it.',
        sentenceAdvancedEs: 'Cuando la junta directiva impuso recortes presupuestarios repentinos, los jefes de departamento no tuvieron más opción que aguantar el tirón con resignación.',
      },
    };

    render(
      <SenseBlock
        sense={senseWithTwoExamples}
        senseNumber={1}
        totalSenses={1}
        isPhrasalVerb={true}
      />
    );

    expect(screen.getByText('Oraciones en Contexto (2)')).toBeDefined();
    expect(screen.getByText(/“We lost the match, but we just have to grin and bear it.”/i)).toBeDefined();
    expect(screen.getByText(/“When the executive board imposed sudden budget cuts, the department heads had no choice but to grin and bear it.”/i)).toBeDefined();
  });

  it('renders only one example and displays "Oraciones en Contexto (1)" when sentenceAdvancedEn is undefined or null', () => {
    const senseWithSingleExample: VocabSense = {
      translationEs: 'levantarse de la cama',
      definitionEn: 'To rise from bed after sleeping.',
      partOfSpeech: 'VERB',
      cefrLevel: 'A1',
      domainCategory: 'Phrasal Verb',
      exampleSentenceEn: 'I usually get up at 7 AM every day.',
      exampleSentenceEs: 'Normalmente me levanto a las 7 a.m. todos los días.',
      graduatedExamples: {
        sentenceBasicEn: 'I usually get up at 7 AM every day.',
        sentenceBasicEs: 'Normalmente me levanto a las 7 a.m. todos los días.',
        sentenceAdvancedEn: null,
        sentenceAdvancedEs: null,
      },
    };

    render(
      <SenseBlock
        sense={senseWithSingleExample}
        senseNumber={1}
        totalSenses={1}
        isPhrasalVerb={true}
      />
    );

    expect(screen.getByText('Oraciones en Contexto (1)')).toBeDefined();
    const matches = screen.getAllByText(/“I usually get up at 7 AM every day.”/i);
    expect(matches).toHaveLength(1);
  });

  it('defensively deduplicates and displays "Oraciones en Contexto (1)" when sentenceAdvancedEn is identical to sentenceBasicEn', () => {
    const senseWithDuplicateExamples: VocabSense = {
      translationEs: 'aguantar el tirón / resignarse con una sonrisa',
      definitionEn: 'To accept a difficult situation without complaining.',
      partOfSpeech: 'VERB',
      cefrLevel: 'C1',
      domainCategory: 'Phrasal Verb',
      exampleSentenceEn: 'We lost the match, but we just have to grin and bear it.',
      exampleSentenceEs: 'Perdimos el partido, pero simplemente tenemos que aguantarnos con buena cara.',
      graduatedExamples: {
        sentenceBasicEn: 'We lost the match, but we just have to grin and bear it.',
        sentenceBasicEs: 'Perdimos el partido, pero simplemente tenemos que aguantarnos con buena cara.',
        sentenceAdvancedEn: 'We lost the match, but we just have to grin and bear it.  ', // with whitespace
        sentenceAdvancedEs: 'Perdimos el partido, pero simplemente tenemos que aguantarnos con buena cara.',
      },
    };

    render(
      <SenseBlock
        sense={senseWithDuplicateExamples}
        senseNumber={1}
        totalSenses={1}
        isPhrasalVerb={true}
      />
    );

    // Defensively deduplicated:
    expect(screen.getByText('Oraciones en Contexto (1)')).toBeDefined();
    const matches = screen.getAllByText(/“We lost the match, but we just have to grin and bear it.”/i);
    expect(matches).toHaveLength(1);
  });
});
