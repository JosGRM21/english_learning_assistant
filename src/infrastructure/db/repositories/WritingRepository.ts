import { Kysely, Selectable } from 'kysely';
import { DatabaseSchema, WritingDraftRevisionsTable, WritingEvaluationsTable } from '../../../core/types/database';
import {
  IWritingRepository,
  WritingSubmissionEntity,
  CreateSubmissionInput,
  RecordRevisionInput,
  RecordEvaluationInput,
  WritingErrorStat,
} from '../../../core/repositories/IWritingRepository';
import {
  WritingErrorSrsItem,
  PositiveDrillData,
  PositiveDrillFormat,
} from '../../../core/types/srs';
import {
  SocraticFeedbackResponse,
  WritingEvaluationResponse,
  CorrectionItem,
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
    await this.db
      .deleteFrom('writing_submissions')
      .where('id', '=', id)
      .execute();
  }

  private toDomainErrorLog(row: any): WritingErrorSrsItem {
    let drillData: PositiveDrillData;
    try {
      drillData = row.drill_data_json
        ? JSON.parse(row.drill_data_json)
        : {
            format: (row.drill_format as PositiveDrillFormat) ?? 'CONTEXTUAL_CLOZE',
            explanationEs: row.explanation_es,
            sentenceContext: row.expanded_context || row.original_sentence || '',
          };
    } catch {
      drillData = {
        format: (row.drill_format as PositiveDrillFormat) ?? 'CONTEXTUAL_CLOZE',
        explanationEs: row.explanation_es,
        sentenceContext: row.expanded_context || row.original_sentence || '',
      };
    }

    return {
      id: row.id,
      submissionId: row.submission_id,
      userId: row.user_id,
      errorSpan: row.error_span,
      errorType: row.error_type,
      taxonomyCode: row.taxonomy_code,
      isL1SpanishTransfer: Boolean(row.is_l1_spanish_transfer),
      explanationEs: row.explanation_es,
      nativeReformulation: row.native_reformulation,
      originalSentence: row.original_sentence || '',
      expandedContext: row.expanded_context || '',
      drillFormat: (row.drill_format as PositiveDrillFormat) ?? 'CONTEXTUAL_CLOZE',
      drillData,
      srsCardId: row.srs_card_id,
      masteryStatus: (row.mastery_status as 'LEARNING' | 'INTERNALIZED' | 'RECIDIVIST') ?? 'LEARNING',
      isFossilizedAlert: Boolean(row.is_fossilized_alert),
      timesRecidivist: row.times_recidivist ?? 0,
      createdAt: row.created_at,
    };
  }

  async logWritingErrors(
    submissionId: string,
    corrections: CorrectionItem[],
    userId = 'user_local',
    contextText = '',
  ): Promise<void> {
    if (!corrections || corrections.length === 0) return;

    for (const corr of corrections) {
      const id = `err_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      const cardId = `card_err_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const now = new Date().toISOString();

      // Check previous occurrences of this specific error pattern (RF-ERR-07)
      const recidivism = await this.checkRecidivism(userId, corr.taxonomy_code, corr.error_span);
      const timesRecidivist = recidivism.count + 1;
      const isFossilized = timesRecidivist >= 2;

      // Positive Drill format
      const drillFormat: PositiveDrillFormat = corr.drill?.format ?? 'CONTEXTUAL_CLOZE';
      const drillData: PositiveDrillData = {
        format: drillFormat,
        clozeSentence: corr.drill?.cloze_sentence || contextText,
        expectedToken: corr.drill?.expected_token || corr.native_reformulation,
        cTestPrompt: corr.drill?.sentence_with_prefix,
        cTestPrefix: corr.drill?.c_test_prefix,
        expectedLength: corr.drill?.expected_length,
        rewriteBaseSentence: corr.drill?.source_sentence,
        rewriteKeyword: corr.drill?.mandatory_keyword,
        rewriteTargetSentence: corr.drill?.model_solution,
        scrambledChunks: corr.drill?.scrambled_chunks,
        expectedSequence: corr.drill?.correct_sequence,
        explanationEs: corr.explanation_es || corr.drill?.explanation_es || '',
        sentenceContext: contextText || corr.drill?.cloze_sentence || '',
      };

      // Create isolated SRS card with WRITING_ERROR_REFLECTIVE profile
      await this.db
        .insertInto('srs_cards')
        .values({
          id: cardId,
          user_id: userId,
          target_type: 'WRITING_ERROR',
          target_id: id,
          srs_profile: 'WRITING_ERROR_REFLECTIVE',
          state: 'NEW',
          stability: 0.0,
          difficulty: isFossilized ? 7.0 : 5.0,
          reps: 0,
          lapses: 0,
          consecutive_lapses: 0,
          is_leech: 0,
          last_reviewed_at: null,
          scheduled_for: now,
          created_at: now,
        })
        .execute();

      await this.db
        .insertInto('writing_error_logs')
        .values({
          id,
          submission_id: submissionId,
          user_id: userId,
          error_span: corr.error_span,
          error_type: corr.error_type,
          taxonomy_code: corr.taxonomy_code,
          is_l1_spanish_transfer: corr.is_l1_spanish_transfer ? 1 : 0,
          explanation_es: corr.explanation_es,
          native_reformulation: corr.native_reformulation,
          original_sentence: corr.drill?.cloze_sentence || contextText,
          expanded_context: contextText,
          drill_format: drillFormat,
          drill_data_json: JSON.stringify(drillData),
          srs_card_id: cardId,
          mastery_status: isFossilized ? 'RECIDIVIST' : 'LEARNING',
          is_fossilized_alert: isFossilized ? 1 : 0,
          times_recidivist: timesRecidivist,
          is_resolved: 0,
        })
        .execute();
    }
  }

  async checkRecidivism(
    userId: string,
    taxonomyCode: string,
    errorSpan?: string,
  ): Promise<{ isRecidivist: boolean; count: number }> {
    let query = this.db
      .selectFrom('writing_error_logs')
      .select((eb) => eb.fn.count('id').as('count'))
      .where('user_id', '=', userId)
      .where('taxonomy_code', '=', taxonomyCode);

    if (errorSpan && errorSpan.trim()) {
      const normalizedSpan = errorSpan.trim().toLowerCase();
      query = query.where((eb) =>
        eb(eb.fn('lower', ['error_span']), '=', normalizedSpan),
      );
    }

    const existing = await query.executeTakeFirst();
    const count = Number(existing?.count ?? 0);
    return {
      isRecidivist: count >= 2,
      count,
    };
  }

  async getFossilizedErrors(userId = 'user_local'): Promise<WritingErrorSrsItem[]> {
    const rows = await this.db
      .selectFrom('writing_error_logs')
      .selectAll()
      .where('user_id', '=', userId)
      .where((eb) =>
        eb.or([
          eb('is_fossilized_alert', '=', 1),
          eb('times_recidivist', '>=', 2),
          eb('mastery_status', '=', 'RECIDIVIST'),
        ]),
      )
      .orderBy('times_recidivist', 'desc')
      .execute();

    return rows.map((r) => this.toDomainErrorLog(r));
  }

  async getAllWritingErrors(userId = 'user_local'): Promise<WritingErrorSrsItem[]> {
    const rows = await this.db
      .selectFrom('writing_error_logs')
      .selectAll()
      .where('user_id', '=', userId)
      .orderBy('created_at', 'desc')
      .execute();

    return rows.map((r) => this.toDomainErrorLog(r));
  }

  async updateErrorMastery(id: string, status: 'LEARNING' | 'INTERNALIZED' | 'RECIDIVIST'): Promise<void> {
    await this.db
      .updateTable('writing_error_logs')
      .set({
        mastery_status: status,
        is_resolved: status === 'INTERNALIZED' ? 1 : 0,
      })
      .where('id', '=', id)
      .execute();
  }

  async getErrorById(id: string): Promise<WritingErrorSrsItem | null> {
    const row = await this.db
      .selectFrom('writing_error_logs')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();

    return row ? this.toDomainErrorLog(row) : null;
  }

  async getWritingErrorStats(userId = 'user_local', limit = 10): Promise<WritingErrorStat[]> {
    const rows = await this.db
      .selectFrom('writing_error_logs')
      .select(['taxonomy_code', 'error_type'])
      .select((eb) => eb.fn.count('id').as('count'))
      .where('user_id', '=', userId)
      .groupBy(['taxonomy_code', 'error_type'])
      .orderBy('count', 'desc')
      .limit(limit)
      .execute();

    return rows.map((r) => ({
      taxonomyCode: r.taxonomy_code,
      errorType: r.error_type,
      count: Number(r.count),
    }));
  }
}

