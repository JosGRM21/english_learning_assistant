import { describe, it, expect } from 'vitest';
import { toJSONSchema } from 'zod';
import {
  SocraticFeedbackResponseSchema,
  WritingEvaluationResponseSchema,
  VocabEnrichmentResponseSchema,
} from '../schemas';

describe('Schema Serialization for Gemini Structured Outputs', () => {
  it('converts schemas to valid JSON Schema using Zod toJSONSchema', () => {
    const socraticRes = toJSONSchema(SocraticFeedbackResponseSchema);
    expect(socraticRes).toBeDefined();
    expect((socraticRes as any).type).toBe('object');
    expect((socraticRes as any).properties.scaffolded_clues).toBeDefined();

    const writingRes = toJSONSchema(WritingEvaluationResponseSchema);
    expect(writingRes).toBeDefined();
    expect((writingRes as any).type).toBe('object');
    expect((writingRes as any).properties.corrections).toBeDefined();

    const vocabRes = toJSONSchema(VocabEnrichmentResponseSchema);
    expect(vocabRes).toBeDefined();
    expect((vocabRes as any).type).toBe('object');
  });

  it('converts BatchVocabResponseSchema to valid JSON Schema for scripts/vocab-generator', async () => {
    const { BatchVocabResponseSchema } = await import('../../../../scripts/vocab-generator/schema');
    const vocabBatchRes = toJSONSchema(BatchVocabResponseSchema);
    expect(vocabBatchRes).toBeDefined();
    expect((vocabBatchRes as any).type).toBe('object');
    expect((vocabBatchRes as any).properties.items).toBeDefined();
  });

  it('transforms responseSchema without throwing in GoogleGenAI', async () => {
    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({ apiKey: 'fake_key_for_testing' });
    const schema = toJSONSchema(WritingEvaluationResponseSchema);
    
    // Test if the SDK internally processes the schema without errors
    // ai.models.generateContent calls the transformation internally before the fetch
    try {
      await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: 'test',
        config: {
          responseMimeType: 'application/json',
          responseSchema: schema as any,
        },
      });
    } catch (err: any) {
      // It will fail because of network/invalid API key, NOT because of schema transformation error
      expect(err.message).not.toContain('cannot be both populated');
      expect(err.message).not.toContain('is not supported');
    }

    const { BatchVocabResponseSchema } = await import('../../../../scripts/vocab-generator/schema');
    const vocabSchema = toJSONSchema(BatchVocabResponseSchema);
    try {
      await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: 'test',
        config: {
          responseMimeType: 'application/json',
          responseSchema: vocabSchema as any,
        },
      });
    } catch (err: any) {
      expect(err.message).not.toContain('cannot be both populated');
      expect(err.message).not.toContain('is not supported');
    }
  });
});
