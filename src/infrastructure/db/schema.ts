export const SQLITE_DDL_SCHEMA = `
PRAGMA foreign_keys = ON;

-- 1. Tabla de Usuarios y Preferencias Locales
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    target_accent TEXT NOT NULL DEFAULT 'GENERAL_AMERICAN' CHECK(target_accent IN ('GENERAL_AMERICAN', 'RECEIVED_PRONUNCIATION')),
    current_cefr_target TEXT NOT NULL DEFAULT 'B1' CHECK(current_cefr_target IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
    default_ai_model TEXT NOT NULL DEFAULT 'gemini-3.8-flash' CHECK(default_ai_model IN ('gemini-3.5-flash', 'gemini-3.6-flash', 'gemini-3.7-flash', 'gemini-3.8-flash')),
    api_key_rotation_mode TEXT NOT NULL DEFAULT 'FAILOVER_ON_QUOTA' CHECK(api_key_rotation_mode IN ('FAILOVER_ON_QUOTA', 'MANUAL_PRIMARY', 'ROUND_ROBIN')),
    created_at TEXT NOT NULL DEFAULT (DATETIME('now'))
);

CREATE TABLE IF NOT EXISTS ai_api_keys (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    label TEXT NOT NULL,
    api_key_encrypted TEXT NOT NULL,
    masked_key TEXT NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 1 CHECK(is_active IN (0, 1)),
    is_primary INTEGER NOT NULL DEFAULT 0 CHECK(is_primary IN (0, 1)),
    status TEXT NOT NULL DEFAULT 'UNTESTED' CHECK(status IN ('VALID', 'INVALID', 'QUOTA_EXCEEDED', 'UNTESTED')),
    last_tested_at TEXT,
    created_at TEXT NOT NULL DEFAULT (DATETIME('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_api_keys_user ON ai_api_keys(user_id, is_active, is_primary);

CREATE TABLE IF NOT EXISTS api_key_model_quotas (
    id TEXT PRIMARY KEY,
    api_key_id TEXT NOT NULL,
    model_id TEXT NOT NULL CHECK(model_id IN ('gemini-3.5-flash', 'gemini-3.6-flash', 'gemini-3.7-flash', 'gemini-3.8-flash')),
    requests_today INTEGER NOT NULL DEFAULT 0,
    daily_limit INTEGER NOT NULL DEFAULT 20,
    rpm_limit INTEGER NOT NULL DEFAULT 5,
    last_request_timestamp TEXT,
    rpm_cooldown_until TEXT,
    rpd_status TEXT NOT NULL DEFAULT 'AVAILABLE' CHECK(rpd_status IN ('AVAILABLE', 'EXHAUSTED_UNTIL_MIDNIGHT_PT')),
    last_pt_reset_date TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (DATETIME('now')),
    UNIQUE(api_key_id, model_id),
    FOREIGN KEY (api_key_id) REFERENCES ai_api_keys(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_quota_lookup ON api_key_model_quotas(api_key_id, model_id, rpd_status);

-- 2. Catálogo Maestro de Vocabulario (Léxico)
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

-- 3. Unidades Fraseológicas (The Lexical Chunks)
CREATE TABLE IF NOT EXISTS phraseological_units (
    id TEXT PRIMARY KEY,
    primary_vocab_id TEXT,
    chunk_type TEXT NOT NULL CHECK(chunk_type IN ('COLLOCATION', 'PHRASAL_VERB', 'IDIOM', 'BINOMIAL', 'SENTENCE_FRAME')),
    text TEXT NOT NULL,
    meaning_es TEXT NOT NULL,
    phrasal_verb_type TEXT CHECK(phrasal_verb_type IN ('TYPE_1_INTRANSITIVE', 'TYPE_2_SEPARABLE', 'TYPE_3_INSEPARABLE', 'TYPE_4_THREE_PART')),
    example_1 TEXT NOT NULL,
    example_2 TEXT,
    cefr_level TEXT NOT NULL CHECK(cefr_level IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
    created_at TEXT NOT NULL DEFAULT (DATETIME('now')),
    FOREIGN KEY (primary_vocab_id) REFERENCES vocab_items(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_phrase_type ON phraseological_units(chunk_type);
CREATE INDEX IF NOT EXISTS idx_phrase_primary_vocab ON phraseological_units(primary_vocab_id);

-- 4. Reglas Gramaticales
CREATE TABLE IF NOT EXISTS grammar_rules (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    category TEXT NOT NULL CHECK(category IN ('VERB_TENSES', 'MODALS', 'PREPOSITIONS', 'CLAUSES', 'ADJECTIVES_ADVERBS', 'SENTENCE_STRUCTURE')),
    explanation_es TEXT NOT NULL,
    formula_syntax TEXT,
    contrastive_l1_note TEXT,
    cefr_level TEXT NOT NULL CHECK(cefr_level IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
    created_at TEXT NOT NULL DEFAULT (DATETIME('now'))
);

CREATE INDEX IF NOT EXISTS idx_grammar_code ON grammar_rules(code);

-- 5. Catálogo de Fonética y Habla Conectada
CREATE TABLE IF NOT EXISTS phonetic_rules (
    id TEXT PRIMARY KEY,
    rule_type TEXT NOT NULL CHECK(rule_type IN ('ELISION', 'ASSIMILATION_REGRESSIVE', 'ASSIMILATION_COALESCENT', 'LINKING_CV', 'LINKING_VV_J', 'LINKING_VV_W', 'LINKING_R', 'GEMINATION', 'WEAK_FORM')),
    rule_name TEXT NOT NULL,
    pattern_regex TEXT,
    description_es TEXT NOT NULL,
    example_sentence TEXT NOT NULL,
    example_ipa_breakdown TEXT NOT NULL,
    audio_sample_path TEXT,
    created_at TEXT NOT NULL DEFAULT (DATETIME('now'))
);

CREATE INDEX IF NOT EXISTS idx_phonetic_rule_type ON phonetic_rules(rule_type);

-- 6. Repetición Espaciada FSRS: Tarjetas de Repaso
CREATE TABLE IF NOT EXISTS srs_cards (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    target_type TEXT NOT NULL CHECK(target_type IN ('VOCAB', 'PHRASE', 'GRAMMAR', 'PHONETICS')),
    target_id TEXT NOT NULL,
    state TEXT NOT NULL DEFAULT 'NEW' CHECK(state IN ('NEW', 'LEARNING', 'REVIEW', 'RELEARNING')),
    stability REAL NOT NULL DEFAULT 0.0,
    difficulty REAL NOT NULL DEFAULT 5.0,
    reps INTEGER NOT NULL DEFAULT 0,
    lapses INTEGER NOT NULL DEFAULT 0,
    last_reviewed_at TEXT,
    scheduled_for TEXT NOT NULL DEFAULT (DATETIME('now')),
    created_at TEXT NOT NULL DEFAULT (DATETIME('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_srs_due ON srs_cards(user_id, scheduled_for, state);
CREATE INDEX IF NOT EXISTS idx_srs_target ON srs_cards(target_type, target_id);

-- 7. Historial Detallado de Repasos FSRS
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

-- 8. Taller de Redacción y Prompts Guiados
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
    user_id TEXT NOT NULL,
    prompt_id TEXT,
    user_text TEXT NOT NULL,
    word_count INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'DRAFT' CHECK(status IN ('DRAFT', 'EVALUATING', 'EVALUATED', 'ERROR')),
    submitted_at TEXT NOT NULL DEFAULT (DATETIME('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (prompt_id) REFERENCES writing_prompts(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_sub_user ON writing_submissions(user_id, submitted_at);

-- 9. Evaluaciones con IA (Google Gemini)
CREATE TABLE IF NOT EXISTS writing_evaluations (
    id TEXT PRIMARY KEY,
    submission_id TEXT NOT NULL UNIQUE,
    model_used TEXT NOT NULL DEFAULT 'gemini-3.8-flash' CHECK(model_used IN ('gemini-3.5-flash', 'gemini-3.6-flash', 'gemini-3.7-flash', 'gemini-3.8-flash')),
    estimated_cefr TEXT NOT NULL CHECK(estimated_cefr IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
    grammar_score REAL NOT NULL,
    vocabulary_score REAL NOT NULL,
    coherence_score REAL NOT NULL,
    overall_feedback_es TEXT NOT NULL,
    corrections_json TEXT NOT NULL,
    micro_challenge_json TEXT,
    evaluated_at TEXT NOT NULL DEFAULT (DATETIME('now')),
    FOREIGN KEY (submission_id) REFERENCES writing_submissions(id) ON DELETE CASCADE
);

-- 10. Taxonomía de Errores y Diagnóstico de Fallas Crónicas
CREATE TABLE IF NOT EXISTS error_taxonomy (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    domain TEXT NOT NULL CHECK(domain IN ('GRAMMAR', 'LEXICON', 'PHONETICS', 'PRAGMATICS')),
    severity TEXT NOT NULL DEFAULT 'MEDIUM' CHECK(severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    label_es TEXT NOT NULL,
    detailed_explanation_es TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS user_errors (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    error_taxonomy_id TEXT NOT NULL,
    source TEXT NOT NULL CHECK(source IN ('SRS', 'WRITING_EVALUATION', 'PHONETICS_DRILL')),
    source_reference_id TEXT,
    context_snippet TEXT,
    incorrect_token TEXT,
    correct_token TEXT,
    committed_at TEXT NOT NULL DEFAULT (DATETIME('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (error_taxonomy_id) REFERENCES error_taxonomy(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_errors_user_taxon ON user_errors(user_id, error_taxonomy_id, committed_at);

CREATE TABLE IF NOT EXISTS weakness_metrics (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    error_taxonomy_id TEXT NOT NULL,
    occurrences_last_7_days INTEGER NOT NULL DEFAULT 0,
    total_occurrences INTEGER NOT NULL DEFAULT 0,
    weakness_score REAL NOT NULL DEFAULT 0.0,
    last_detected_at TEXT NOT NULL,
    UNIQUE(user_id, error_taxonomy_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (error_taxonomy_id) REFERENCES error_taxonomy(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS micro_workouts (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    weakness_metric_id TEXT NOT NULL,
    title TEXT NOT NULL,
    exercises_json TEXT NOT NULL,
    is_completed INTEGER NOT NULL DEFAULT 0 CHECK(is_completed IN (0, 1)),
    completed_at TEXT,
    created_at TEXT NOT NULL DEFAULT (DATETIME('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (weakness_metric_id) REFERENCES weakness_metrics(id) ON DELETE CASCADE
);

-- 11. Hábitos, Tareas Diarias (Daily Quests) y Rachas
CREATE TABLE IF NOT EXISTS user_streaks (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL UNIQUE,
    current_streak INTEGER NOT NULL DEFAULT 0,
    longest_streak INTEGER NOT NULL DEFAULT 0,
    last_activity_date TEXT,
    available_freezes INTEGER NOT NULL DEFAULT 1,
    updated_at TEXT NOT NULL DEFAULT (DATETIME('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS streak_freeze_logs (
    id TEXT PRIMARY KEY,
    user_streak_id TEXT NOT NULL,
    event_type TEXT NOT NULL CHECK(event_type IN ('CONSUMED', 'EARNED_BONUS', 'RESET')),
    affected_date TEXT NOT NULL,
    reason TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (DATETIME('now')),
    FOREIGN KEY (user_streak_id) REFERENCES user_streaks(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS daily_quests (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    quest_date TEXT NOT NULL,
    quest_type TEXT NOT NULL CHECK(quest_type IN ('VOCAB_SRS', 'PHONETICS_LISTEN', 'WRITING_SUBMISSION', 'MICRO_WORKOUT', 'SPEED_DRILL', 'GRADED_READER')),
    description TEXT NOT NULL,
    target_count INTEGER NOT NULL DEFAULT 1,
    current_count INTEGER NOT NULL DEFAULT 0,
    is_completed INTEGER NOT NULL DEFAULT 0 CHECK(is_completed IN (0, 1)),
    completed_at TEXT,
    UNIQUE(user_id, quest_date, quest_type),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_quests_user_date ON daily_quests(user_id, quest_date);

-- 12. Banco de Contextos Dinámicos y Rotación de Ejemplos para FSRS
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

-- 13. Lector Inteligente de Input Comprensible (i+1 Graded Reader)
CREATE TABLE IF NOT EXISTS reader_articles (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    content_text TEXT NOT NULL,
    source_url TEXT,
    cefr_level TEXT CHECK(cefr_level IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
    total_words INTEGER NOT NULL,
    read_percentage REAL NOT NULL DEFAULT 0.0,
    created_at TEXT NOT NULL DEFAULT (DATETIME('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_articles_user_cefr ON reader_articles(user_id, cefr_level);

-- 14. Revisiones de Borradores y Taller Socrático de Redacción
CREATE TABLE IF NOT EXISTS writing_draft_revisions (
    id TEXT PRIMARY KEY,
    submission_id TEXT NOT NULL,
    revision_number INTEGER NOT NULL DEFAULT 1,
    draft_text TEXT NOT NULL,
    ai_hints_json TEXT,
    resolved_errors_count INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (DATETIME('now')),
    FOREIGN KEY (submission_id) REFERENCES writing_submissions(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_draft_submission ON writing_draft_revisions(submission_id, revision_number);

-- 15. Sesiones de Proceduralización y Drills de Velocidad
CREATE TABLE IF NOT EXISTS speed_drill_sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    drill_type TEXT NOT NULL CHECK(drill_type IN ('COLLOCATION_BLITZ', 'PREPOSITION_RAPID_FIRE', 'CONNECTED_SPEECH_EAR')),
    total_prompts INTEGER NOT NULL,
    correct_count INTEGER NOT NULL,
    avg_response_time_ms REAL NOT NULL,
    completed_at TEXT NOT NULL DEFAULT (DATETIME('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_drills_user_type ON speed_drill_sessions(user_id, drill_type);
`;
