import { Generated } from 'kysely';

export interface VocabItemsTable {
  id: string;
  word: string;
  grammatical_dimension: 'CONTENT' | 'FUNCTION' | 'CHUNK';
  part_of_speech: string;
  subcategory: string | null;
  definition_en: string;
  translation_es: string;
  ipa_general_american: string;
  ipa_received_pronunciation: string | null;
  cefr_level: string;
  is_false_friend: number;
  false_friend_note: string | null;
  morphological_family_json: string | null;
  verb_tenses_json?: string | null;
  structured_family_json?: string | null;
  domain_category?: string | null;
  alternate_senses_json?: string | null;
  created_at: Generated<string>;
}

export interface PhraseologicalUnitsTable {
  id: string;
  primary_vocab_id: string | null;
  chunk_type: string;
  text: string;
  meaning_es: string;
  phrasal_verb_type: string | null;
  pronoun_must_split: Generated<number>;
  example_1: string;
  example_2: string | null;
  cefr_level: string;
  created_at: Generated<string>;
}

export interface VocabContextExamplesTable {
  id: string;
  vocab_id: string | null;
  phrase_id: string | null;
  sentence_en: string;
  sentence_es: string;
  cloze_target: string;
  audio_url: string | null;
  cefr_level: string;
  created_at: Generated<string>;
}

export interface SrsCardsTable {
  id: string;
  user_id: Generated<string>;
  target_type: 'VOCAB' | 'PHRASE' | 'GRAMMAR' | 'PHONETICS';
  target_id: string;
  state: 'NEW' | 'LEARNING' | 'REVIEW' | 'RELEARNING';
  stability: number;
  difficulty: number;
  reps: number;
  lapses: number;
  is_proceduralized: Generated<number>;
  consecutive_fast_retrievals: Generated<number>;
  last_reaction_time_ms: number | null;
  last_reviewed_at: string | null;
  scheduled_for: Generated<string>;
  created_at: Generated<string>;
}

export interface ReviewLogsTable {
  id: string;
  card_id: string;
  rating: 1 | 2 | 3 | 4;
  state_before: string;
  stability_before: number;
  difficulty_before: number;
  new_stability: number;
  new_difficulty: number;
  elapsed_ms: number;
  reviewed_at: Generated<string>;
}

export interface WritingPromptsTable {
  id: string;
  title: string;
  prompt_text: string;
  topic: string;
  cefr_level: string;
  suggested_vocabulary_json: string | null;
  created_at: Generated<string>;
}

export interface WritingSubmissionsTable {
  id: string;
  user_id: Generated<string>;
  prompt_id: string | null;
  submission_mode: Generated<'FREE' | 'GUIDED' | 'MICRO_WRITING'>;
  user_text: string;
  word_count: number;
  status: 'DRAFT' | 'SOCRATIC_PHASE_1' | 'SOCRATIC_PHASE_2' | 'EVALUATED' | 'ERROR';
  submitted_at: Generated<string>;
}

export interface WritingDraftRevisionsTable {
  id: string;
  submission_id: string;
  revision_number: number;
  draft_text: string;
  ai_scaffold_level: Generated<'LEVEL_1_ELICITATION' | 'LEVEL_2_METALINGUISTIC' | 'LEVEL_3_CLOZE' | 'LEVEL_4_EXPLICIT_MODEL'>;
  ai_hints_json: string | null;
  resolved_errors_count: number;
  created_at: Generated<string>;
}

export interface WritingEvaluationsTable {
  id: string;
  submission_id: string;
  model_used: 'gemini-3.5-flash-lite' | 'gemini-3.6-flash' | 'gemini-3.7-flash' | 'gemini-3.8-flash';
  estimated_cefr: string;
  grammar_score: number;
  vocabulary_score: number;
  coherence_score: number;
  overall_feedback_es: string;
  corrections_json: string;
  micro_challenge_json: string | null;
  successful_repairs_json: string | null;
  evaluated_at: Generated<string>;
}

export interface UserStreaksTable {
  id: string;
  user_id: Generated<string>;
  current_streak: number;
  longest_streak: number;
  last_activity_date: string | null;
  available_freezes: number;
  is_in_grace_period: Generated<number>;
  updated_at: Generated<string>;
}

export interface NotificationSettingsTable {
  user_id: string;
  enabled: number;
  schedule_mode: 'AUTO' | 'MANUAL';
  manual_time: string;
  detected_time: string | null;
  // Per-activity settings:
  srs_enabled: number;
  srs_schedule_mode: 'AUTO' | 'MANUAL';
  srs_manual_time: string;
  srs_detected_time: string | null;
  writing_enabled: number;
  writing_schedule_mode: 'AUTO' | 'MANUAL';
  writing_manual_time: string;
  writing_detected_time: string | null;
  streak_saver_enabled: number;
  srs_batch_enabled: number;
  srs_batch_threshold: number;
  quiet_hours_start: string;
  quiet_hours_end: string;
  minimize_to_tray: number;
  updated_at: Generated<string>;
}

export interface NotificationLogsTable {
  id: string;
  user_id: Generated<string>;
  notification_type:
    | 'PRACTICE_REMINDER'
    | 'PRACTICE_REMINDER_SRS'
    | 'PRACTICE_REMINDER_WRITING'
    | 'STREAK_SAVER_1'
    | 'STREAK_SAVER_2'
    | 'SRS_BATCH'
    | 'TEST';
  title: string;
  body: string;
  sent_at: Generated<string>;
}

export interface AppSettingsTable {
  key: string;
  value: string;
  updated_at: Generated<string>;
}

export interface DatabaseSchema {
  vocab_items: VocabItemsTable;
  phraseological_units: PhraseologicalUnitsTable;
  vocab_context_examples: VocabContextExamplesTable;
  srs_cards: SrsCardsTable;
  review_logs: ReviewLogsTable;
  writing_prompts: WritingPromptsTable;
  writing_submissions: WritingSubmissionsTable;
  writing_draft_revisions: WritingDraftRevisionsTable;
  writing_evaluations: WritingEvaluationsTable;
  user_streaks: UserStreaksTable;
  notification_settings: NotificationSettingsTable;
  notification_logs: NotificationLogsTable;
  app_settings: AppSettingsTable;
}

