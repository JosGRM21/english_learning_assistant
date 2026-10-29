export const SQLITE_DDL_SCHEMA = `
PRAGMA foreign_keys = ON;

-- 1. Catálogo Maestro de Vocabulario (Léxico)
CREATE TABLE IF NOT EXISTS vocab_items (
    id TEXT PRIMARY KEY,
    word TEXT NOT NULL,
    grammatical_dimension TEXT NOT NULL CHECK(grammatical_dimension IN ('CONTENT', 'FUNCTION', 'CHUNK')),
    part_of_speech TEXT NOT NULL CHECK(part_of_speech IN ('NOUN', 'VERB', 'ADJECTIVE', 'ADVERB', 'PREPOSITION', 'CONJUNCTION', 'ARTICLE_DETERMINER', 'PRONOUN', 'INTERJECTION')),
    subcategory TEXT,
    definition_en TEXT NOT NULL,
    translation_es TEXT NOT NULL,
    ipa_general_american TEXT NOT NULL,
    ipa_received_pronunciation TEXT,
    ipa_weak_form TEXT,
    cefr_level TEXT NOT NULL CHECK(cefr_level IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
    frequency_band TEXT CHECK(frequency_band IN ('TOP_500', 'TOP_1000', 'TOP_3000', 'TOP_5000')),
    is_core INTEGER NOT NULL DEFAULT 1 CHECK(is_core IN (0, 1)),
    mastery_status TEXT NOT NULL DEFAULT 'INACTIVE' CHECK(mastery_status IN ('INACTIVE', 'NEW', 'LEARNING', 'RECEPTIVE_MASTERY', 'RECEPTIVE_MASTERED', 'PRODUCTIVE_MASTERY', 'PRODUCTIVE_ACTIVE')),
    is_separable INTEGER CHECK(is_separable IN (0, 1)),
    phonetic_ed_ending TEXT,
    is_false_friend INTEGER NOT NULL DEFAULT 0 CHECK(is_false_friend IN (0, 1)),
    false_friend_note TEXT,
    verb_tenses_json TEXT,
    domain_category TEXT,
    alternate_senses_json TEXT,
    senses_json TEXT,
    phrasal_verbs_json TEXT,
    created_at TEXT NOT NULL DEFAULT (DATETIME('now'))
);

CREATE INDEX IF NOT EXISTS idx_vocab_word ON vocab_items(word);
CREATE INDEX IF NOT EXISTS idx_vocab_word_nocase ON vocab_items(word COLLATE NOCASE);
CREATE INDEX IF NOT EXISTS idx_vocab_pos ON vocab_items(part_of_speech);
CREATE INDEX IF NOT EXISTS idx_vocab_cefr ON vocab_items(cefr_level);
CREATE INDEX IF NOT EXISTS idx_vocab_false_friend ON vocab_items(is_false_friend);
CREATE INDEX IF NOT EXISTS idx_vocab_core_status ON vocab_items(is_core, mastery_status);
CREATE INDEX IF NOT EXISTS idx_vocab_core_criteria ON vocab_items(is_core, mastery_status, cefr_level, frequency_band);
CREATE INDEX IF NOT EXISTS idx_vocab_frequency ON vocab_items(frequency_band);

-- 2. Unidades Fraseológicas (Lexical Chunks)
CREATE TABLE IF NOT EXISTS phraseological_units (
    id TEXT PRIMARY KEY,
    primary_vocab_id TEXT,
    chunk_type TEXT NOT NULL CHECK(chunk_type IN ('PHRASAL_VERB', 'IDIOM', 'BINOMIAL', 'SENTENCE_FRAME')),
    text TEXT NOT NULL,
    meaning_es TEXT NOT NULL,
    definition_en TEXT NOT NULL DEFAULT '',
    ipa_general_american TEXT,
    ipa_received_pronunciation TEXT,
    phrasal_verb_type TEXT CHECK(phrasal_verb_type IN ('TYPE_1_INTRANSITIVE', 'TYPE_2_SEPARABLE', 'TYPE_3_INSEPARABLE', 'TYPE_4_THREE_PART')),
    pronoun_must_split INTEGER NOT NULL DEFAULT 0 CHECK(pronoun_must_split IN (0, 1)),
    example_1 TEXT NOT NULL,
    example_1_es TEXT NOT NULL DEFAULT '',
    example_2 TEXT,
    example_2_es TEXT,
    cefr_level TEXT NOT NULL CHECK(cefr_level IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
    mastery_status TEXT NOT NULL DEFAULT 'INACTIVE' CHECK(mastery_status IN ('INACTIVE', 'LEARNING', 'NEW', 'RECEPTIVE_MASTERY', 'RECEPTIVE_MASTERED', 'PRODUCTIVE_MASTERY', 'PRODUCTIVE_ACTIVE')),
    created_at TEXT NOT NULL DEFAULT (DATETIME('now')),
    FOREIGN KEY (primary_vocab_id) REFERENCES vocab_items(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_phrase_type ON phraseological_units(chunk_type);
CREATE INDEX IF NOT EXISTS idx_phrase_primary_vocab ON phraseological_units(primary_vocab_id);
CREATE INDEX IF NOT EXISTS idx_phrase_status_cefr ON phraseological_units(mastery_status, cefr_level);

-- 3. Banco de Contextos Dinámicos
CREATE TABLE IF NOT EXISTS vocab_context_examples (
    id TEXT PRIMARY KEY,
    vocab_id TEXT,
    phrase_id TEXT,
    sense_index INTEGER NOT NULL DEFAULT 0,
    sentence_en TEXT NOT NULL,
    sentence_es TEXT NOT NULL,
    cloze_target TEXT NOT NULL,
    audio_url TEXT,
    cefr_level TEXT NOT NULL CHECK(cefr_level IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
    created_at TEXT NOT NULL DEFAULT (DATETIME('now')),
    FOREIGN KEY (vocab_id) REFERENCES vocab_items(id) ON DELETE CASCADE,
    FOREIGN KEY (phrase_id) REFERENCES phraseological_units(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_context_vocab ON vocab_context_examples(vocab_id);
CREATE INDEX IF NOT EXISTS idx_context_phrase ON vocab_context_examples(phrase_id);
CREATE INDEX IF NOT EXISTS idx_context_vocab_sense ON vocab_context_examples(vocab_id, sense_index);

-- 4. Repetición Espaciada FSRS 5.0
CREATE TABLE IF NOT EXISTS srs_cards (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL DEFAULT 'user_local',
    target_type TEXT NOT NULL CHECK(target_type IN ('VOCAB', 'PHRASE')),
    target_id TEXT NOT NULL,
    srs_profile TEXT NOT NULL DEFAULT 'VOCAB_AGILE' CHECK(srs_profile IN ('VOCAB_AGILE')),
    state TEXT NOT NULL DEFAULT 'NEW' CHECK(state IN ('NEW', 'LEARNING', 'REVIEW', 'RELEARNING')),
    stability REAL NOT NULL DEFAULT 0.0,
    difficulty REAL NOT NULL DEFAULT 5.0,
    reps INTEGER NOT NULL DEFAULT 0,
    lapses INTEGER NOT NULL DEFAULT 0,
    consecutive_lapses INTEGER NOT NULL DEFAULT 0,
    is_leech INTEGER NOT NULL DEFAULT 0 CHECK(is_leech IN (0, 1)),
    is_proceduralized INTEGER NOT NULL DEFAULT 0 CHECK(is_proceduralized IN (0, 1)),
    consecutive_fast_retrievals INTEGER NOT NULL DEFAULT 0,
    last_reaction_time_ms INTEGER,
    last_reviewed_at TEXT,
    scheduled_for TEXT NOT NULL DEFAULT (DATETIME('now')),
    created_at TEXT NOT NULL DEFAULT (DATETIME('now'))
);

CREATE INDEX IF NOT EXISTS idx_srs_due ON srs_cards(scheduled_for, state);
CREATE INDEX IF NOT EXISTS idx_srs_user_due ON srs_cards(user_id, scheduled_for, state);
CREATE INDEX IF NOT EXISTS idx_srs_user_state ON srs_cards(user_id, state, scheduled_for);
CREATE INDEX IF NOT EXISTS idx_srs_weak ON srs_cards(user_id, target_type, stability);
CREATE INDEX IF NOT EXISTS idx_srs_target ON srs_cards(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_srs_profile ON srs_cards(srs_profile);
CREATE UNIQUE INDEX IF NOT EXISTS idx_srs_target_unique ON srs_cards(target_type, target_id);

CREATE TABLE IF NOT EXISTS review_logs (
    id TEXT PRIMARY KEY,
    card_id TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK(rating IN (1, 2, 3, 4)),
    state_before TEXT NOT NULL,
    stability_before REAL NOT NULL,
    difficulty_before REAL NOT NULL,
    new_stability REAL NOT NULL,
    new_difficulty REAL NOT NULL,
    elapsed_ms INTEGER NOT NULL DEFAULT 0,
    reviewed_at TEXT NOT NULL DEFAULT (DATETIME('now')),
    FOREIGN KEY (card_id) REFERENCES srs_cards(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_review_card ON review_logs(card_id);
CREATE INDEX IF NOT EXISTS idx_review_time ON review_logs(reviewed_at);

-- 5. Taller de Redacción Socrática
CREATE TABLE IF NOT EXISTS writing_submissions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL DEFAULT 'user_local',
    submission_mode TEXT NOT NULL DEFAULT 'FREE' CHECK(submission_mode IN ('FREE', 'GUIDED', 'MICRO_WRITING', 'READING_TO_WRITE')),
    user_text TEXT NOT NULL,
    word_count INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'DRAFT' CHECK(status IN ('DRAFT', 'SOCRATIC_PHASE_1', 'SOCRATIC_PHASE_2', 'EVALUATED', 'ERROR')),
    submitted_at TEXT NOT NULL DEFAULT (DATETIME('now'))
);

CREATE INDEX IF NOT EXISTS idx_sub_date ON writing_submissions(submitted_at);
CREATE INDEX IF NOT EXISTS idx_sub_user_date ON writing_submissions(user_id, submitted_at DESC);

CREATE TABLE IF NOT EXISTS writing_draft_revisions (
    id TEXT PRIMARY KEY,
    submission_id TEXT NOT NULL,
    revision_number INTEGER NOT NULL DEFAULT 1,
    draft_text TEXT NOT NULL,
    ai_scaffold_level TEXT NOT NULL DEFAULT 'LEVEL_1_ELICITATION' CHECK(ai_scaffold_level IN ('LEVEL_1_ELICITATION', 'LEVEL_2_METALINGUISTIC', 'LEVEL_3_CLOZE', 'LEVEL_4_EXPLICIT_MODEL')),
    ai_hints_json TEXT,
    resolved_errors_count INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (DATETIME('now')),
    FOREIGN KEY (submission_id) REFERENCES writing_submissions(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_draft_submission ON writing_draft_revisions(submission_id, revision_number);

CREATE TABLE IF NOT EXISTS writing_evaluations (
    id TEXT PRIMARY KEY,
    submission_id TEXT NOT NULL UNIQUE,
    model_used TEXT NOT NULL DEFAULT 'gemini-3.8-flash' CHECK(model_used IN ('gemini-3.5-flash-lite', 'gemini-3.6-flash', 'gemini-3.7-flash', 'gemini-3.8-flash')),
    estimated_cefr TEXT NOT NULL CHECK(estimated_cefr IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
    clean_structural_version TEXT NOT NULL DEFAULT '',
    native_recast_version TEXT NOT NULL DEFAULT '',
    noticing_the_gap_json TEXT NOT NULL DEFAULT '[]',
    accuracy_score REAL NOT NULL DEFAULT 0.0,
    range_precision_score REAL NOT NULL DEFAULT 0.0,
    cohesion_flow_score REAL NOT NULL DEFAULT 0.0,
    pragmatics_complexity_score REAL NOT NULL DEFAULT 0.0,
    overall_feedback_es TEXT NOT NULL,
    qualitative_recommendations_es TEXT NOT NULL DEFAULT '',
    corrections_json TEXT NOT NULL,
    successful_repairs_json TEXT,
    evaluated_at TEXT NOT NULL DEFAULT (DATETIME('now')),
    FOREIGN KEY (submission_id) REFERENCES writing_submissions(id) ON DELETE CASCADE
);

-- 6. Racha de Estudio Local (Streak)
CREATE TABLE IF NOT EXISTS user_streaks (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL DEFAULT 'user_local' UNIQUE,
    current_streak INTEGER NOT NULL DEFAULT 0,
    longest_streak INTEGER NOT NULL DEFAULT 0,
    last_activity_date TEXT,
    available_freezes INTEGER NOT NULL DEFAULT 1,
    is_in_grace_period INTEGER NOT NULL DEFAULT 0 CHECK(is_in_grace_period IN (0, 1)),
    updated_at TEXT NOT NULL DEFAULT (DATETIME('now'))
);

INSERT OR IGNORE INTO user_streaks (id, user_id, current_streak, longest_streak, available_freezes)
VALUES ('streak_local', 'user_local', 0, 0, 1);

-- 7. Configuración y Registro de Notificaciones de Estudio
CREATE TABLE IF NOT EXISTS notification_settings (
    user_id TEXT PRIMARY KEY DEFAULT 'user_local',
    enabled INTEGER NOT NULL DEFAULT 1 CHECK(enabled IN (0, 1)),
    schedule_mode TEXT NOT NULL DEFAULT 'AUTO' CHECK(schedule_mode IN ('AUTO', 'MANUAL')),
    manual_time TEXT NOT NULL DEFAULT '20:00',
    detected_time TEXT DEFAULT '19:30',
    srs_enabled INTEGER NOT NULL DEFAULT 1 CHECK(srs_enabled IN (0, 1)),
    srs_schedule_mode TEXT NOT NULL DEFAULT 'AUTO' CHECK(srs_schedule_mode IN ('AUTO', 'MANUAL')),
    srs_manual_time TEXT NOT NULL DEFAULT '19:00',
    srs_detected_time TEXT DEFAULT '19:00',
    writing_enabled INTEGER NOT NULL DEFAULT 1 CHECK(writing_enabled IN (0, 1)),
    writing_schedule_mode TEXT NOT NULL DEFAULT 'AUTO' CHECK(writing_schedule_mode IN ('AUTO', 'MANUAL')),
    writing_manual_time TEXT NOT NULL DEFAULT '21:00',
    writing_detected_time TEXT DEFAULT '21:00',
    streak_saver_enabled INTEGER NOT NULL DEFAULT 1 CHECK(streak_saver_enabled IN (0, 1)),
    srs_batch_enabled INTEGER NOT NULL DEFAULT 1 CHECK(srs_batch_enabled IN (0, 1)),
    srs_batch_threshold INTEGER NOT NULL DEFAULT 10,
    quiet_hours_start TEXT NOT NULL DEFAULT '23:30',
    quiet_hours_end TEXT NOT NULL DEFAULT '08:00',
    minimize_to_tray INTEGER NOT NULL DEFAULT 1 CHECK(minimize_to_tray IN (0, 1)),
    updated_at TEXT NOT NULL DEFAULT (DATETIME('now'))
);

INSERT OR IGNORE INTO notification_settings (user_id) VALUES ('user_local');

CREATE TABLE IF NOT EXISTS notification_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL DEFAULT 'user_local',
    notification_type TEXT NOT NULL CHECK(notification_type IN ('PRACTICE_REMINDER', 'PRACTICE_REMINDER_SRS', 'PRACTICE_REMINDER_WRITING', 'STREAK_SAVER_1', 'STREAK_SAVER_2', 'SRS_BATCH', 'TEST')),
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    sent_at TEXT NOT NULL DEFAULT (DATETIME('now'))
);

CREATE INDEX IF NOT EXISTS idx_notif_logs_type_time ON notification_logs(notification_type, sent_at);
CREATE INDEX IF NOT EXISTS idx_notif_user_time ON notification_logs(user_id, sent_at DESC);

-- 12. Configuración Global de la Aplicación (Claves AI, Modelo Preferido, Cuotas)
CREATE TABLE IF NOT EXISTS app_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (DATETIME('now'))
);

PRAGMA user_version = 8;
`;

