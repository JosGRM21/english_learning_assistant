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
    cefr_level TEXT NOT NULL CHECK(cefr_level IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
    is_false_friend INTEGER NOT NULL DEFAULT 0 CHECK(is_false_friend IN (0, 1)),
    false_friend_note TEXT,
    morphological_family_json TEXT,
    created_at TEXT NOT NULL DEFAULT (DATETIME('now'))
);

CREATE INDEX IF NOT EXISTS idx_vocab_word ON vocab_items(word);
CREATE INDEX IF NOT EXISTS idx_vocab_pos ON vocab_items(part_of_speech);
CREATE INDEX IF NOT EXISTS idx_vocab_cefr ON vocab_items(cefr_level);
CREATE INDEX IF NOT EXISTS idx_vocab_false_friend ON vocab_items(is_false_friend);

-- 2. Unidades Fraseológicas (Lexical Chunks)
CREATE TABLE IF NOT EXISTS phraseological_units (
    id TEXT PRIMARY KEY,
    primary_vocab_id TEXT,
    chunk_type TEXT NOT NULL CHECK(chunk_type IN ('COLLOCATION', 'PHRASAL_VERB', 'IDIOM', 'BINOMIAL', 'SENTENCE_FRAME')),
    text TEXT NOT NULL,
    meaning_es TEXT NOT NULL,
    phrasal_verb_type TEXT CHECK(phrasal_verb_type IN ('TYPE_1_INTRANSITIVE', 'TYPE_2_SEPARABLE', 'TYPE_3_INSEPARABLE', 'TYPE_4_THREE_PART')),
    pronoun_must_split INTEGER NOT NULL DEFAULT 0 CHECK(pronoun_must_split IN (0, 1)),
    example_1 TEXT NOT NULL,
    example_2 TEXT,
    cefr_level TEXT NOT NULL CHECK(cefr_level IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
    created_at TEXT NOT NULL DEFAULT (DATETIME('now')),
    FOREIGN KEY (primary_vocab_id) REFERENCES vocab_items(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_phrase_type ON phraseological_units(chunk_type);
CREATE INDEX IF NOT EXISTS idx_phrase_primary_vocab ON phraseological_units(primary_vocab_id);

-- 3. Banco de Contextos Dinámicos
CREATE TABLE IF NOT EXISTS vocab_context_examples (
    id TEXT PRIMARY KEY,
    vocab_id TEXT,
    phrase_id TEXT,
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

-- 4. Repetición Espaciada FSRS 4.5
CREATE TABLE IF NOT EXISTS srs_cards (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL DEFAULT 'user_local',
    target_type TEXT NOT NULL CHECK(target_type IN ('VOCAB', 'PHRASE')),
    target_id TEXT NOT NULL,
    state TEXT NOT NULL DEFAULT 'NEW' CHECK(state IN ('NEW', 'LEARNING', 'REVIEW', 'RELEARNING')),
    stability REAL NOT NULL DEFAULT 0.0,
    difficulty REAL NOT NULL DEFAULT 5.0,
    reps INTEGER NOT NULL DEFAULT 0,
    lapses INTEGER NOT NULL DEFAULT 0,
    is_proceduralized INTEGER NOT NULL DEFAULT 0 CHECK(is_proceduralized IN (0, 1)),
    consecutive_fast_retrievals INTEGER NOT NULL DEFAULT 0,
    last_reaction_time_ms INTEGER,
    last_reviewed_at TEXT,
    scheduled_for TEXT NOT NULL DEFAULT (DATETIME('now')),
    created_at TEXT NOT NULL DEFAULT (DATETIME('now'))
);

CREATE INDEX IF NOT EXISTS idx_srs_due ON srs_cards(scheduled_for, state);
CREATE INDEX IF NOT EXISTS idx_srs_target ON srs_cards(target_type, target_id);
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
CREATE TABLE IF NOT EXISTS writing_prompts (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    prompt_text TEXT NOT NULL,
    topic TEXT NOT NULL CHECK(topic IN ('WORK_BUSINESS', 'DAILY_LIFE', 'OPINION_ARGUMENT', 'TECHNOLOGY', 'TRAVEL_CULTURE', 'PERSONAL_REFLECTIONS')),
    cefr_level TEXT NOT NULL CHECK(cefr_level IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
    suggested_vocabulary_json TEXT,
    created_at TEXT NOT NULL DEFAULT (DATETIME('now'))
);

CREATE TABLE IF NOT EXISTS writing_submissions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL DEFAULT 'user_local',
    prompt_id TEXT,
    submission_mode TEXT NOT NULL DEFAULT 'GUIDED' CHECK(submission_mode IN ('FREE', 'GUIDED', 'MICRO_WRITING')),
    user_text TEXT NOT NULL,
    word_count INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'DRAFT' CHECK(status IN ('DRAFT', 'SOCRATIC_PHASE_1', 'SOCRATIC_PHASE_2', 'EVALUATED', 'ERROR')),
    submitted_at TEXT NOT NULL DEFAULT (DATETIME('now')),
    FOREIGN KEY (prompt_id) REFERENCES writing_prompts(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_sub_date ON writing_submissions(submitted_at);

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
    grammar_score REAL NOT NULL,
    vocabulary_score REAL NOT NULL,
    coherence_score REAL NOT NULL,
    overall_feedback_es TEXT NOT NULL,
    corrections_json TEXT NOT NULL,
    micro_challenge_json TEXT,
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

PRAGMA user_version = 1;
`;

export const CLEANUP_OBSOLETE_TABLES_SQL = `
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
