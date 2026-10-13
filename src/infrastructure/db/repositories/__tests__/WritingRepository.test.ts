import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Kysely } from 'kysely';
import { DatabaseSchema } from '../../../../core/types/database';
import { createTestDatabase } from '../../database';
import { WritingRepository } from '../WritingRepository';
import { WritingEvaluationResponse } from '../../../ai/schemas';

describe('WritingRepository Integration Tests', () => {
  let db: Kysely<DatabaseSchema>;
  let repo: WritingRepository;

  beforeEach(async () => {
    db = await createTestDatabase();
    repo = new WritingRepository(db);
  });

  afterEach(async () => {
    await db.destroy();
  });

  it('creates and retrieves a writing submission with revisions and evaluation', async () => {
    // 1. Create initial submission
    const subId = await repo.createSubmission({
      userId: 'user_local',
      submissionMode: 'GUIDED',
      userText: 'I am agree with your point and it depend of the server.',
      wordCount: 12,
      status: 'SOCRATIC_PHASE_1',
    });

    expect(subId).toBeTruthy();

    // 2. Record revision (Draft 2)
    await repo.recordRevision({
      submissionId: subId,
      revisionNumber: 2,
      draftText: 'I agree with your point and it depends on the server.',
      aiHintsJson: JSON.stringify({
        overall_impression_es: 'Buen intento',
        error_count: 2,
        allow_self_correction: true,
        scaffolded_clues: [],
      }),
      resolvedErrorsCount: 2,
    });

    // 3. Record evaluation
    const mockEval: WritingEvaluationResponse = {
      overall_feedback_es: '¡Excelente corrección!',
      clean_structural_version: 'I agree with your point and it depends on the server.',
      native_recast_version: 'I completely agree with your assessment, as everything depends on server performance.',
      noticing_the_gap_contrasts: [
        {
          user_fragment: 'it depend of',
          native_fragment: 'everything depends on',
          noticing_note_es: 'El verbo depend requiere la preposición on.',
        },
      ],
      rubric_scores: {
        accuracy: 9.0,
        range_and_precision: 8.5,
        cohesion_and_flow: 8.5,
        pragmatics_and_complexity: 8.0,
      },
      estimated_cefr: 'B1',
      qualitative_recommendations_es: 'Mantén el foco en colocaciones preposicionales.',
      successful_repairs: [
        {
          original_snippet: 'I am agree',
          corrected_snippet: 'I agree',
          praise_es: '¡Excelente auto-reparación!',
        },
      ],
      corrections: [
        {
          error_span: 'depend of',
          error_type: 'PREPOSITION',
          taxonomy_code: 'L1_PREP_DEPEND_ON',
          is_l1_spanish_transfer: true,
          explanation_es: 'En inglés se dice depend on.',
          native_reformulation: 'depends on',
          original_sentence: 'it depend of the server.',
          expanded_context: 'it depend of the server.',
          drill: {
            format: 'CONTEXTUAL_CLOZE',
            cloze_sentence: 'It depends [ ___ ] the server.',
            expected_token: 'on',
            explanation_es: 'En inglés depend rige on',
          },
        },
      ],
    };

    await repo.recordEvaluation({
      submissionId: subId,
      evaluation: mockEval,
    });

    // 4. Retrieve submission by id
    const found = await repo.getSubmissionById(subId);
    expect(found).not.toBeNull();
    expect(found?.userText).toBe('I am agree with your point and it depend of the server.');
    expect(found?.draft2Text).toBe('I agree with your point and it depends on the server.');
    expect(found?.status).toBe('EVALUATED');
    expect(found?.evaluation?.clean_structural_version).toBe('I agree with your point and it depends on the server.');
    expect(found?.evaluation?.native_recast_version).toContain('I completely agree');
    expect(found?.evaluation?.rubric_scores.accuracy).toBe(9.0);
    expect(found?.evaluation?.noticing_the_gap_contrasts).toHaveLength(1);
    expect(found?.evaluation?.corrections).toHaveLength(1);
    expect(found?.evaluation?.successful_repairs).toHaveLength(1);
    expect(found?.evaluation?.successful_repairs[0].corrected_snippet).toBe('I agree');

    // 5. List submissions
    const list = await repo.getSubmissions('user_local');
    expect(list.length).toBeGreaterThanOrEqual(1);
    expect(list[0].id).toBe(subId);
    expect(list[0].evaluation?.successful_repairs).toHaveLength(1);
  });

  it('updates an existing submission without throwing UNIQUE constraint violation', async () => {
    // 1. Initial submission creation
    const subId = await repo.createSubmission({
      userId: 'user_local',
      userText: 'Initial text draft',
      wordCount: 3,
      status: 'SOCRATIC_PHASE_1',
    });
    expect(subId).toBeTruthy();

    // 2. Re-submitting with the same ID (retry after network/AI failure)
    const updatedSubId = await repo.createSubmission({
      id: subId,
      userId: 'user_local',
      userText: 'Updated text draft after retry',
      wordCount: 5,
      status: 'SOCRATIC_PHASE_1',
    });

    expect(updatedSubId).toBe(subId);

    // 3. Verify it updated in place rather than creating duplicate or failing
    const retrieved = await repo.getSubmissionById(subId);
    expect(retrieved?.userText).toBe('Updated text draft after retry');
    expect(retrieved?.wordCount).toBe(5);

    // 4. Record revision twice for same revisionNumber
    await repo.recordRevision({
      submissionId: subId,
      revisionNumber: 1,
      draftText: 'Draft rev 1 initial',
    });

    await repo.recordRevision({
      submissionId: subId,
      revisionNumber: 1,
      draftText: 'Draft rev 1 updated',
    });

    const revList = await db
      .selectFrom('writing_draft_revisions')
      .selectAll()
      .where('submission_id', '=', subId)
      .execute();
    expect(revList).toHaveLength(1);
    expect(revList[0].draft_text).toBe('Draft rev 1 updated');
  });

  it('logs writing errors, creates isolated reflective SRS cards, and detects recidivism', async () => {
    const subId = await repo.createSubmission({
      userId: 'user_local',
      userText: 'She is married with an architect and depend of him.',
      wordCount: 10,
    });

    // First error log: PREP_MARRIED_TO
    await repo.logWritingErrors(
      subId,
      [
        {
          error_span: 'married with',
          error_type: 'PREPOSITION',
          taxonomy_code: 'L1_PREP_MARRIED_TO',
          is_l1_spanish_transfer: true,
          explanation_es: 'En inglés se dice married to.',
          native_reformulation: 'married to',
          original_sentence: 'She is married with an architect.',
          expanded_context: 'She is married with an architect.',
        },
      ],
      'user_local',
      'She is married with an architect.',
    );

    // Verify error was logged and isolated SRS card created
    const stats = await repo.getWritingErrorStats('user_local');
    expect(stats.find((s) => s.taxonomyCode === 'L1_PREP_MARRIED_TO')?.count).toBe(1);

    const srsCards = await db
      .selectFrom('srs_cards')
      .selectAll()
      .where('target_type', '=', 'WRITING_ERROR')
      .execute();
    expect(srsCards).toHaveLength(1);
    expect(srsCards[0].srs_profile).toBe('WRITING_ERROR_REFLECTIVE');

    // Second occurrence of same error -> recidivism check
    const recCheckBefore = await repo.checkRecidivism('user_local', 'L1_PREP_MARRIED_TO');
    expect(recCheckBefore.isRecidivist).toBe(false);
    expect(recCheckBefore.count).toBe(1);

    // Second submission with same error
    const subId2 = await repo.createSubmission({
      userId: 'user_local',
      userText: 'My sister is married with a doctor.',
      wordCount: 7,
    });

    await repo.logWritingErrors(
      subId2,
      [
        {
          error_span: 'married with',
          error_type: 'PREPOSITION',
          taxonomy_code: 'L1_PREP_MARRIED_TO',
          is_l1_spanish_transfer: true,
          explanation_es: 'En inglés se dice married to.',
          native_reformulation: 'married to',
          original_sentence: 'My sister is married with a doctor.',
          expanded_context: 'My sister is married with a doctor.',
        },
      ],
      'user_local',
      'My sister is married with a doctor.',
    );

    // Third check -> now recidivist!
    const recCheckAfter = await repo.checkRecidivism('user_local', 'L1_PREP_MARRIED_TO');
    expect(recCheckAfter.isRecidivist).toBe(true);
    expect(recCheckAfter.count).toBe(2);

    // Check fossilized errors query
    const fossilized = await repo.getFossilizedErrors('user_local');
    expect(fossilized.length).toBeGreaterThanOrEqual(1);
    expect(fossilized[0].isFossilizedAlert).toBe(true);
  });
});
