import { Kysely, Selectable } from 'kysely';
import { DatabaseSchema, WritingDraftRevisionsTable, WritingEvaluationsTable } from '../../../core/types/database';
import {
  IWritingRepository,
  WritingSubmissionEntity,
  CreateSubmissionInput,
  RecordRevisionInput,
  RecordEvaluationInput,
} from '../../../core/repositories/IWritingRepository';
import {
  SocraticFeedbackResponse,
  WritingEvaluationResponse,
} from '../../ai/schemas';

export class WritingRepository implements IWritingRepository {
  constructor(private readonly db: Kysely<DatabaseSchema>) {}

  async createSubmission(input: CreateSubmissionInput): Promise<string> {
    const id = input.id ?? `sub_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const userId = input.userId ?? 'user_local';

    if (input.id) {
      const existing = await this.db
        .selectFrom('writing_submissions')
        .select('id')
        .where('id', '=', input.id)
        .executeTakeFirst();

      if (existing) {
        await this.db
          .updateTable('writing_submissions')
          .set({
            user_id: userId,
            submission_mode: input.submissionMode ?? 'FREE',
            user_text: input.userText,
            word_count: input.wordCount,
            status: input.status ?? 'DRAFT',
          })
          .where('id', '=', input.id)
          .execute();

        return input.id;
      }
    }

    await this.db
      .insertInto('writing_submissions')
      .values({
        id,
        user_id: userId,
        submission_mode: input.submissionMode ?? 'FREE',
        user_text: input.userText,
        word_count: input.wordCount,
        status: input.status ?? 'DRAFT',
      })
      .execute();

    return id;
  }

  async recordRevision(input: RecordRevisionInput): Promise<void> {
    const existingRev = await this.db
      .selectFrom('writing_draft_revisions')
      .select('id')
      .where('submission_id', '=', input.submissionId)
      .where('revision_number', '=', input.revisionNumber)
      .executeTakeFirst();

    if (existingRev) {
      await this.db
        .updateTable('writing_draft_revisions')
        .set({
          draft_text: input.draftText,
          ai_scaffold_level: input.aiScaffoldLevel ?? 'LEVEL_1_ELICITATION',
          ai_hints_json: input.aiHintsJson ?? null,
          resolved_errors_count: input.resolvedErrorsCount ?? 0,
        })
        .where('id', '=', existingRev.id)
        .execute();
      return;
    }

    const id = `rev_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    await this.db
      .insertInto('writing_draft_revisions')
      .values({
        id,
        submission_id: input.submissionId,
        revision_number: input.revisionNumber,
        draft_text: input.draftText,
        ai_scaffold_level: input.aiScaffoldLevel ?? 'LEVEL_1_ELICITATION',
        ai_hints_json: input.aiHintsJson ?? null,
        resolved_errors_count: input.resolvedErrorsCount ?? 0,
      })
      .execute();
  }

