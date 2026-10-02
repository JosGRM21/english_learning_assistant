import { Generated } from 'kysely';

export interface UsersTable {
  id: string;
  username: string;
  target_accent: 'GENERAL_AMERICAN' | 'RECEIVED_PRONUNCIATION';
  current_cefr_target: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  default_ai_model: Generated<'gemini-3.5-flash-lite' | 'gemini-3.6-flash' | 'gemini-3.7-flash' | 'gemini-3.8-flash'>;
  api_key_rotation_mode: Generated<'FAILOVER_ON_QUOTA' | 'MANUAL_PRIMARY' | 'ROUND_ROBIN'>;
  backlog_throttling_enabled: Generated<number>;
  max_daily_review_limit: Generated<number>;
  created_at: Generated<string>;
}

export interface AiApiKeysTable {
  id: string;
  user_id: string;
  label: string;
  api_key_encrypted: string;
  masked_key: string;
  is_active: number;
  is_primary: number;
  status: 'VALID' | 'INVALID' | 'QUOTA_EXCEEDED' | 'UNTESTED';
  last_tested_at: string | null;
  created_at: Generated<string>;
}

export interface ApiKeyModelQuotasTable {
  id: string;
  api_key_id: string;
  model_id: 'gemini-3.5-flash-lite' | 'gemini-3.6-flash' | 'gemini-3.7-flash' | 'gemini-3.8-flash';
  requests_today: number;
  daily_limit: number;
  rpm_limit: number;
  last_request_timestamp: string | null;
  rpm_cooldown_until: string | null;
  rpd_status: 'AVAILABLE' | 'EXHAUSTED_UNTIL_MIDNIGHT_PT';
  last_pt_reset_date: string;
  created_at: Generated<string>;
}

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

export interface ConceptualMotionVerbsTable {
  id: string;
  verb_base: string;
  manner_description_es: string;
  satellite_particles_json: string;
  spanish_static_equivalent: string;
  cefr_level: Generated<string>;
  example_sentence: string;
  created_at: Generated<string>;
}

export interface PolysemicPairsTable {
  id: string;
  pair_code: string;
  title: string;
  explanation_es: string;
  contrast_matrix_json: string;
  created_at: Generated<string>;
}

export interface GrammarRulesTable {
  id: string;
  code: string;
  title: string;
  category: string;
  explanation_es: string;
  formula_syntax: string | null;
  contrastive_l1_note: string | null;
  cefr_level: string;
  created_at: Generated<string>;
}

export interface L1TransferRulesTable {
  id: string;
  rule_code: string;
  domain: 'MORPHOSYNTACTIC' | 'PHONOLOGICAL' | 'LEXICAL' | 'PRAGMATIC';
  spanish_misconception: string;
  target_english_rule: string;
  exercise_template_json: string;
  severity: Generated<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>;
  created_at: Generated<string>;
}

export interface PhoneticRulesTable {
  id: string;
  rule_type: string;
  rule_name: string;
  pattern_regex: string | null;
  description_es: string;
  example_sentence: string;
  example_ipa_breakdown: string;
  audio_sample_path: string | null;
  created_at: Generated<string>;
}

