import { Kysely } from 'kysely';
import { DatabaseSchema } from '../../../core/types/database';
import {
  IWritingRepository,
  WritingSubmissionEntity,
  CreateSubmissionInput,
  RecordRevisionInput,
  RecordEvaluationInput,
  RecordUserWritingErrorInput,
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

    let validPromptId: string | null = null;
    if (input.promptId) {
      const existingPrompt = await this.db
        .selectFrom('writing_prompts')
        .select('id')
        .where('id', '=', input.promptId)
        .executeTakeFirst();
      if (existingPrompt) {
        validPromptId = existingPrompt.id;
      }
    }

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
            prompt_id: validPromptId,
            submission_mode: input.submissionMode ?? 'GUIDED',
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
        prompt_id: validPromptId,
        submission_mode: input.submissionMode ?? 'GUIDED',
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

    if (existing) {
      await this.db
        .updateTable('writing_evaluations')
        .set({
          model_used: input.modelUsed ?? 'gemini-3.8-flash',
          estimated_cefr: input.evaluation.estimated_cefr,
          grammar_score: input.evaluation.scores.grammar,
          vocabulary_score: input.evaluation.scores.vocabulary,
          coherence_score: input.evaluation.scores.coherence,
          overall_feedback_es: input.evaluation.overall_feedback_es,
          corrections_json: JSON.stringify(input.evaluation.corrections),
          micro_challenge_json: JSON.stringify(input.evaluation.micro_challenge),
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
          grammar_score: input.evaluation.scores.grammar,
          vocabulary_score: input.evaluation.scores.vocabulary,
          coherence_score: input.evaluation.scores.coherence,
          overall_feedback_es: input.evaluation.overall_feedback_es,
          corrections_json: JSON.stringify(input.evaluation.corrections),
          micro_challenge_json: JSON.stringify(input.evaluation.micro_challenge),
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

  async getSubmissions(userId = 'user_local', limit = 30): Promise<WritingSubmissionEntity[]> {
    const submissions = await this.db
      .selectFrom('writing_submissions')
      .selectAll()
      .where('user_id', '=', userId)
      .orderBy('submitted_at', 'desc')
      .limit(limit)
      .execute();

    const result: WritingSubmissionEntity[] = [];

    for (const sub of submissions) {
      // Find latest revision
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

      // Find evaluation
      const evalRow = await this.db
        .selectFrom('writing_evaluations')
        .selectAll()
        .where('submission_id', '=', sub.id)
        .executeTakeFirst();

      let evaluation: WritingEvaluationResponse | null = null;
      if (evalRow) {
        try {
          evaluation = {
            overall_feedback_es: evalRow.overall_feedback_es,
            estimated_cefr: evalRow.estimated_cefr as WritingEvaluationResponse['estimated_cefr'],
            scores: {
              grammar: evalRow.grammar_score,
              vocabulary: evalRow.vocabulary_score,
              coherence: evalRow.coherence_score,
            },
            successful_repairs: (evalRow as any).successful_repairs_json
              ? JSON.parse((evalRow as any).successful_repairs_json)
              : [],
            corrections: JSON.parse(evalRow.corrections_json),
            micro_challenge: evalRow.micro_challenge_json
              ? JSON.parse(evalRow.micro_challenge_json)
              : null,
          };
        } catch {
          evaluation = null;
        }
      }

      result.push({
        id: sub.id,
        userId: sub.user_id,
        promptId: sub.prompt_id,
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

    let evaluation: WritingEvaluationResponse | null = null;
    if (evalRow) {
      try {
        evaluation = {
          overall_feedback_es: evalRow.overall_feedback_es,
          estimated_cefr: evalRow.estimated_cefr as WritingEvaluationResponse['estimated_cefr'],
          scores: {
            grammar: evalRow.grammar_score,
            vocabulary: evalRow.vocabulary_score,
            coherence: evalRow.coherence_score,
          },
          successful_repairs: (evalRow as any).successful_repairs_json
            ? JSON.parse((evalRow as any).successful_repairs_json)
            : [],
          corrections: JSON.parse(evalRow.corrections_json),
          micro_challenge: evalRow.micro_challenge_json
            ? JSON.parse(evalRow.micro_challenge_json)
            : null,
        };
      } catch {
        evaluation = null;
      }
    }

    return {
      id: sub.id,
      userId: sub.user_id,
      promptId: sub.prompt_id,
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

  async recordWritingError(input: RecordUserWritingErrorInput): Promise<void> {
    const userId = input.userId ?? 'user_local';
    const taxonCode = input.taxonomyCode || 'L1_TRANSFER_GENERIC';

    // 1. Ensure error taxonomy row exists
    let taxonomyRow = await this.db
      .selectFrom('error_taxonomy')
      .selectAll()
      .where('code', '=', taxonCode)
      .executeTakeFirst();

    if (!taxonomyRow) {
      const taxonId = `tax_${taxonCode.toLowerCase()}`;
      const domain: 'GRAMMAR' | 'LEXICON' | 'PHONETICS' | 'PRAGMATICS' =
        input.errorType === 'LEXICON' || input.errorType === 'FALSE_FRIEND'
          ? 'LEXICON'
          : 'GRAMMAR';

      await this.db
        .insertInto('error_taxonomy')
        .values({
          id: taxonId,
          code: taxonCode,
          domain,
          severity: 'HIGH',
          label_es: taxonCode.replace(/_/g, ' '),
          detailed_explanation_es: `Interferencia detectada en redacción: ${input.incorrectToken} -> ${input.correctToken}`,
        })
        .onConflict((oc) => oc.column('id').doNothing())
        .execute();

      taxonomyRow = await this.db
        .selectFrom('error_taxonomy')
        .selectAll()
        .where('code', '=', taxonCode)
        .executeTakeFirst();
    }

    if (!taxonomyRow) return;

    // 2. Insert into user_errors
    const userErrorId = `err_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    await this.db
      .insertInto('user_errors')
      .values({
        id: userErrorId,
        user_id: userId,
        error_taxonomy_id: taxonomyRow.id,
        source: 'WRITING_EVALUATION',
        source_reference_id: input.sourceReferenceId,
        context_snippet: input.contextSnippet,
        incorrect_token: input.incorrectToken,
        correct_token: input.correctToken,
      })
      .execute();

    // 3. Upsert into weakness_metrics
    const existingMetric = await this.db
      .selectFrom('weakness_metrics')
      .selectAll()
      .where('user_id', '=', userId)
      .where('error_taxonomy_id', '=', taxonomyRow.id)
      .executeTakeFirst();

    const nowIso = new Date().toISOString();

    if (existingMetric) {
      const newTotal = existingMetric.total_occurrences + 1;
      const new7Days = existingMetric.occurrences_last_7_days + 1;
      const newScore = Math.min(10, Math.round((new7Days * 1.8 + (newTotal - new7Days) * 0.45) * 2.0 * 10) / 10);

      await this.db
        .updateTable('weakness_metrics')
        .set({
          occurrences_last_7_days: new7Days,
          total_occurrences: newTotal,
          weakness_score: newScore,
          last_detected_at: nowIso,
        })
        .where('id', '=', existingMetric.id)
        .execute();
    } else {
      const metricId = `wm_${userId}_${taxonCode}`;
      await this.db
        .insertInto('weakness_metrics')
        .values({
          id: metricId,
          user_id: userId,
          error_taxonomy_id: taxonomyRow.id,
          occurrences_last_7_days: 1,
          total_occurrences: 1,
          weakness_score: 3.6,
          last_detected_at: nowIso,
        })
        .execute();
    }
  }
}
