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

    await db
      .insertInto('users')
      .values({
        id: 'user_local',
        username: 'local_tester',
        target_accent: 'GENERAL_AMERICAN',
        current_cefr_target: 'B1',
        default_ai_model: 'gemini-3.8-flash',
        api_key_rotation_mode: 'FAILOVER_ON_QUOTA',
      })
      .onConflict((oc) => oc.column('id').doNothing())
      .execute();
  });

  afterEach(async () => {
    await db.destroy();
  });

  it('creates and retrieves a writing submission with revisions and evaluation', async () => {
    // 1. Create initial submission
    const subId = await repo.createSubmission({
      userId: 'user_local',
      promptId: 'prompt_standup_1',
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
      estimated_cefr: 'B1',
      scores: { grammar: 9.0, vocabulary: 8.5, coherence: 8.5 },
      successful_repairs: [],
      corrections: [
        {
          error_span: 'depend of',
          error_type: 'PREPOSITION',
          taxonomy_code: 'L1_PREP_DEPEND_ON',
          is_l1_spanish_transfer: true,
          explanation_es: 'En inglés se dice depend on.',
          native_reformulation: 'depends on',
        },
      ],
      micro_challenge: {
        question_es: '¿Preposición correcta?',
        sentence_with_blank: 'It depends ___ you.',
        options: ['of', 'on', 'in', 'to'],
        correct_option_index: 1,
        explanation_es: 'Correcto',
      },
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
    expect(found?.evaluation?.scores.grammar).toBe(9.0);
    expect(found?.evaluation?.corrections).toHaveLength(1);

    // 5. List submissions
    const list = await repo.getSubmissions('user_local');
    expect(list.length).toBeGreaterThanOrEqual(1);
    expect(list[0].id).toBe(subId);
  });

  it('records writing errors into user_errors and updates weakness_metrics', async () => {
    const subId = await repo.createSubmission({
      userId: 'user_local',
      userText: 'It depend of money',
      wordCount: 4,
    });

    await repo.recordWritingError({
      userId: 'user_local',
      taxonomyCode: 'L1_PREP_DEPEND_ON',
      errorType: 'PREPOSITION',
      incorrectToken: 'depend of',
      correctToken: 'depend on',
      contextSnippet: 'It depend of money',
      sourceReferenceId: subId,
    });

    // Verify user_errors entry
    const userErrors = await db
      .selectFrom('user_errors')
      .selectAll()
      .where('source', '=', 'WRITING_EVALUATION')
      .execute();

    expect(userErrors).toHaveLength(1);
    expect(userErrors[0].incorrect_token).toBe('depend of');
    expect(userErrors[0].correct_token).toBe('depend on');

    // Verify weakness_metrics entry
    const metrics = await db
      .selectFrom('weakness_metrics')
      .selectAll()
      .where('user_id', '=', 'user_local')
      .execute();

    expect(metrics).toHaveLength(1);
    expect(metrics[0].total_occurrences).toBe(1);
    expect(metrics[0].weakness_score).toBeGreaterThan(0);
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
});