export interface SrsCardsTable {
  id: string;
  user_id: string;
  target_type: 'VOCAB' | 'PHRASE' | 'GRAMMAR' | 'PHONETICS' | 'L1_TRANSFER';
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

export interface SpeedDrillSessionsTable {
  id: string;
  user_id: string;
  drill_type:
    | 'CLAUSE_SHIFT'
    | 'THIRD_PERSON_AUTOMATION'
    | 'PREPOSITION_REFLEX'
    | 'AUDITORY_SNAP_HVPT'
    | 'COLLOCATION_BLITZ'
    | 'PREPOSITION_RAPID_FIRE'
    | 'CONNECTED_SPEECH_EAR';
  total_prompts: number;
  correct_count: number;
  procedural_pass_count: Generated<number>;
  avg_response_time_ms: number;
  completed_at: Generated<string>;
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
  user_id: string;
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

export interface ErrorTaxonomyTable {
  id: string;
  code: string;
  domain: 'GRAMMAR' | 'LEXICON' | 'PHONETICS' | 'PRAGMATICS';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  label_es: string;
  detailed_explanation_es: string;
}

export interface UserErrorsTable {
  id: string;
  user_id: string;
  error_taxonomy_id: string;
  source: 'SRS' | 'WRITING_EVALUATION' | 'PHONETICS_DRILL' | 'SPEED_DRILL';
  source_reference_id: string | null;
  context_snippet: string | null;
  incorrect_token: string | null;
  correct_token: string | null;
  committed_at: Generated<string>;
}

export interface WeaknessMetricsTable {
  id: string;
  user_id: string;
  error_taxonomy_id: string;
  occurrences_last_7_days: number;
  total_occurrences: number;
  weakness_score: number;
  last_detected_at: string;
}

export interface MicroWorkoutsTable {
  id: string;
  user_id: string;
  weakness_metric_id: string;
  title: string;
  exercises_json: string;
  is_completed: number;
  completed_at: string | null;
  created_at: Generated<string>;
}

export interface UserStreaksTable {
  id: string;
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_activity_date: string | null;
  available_freezes: number;
  is_in_grace_period: Generated<number>;
  updated_at: Generated<string>;
}

export interface StreakFreezeLogsTable {
  id: string;
  user_streak_id: string;
  event_type: 'CONSUMED' | 'EARNED_BONUS' | 'RESET';
  affected_date: string;
  reason: string;
  created_at: Generated<string>;
}

export interface DailyQuestsTable {
  id: string;
  user_id: string;
  quest_date: string;
  quest_type:
    | 'VOCAB_SRS'
    | 'PHONETICS_LISTEN'
    | 'MICRO_WORKOUT'
    | 'SPEED_DRILL'
    | 'GRADED_READER'
    | 'WRITING_SUBMISSION';
  description: string;
  target_count: number;
  current_count: number;
  is_completed: number;
  completed_at: string | null;
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

export interface ReaderArticlesTable {
  id: string;
  user_id: string;
  title: string;
  content_text: string;
  source_url: string | null;
  cefr_level: string | null;
  total_words: number;
  lexical_coverage_ratio: Generated<number>;
  reading_mode: Generated<'EXTENSIVE' | 'INTENSIVE' | 'OVERLOAD'>;
  is_simplified: Generated<number>;
  bottom_up_stage: Generated<'STEP_1_BLIND' | 'STEP_2_TONIC' | 'STEP_3_FULL'>;
  read_percentage: number;
  created_at: Generated<string>;
}

export interface DatabaseSchema {
  users: UsersTable;
  ai_api_keys: AiApiKeysTable;
  api_key_model_quotas: ApiKeyModelQuotasTable;
  vocab_items: VocabItemsTable;
  phraseological_units: PhraseologicalUnitsTable;
  conceptual_motion_verbs: ConceptualMotionVerbsTable;
  polysemic_pairs: PolysemicPairsTable;
  grammar_rules: GrammarRulesTable;
  l1_transfer_rules: L1TransferRulesTable;
  phonetic_rules: PhoneticRulesTable;
  srs_cards: SrsCardsTable;
  review_logs: ReviewLogsTable;
  speed_drill_sessions: SpeedDrillSessionsTable;
  writing_prompts: WritingPromptsTable;
  writing_submissions: WritingSubmissionsTable;
  writing_draft_revisions: WritingDraftRevisionsTable;
  writing_evaluations: WritingEvaluationsTable;
  error_taxonomy: ErrorTaxonomyTable;
  user_errors: UserErrorsTable;
  weakness_metrics: WeaknessMetricsTable;
  micro_workouts: MicroWorkoutsTable;
  user_streaks: UserStreaksTable;
  streak_freeze_logs: StreakFreezeLogsTable;
  daily_quests: DailyQuestsTable;
  vocab_context_examples: VocabContextExamplesTable;
  reader_articles: ReaderArticlesTable;
}