export const CLEANUP_OBSOLETE_TABLES_SQL = `
DROP TABLE IF EXISTS writing_error_logs;
DROP TABLE IF EXISTS users_new;
DROP TABLE IF EXISTS writing_evaluations_new;
DROP TABLE IF EXISTS api_key_model_quotas_new;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS ai_api_keys;
DROP TABLE IF EXISTS api_key_model_quotas;
DROP TABLE IF EXISTS conceptual_motion_verbs;
DROP TABLE IF EXISTS polysemic_pairs;
DROP TABLE IF EXISTS grammar_rules;
DROP TABLE IF EXISTS l1_transfer_rules;
DROP TABLE IF EXISTS phonetic_rules;
DROP TABLE IF EXISTS speed_drill_sessions;
DROP TABLE IF EXISTS error_taxonomy;
DROP TABLE IF EXISTS user_errors;
DROP TABLE IF EXISTS weakness_metrics;
DROP TABLE IF EXISTS micro_workouts;
DROP TABLE IF EXISTS daily_quests;
DROP TABLE IF EXISTS streak_freeze_logs;
DROP TABLE IF EXISTS reader_articles;
DROP TABLE IF EXISTS prosody_rules;
DROP TABLE IF EXISTS prosody_shadowing_records;
DROP TABLE IF EXISTS tblt_tasks;
DROP TABLE IF EXISTS tblt_task_submissions;
`;