  async recordEvaluation(input: RecordEvaluationInput): Promise<void> {
    const existing = await this.db
      .selectFrom('writing_evaluations')
      .select('id')
      .where('submission_id', '=', input.submissionId)
      .executeTakeFirst();

    const rubric = input.evaluation.rubric_scores ?? {
      accuracy: 8.0,
      range_and_precision: 8.0,
      cohesion_and_flow: 8.0,
      pragmatics_and_complexity: 8.0,
    };

    if (existing) {
      await this.db
        .updateTable('writing_evaluations')
        .set({
          model_used: input.modelUsed ?? 'gemini-3.8-flash',
          estimated_cefr: input.evaluation.estimated_cefr,
          clean_structural_version: input.evaluation.clean_structural_version || '',
          native_recast_version: input.evaluation.native_recast_version || '',
          noticing_the_gap_json: JSON.stringify(input.evaluation.noticing_the_gap_contrasts || []),
          accuracy_score: rubric.accuracy,
          range_precision_score: rubric.range_and_precision,
          cohesion_flow_score: rubric.cohesion_and_flow,
          pragmatics_complexity_score: rubric.pragmatics_and_complexity,
          overall_feedback_es: input.evaluation.overall_feedback_es,
          qualitative_recommendations_es: input.evaluation.qualitative_recommendations_es || '',
          corrections_json: JSON.stringify(input.evaluation.corrections),
          successful_repairs_json: JSON.stringify(input.evaluation.successful_repairs ?? []),
        })
        .where('id', '=', existing.id)
        .execute();
    } else {
      const id = `eval_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

      await this.db
        .insertInto('writing_evaluations')
        .values({
          id,
          submission_id: input.submissionId,
          model_used: input.modelUsed ?? 'gemini-3.8-flash',
          estimated_cefr: input.evaluation.estimated_cefr,
          clean_structural_version: input.evaluation.clean_structural_version || '',
          native_recast_version: input.evaluation.native_recast_version || '',
          noticing_the_gap_json: JSON.stringify(input.evaluation.noticing_the_gap_contrasts || []),
          accuracy_score: rubric.accuracy,
          range_precision_score: rubric.range_and_precision,
          cohesion_flow_score: rubric.cohesion_and_flow,
          pragmatics_complexity_score: rubric.pragmatics_and_complexity,
          overall_feedback_es: input.evaluation.overall_feedback_es,
          qualitative_recommendations_es: input.evaluation.qualitative_recommendations_es || '',
          corrections_json: JSON.stringify(input.evaluation.corrections),
          successful_repairs_json: JSON.stringify(input.evaluation.successful_repairs ?? []),
        })
        .execute();
    }

    await this.updateSubmissionStatus(input.submissionId, 'EVALUATED');
  }

  async updateSubmissionStatus(
    id: string,
    status: 'DRAFT' | 'SOCRATIC_PHASE_1' | 'SOCRATIC_PHASE_2' | 'EVALUATED' | 'ERROR',
  ): Promise<void> {
    await this.db
      .updateTable('writing_submissions')
      .set({ status })
      .where('id', '=', id)
      .execute();
  }

  private toDomainEvaluation(evalRow: Selectable<WritingEvaluationsTable>): WritingEvaluationResponse | null {
    try {
      return {
        overall_feedback_es: evalRow.overall_feedback_es,
        clean_structural_version: evalRow.clean_structural_version ?? '',
        native_recast_version: evalRow.native_recast_version ?? '',
        noticing_the_gap_contrasts: evalRow.noticing_the_gap_json
          ? JSON.parse(evalRow.noticing_the_gap_json)
          : [],
        rubric_scores: {
          accuracy: evalRow.accuracy_score,
          range_and_precision: evalRow.range_precision_score,
          cohesion_and_flow: evalRow.cohesion_flow_score,
          pragmatics_and_complexity: evalRow.pragmatics_complexity_score,
        },
        estimated_cefr: evalRow.estimated_cefr as WritingEvaluationResponse['estimated_cefr'],
        qualitative_recommendations_es: evalRow.qualitative_recommendations_es ?? '',
        successful_repairs: evalRow.successful_repairs_json
          ? JSON.parse(evalRow.successful_repairs_json)
          : [],
        corrections: JSON.parse(evalRow.corrections_json),
      };
    } catch {
      return null;
    }
  }

  async getSubmissions(userId = 'user_local', limit = 30): Promise<WritingSubmissionEntity[]> {
    const submissions = await this.db
      .selectFrom('writing_submissions')
      .selectAll()
      .where('user_id', '=', userId)
      .orderBy('submitted_at', 'desc')
      .limit(limit)
      .execute();

    if (submissions.length === 0) {
      return [];
    }

    const submissionIds = submissions.map((s) => s.id);

    // Batch load all revisions and evaluations to eliminate N+1 queries
    const [allRevisions, allEvaluations] = await Promise.all([
      this.db
        .selectFrom('writing_draft_revisions')
        .selectAll()
        .where('submission_id', 'in', submissionIds)
        .orderBy('revision_number', 'desc')
        .execute(),
      this.db
        .selectFrom('writing_evaluations')
        .selectAll()
        .where('submission_id', 'in', submissionIds)
        .execute(),
    ]);

    // Map latest revision by submission_id
    const latestRevMap = new Map<string, Selectable<WritingDraftRevisionsTable>>();
    for (const rev of allRevisions) {
      if (!latestRevMap.has(rev.submission_id)) {
        latestRevMap.set(rev.submission_id, rev);
      }
    }

    // Map evaluation by submission_id
    const evalMap = new Map<string, Selectable<WritingEvaluationsTable>>();
    for (const ev of allEvaluations) {
      evalMap.set(ev.submission_id, ev);
    }

    const result: WritingSubmissionEntity[] = [];

    for (const sub of submissions) {
      const latestRev = latestRevMap.get(sub.id);
      let socraticResult: SocraticFeedbackResponse | null = null;
      if (latestRev?.ai_hints_json) {
        try {
          socraticResult = JSON.parse(latestRev.ai_hints_json);
        } catch {
          socraticResult = null;
        }
      }

      const evalRow = evalMap.get(sub.id);
      const evaluation = evalRow ? this.toDomainEvaluation(evalRow) : null;

      result.push({
        id: sub.id,
        userId: sub.user_id,
        submissionMode: sub.submission_mode,
        userText: sub.user_text,
        draft2Text: latestRev?.draft_text,
        wordCount: sub.word_count,
        status: sub.status,
        submittedAt: sub.submitted_at,
        socraticResult,
        evaluation,
      });
    }

    return result;
  }

  async hasSubmissionToday(userId = 'user_local', todayDateStr?: string): Promise<boolean> {
    const prefix = todayDateStr ?? new Date().toISOString().slice(0, 10);
    const row = await this.db
      .selectFrom('writing_submissions')
      .select('id')
      .where('user_id', '=', userId)
      .where('submitted_at', 'like', `${prefix}%`)
      .limit(1)
      .executeTakeFirst();

    return Boolean(row);
  }

  async getSubmissionById(id: string): Promise<WritingSubmissionEntity | null> {
    const sub = await this.db
      .selectFrom('writing_submissions')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();

    if (!sub) return null;

    const revisions = await this.db
      .selectFrom('writing_draft_revisions')
      .selectAll()
      .where('submission_id', '=', sub.id)
      .orderBy('revision_number', 'desc')
      .execute();

    const latestRev = revisions[0];
    let socraticResult: SocraticFeedbackResponse | null = null;
    if (latestRev?.ai_hints_json) {
      try {
        socraticResult = JSON.parse(latestRev.ai_hints_json);
      } catch {
        socraticResult = null;
      }
    }

    const evalRow = await this.db
      .selectFrom('writing_evaluations')
      .selectAll()
      .where('submission_id', '=', sub.id)
      .executeTakeFirst();

    const evaluation = evalRow ? this.toDomainEvaluation(evalRow) : null;

    return {
      id: sub.id,
      userId: sub.user_id,
      submissionMode: sub.submission_mode,
      userText: sub.user_text,
      draft2Text: latestRev?.draft_text,
      wordCount: sub.word_count,
      status: sub.status,
      submittedAt: sub.submitted_at,
      socraticResult,
      evaluation,
    };
  }

  async deleteSubmission(id: string): Promise<void> {
    await this.db.deleteFrom('writing_evaluations').where('submission_id', '=', id).execute();
    await this.db.deleteFrom('writing_draft_revisions').where('submission_id', '=', id).execute();
    await this.db
      .deleteFrom('writing_submissions')
      .where('id', '=', id)
      .execute();
  }

  async deleteAllSubmissions(userId = 'user_local'): Promise<void> {
    const subIds = await this.db
      .selectFrom('writing_submissions')
      .select('id')
      .where('user_id', '=', userId)
      .execute();

    const ids = subIds.map((s) => s.id);
    if (ids.length > 0) {
      await this.db.deleteFrom('writing_evaluations').where('submission_id', 'in', ids).execute();
      await this.db.deleteFrom('writing_draft_revisions').where('submission_id', 'in', ids).execute();
      await this.db.deleteFrom('writing_submissions').where('user_id', '=', userId).execute();
    }
  }
}
