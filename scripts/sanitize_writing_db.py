import sqlite3

db_path = r'C:\Users\Josnaiker Rivas\AppData\Roaming\com.ela.learningassistant\ela.db'
conn = sqlite3.connect(db_path)
cur = conn.cursor()
cur.execute('PRAGMA foreign_keys = OFF;')

print("--- Current Tables in ela.db ---")
for row in cur.execute("SELECT name, sql FROM sqlite_master WHERE type='table'").fetchall():
    print("Table:", row[0])
    if row[1] and 'writing_prompts' in row[1]:
        print("  -> REFERENCES writing_prompts detected in DDL!")

# 1. Drop existing writing tables completely
cur.execute('DROP TABLE IF EXISTS writing_error_logs;')
cur.execute('DROP TABLE IF EXISTS writing_evaluations;')
cur.execute('DROP TABLE IF EXISTS writing_draft_revisions;')
cur.execute('DROP TABLE IF EXISTS writing_submissions_new;')
cur.execute('DROP TABLE IF EXISTS writing_submissions;')
cur.execute('DROP TABLE IF EXISTS writing_prompts;')

# 2. Re-create writing_submissions with the correct modern schema
cur.execute('''
CREATE TABLE writing_submissions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL DEFAULT 'user_local',
    prompt_id TEXT,
    submission_mode TEXT NOT NULL DEFAULT 'FREE' CHECK(submission_mode IN ('FREE', 'GUIDED', 'MICRO_WRITING', 'READING_TO_WRITE')),
    user_text TEXT NOT NULL,
    word_count INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'DRAFT' CHECK(status IN ('DRAFT', 'SOCRATIC_PHASE_1', 'SOCRATIC_PHASE_2', 'EVALUATED', 'ERROR')),
    submitted_at TEXT NOT NULL DEFAULT (DATETIME('now'))
);
''')
cur.execute('CREATE INDEX IF NOT EXISTS idx_sub_date ON writing_submissions(submitted_at);')

# 3. Re-create writing_draft_revisions
cur.execute('''
CREATE TABLE writing_draft_revisions (
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
''')
cur.execute('CREATE INDEX IF NOT EXISTS idx_draft_submission ON writing_draft_revisions(submission_id, revision_number);')

# 4. Re-create writing_evaluations
cur.execute('''
CREATE TABLE writing_evaluations (
    id TEXT PRIMARY KEY,
    submission_id TEXT NOT NULL UNIQUE,
    model_used TEXT NOT NULL DEFAULT 'gemini-3.8-flash' CHECK(model_used IN ('gemini-3.5-flash-lite', 'gemini-3.6-flash', 'gemini-3.7-flash', 'gemini-3.8-flash')),
    estimated_cefr TEXT NOT NULL CHECK(estimated_cefr IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
    clean_structural_version TEXT NOT NULL DEFAULT '',
    native_recast_version TEXT NOT NULL DEFAULT '',
    noticing_the_gap_json TEXT NOT NULL DEFAULT '[]',
    grammar_score REAL NOT NULL,
    vocabulary_score REAL NOT NULL,
    coherence_score REAL NOT NULL,
    accuracy_score REAL NOT NULL DEFAULT 0.0,
    range_precision_score REAL NOT NULL DEFAULT 0.0,
    cohesion_flow_score REAL NOT NULL DEFAULT 0.0,
    pragmatics_complexity_score REAL NOT NULL DEFAULT 0.0,
    overall_feedback_es TEXT NOT NULL,
    qualitative_recommendations_es TEXT NOT NULL DEFAULT '',
    corrections_json TEXT NOT NULL,
    micro_challenge_json TEXT,
    successful_repairs_json TEXT,
    evaluated_at TEXT NOT NULL DEFAULT (DATETIME('now')),
    FOREIGN KEY (submission_id) REFERENCES writing_submissions(id) ON DELETE CASCADE
);
''')

# 5. Re-create writing_error_logs
cur.execute('''
CREATE TABLE writing_error_logs (
    id TEXT PRIMARY KEY,
    submission_id TEXT NOT NULL,
    user_id TEXT NOT NULL DEFAULT 'user_local',
    error_span TEXT NOT NULL,
    error_type TEXT NOT NULL,
    taxonomy_code TEXT NOT NULL,
    is_l1_spanish_transfer INTEGER NOT NULL DEFAULT 1 CHECK(is_l1_spanish_transfer IN (0, 1)),
    explanation_es TEXT NOT NULL,
    native_reformulation TEXT NOT NULL,
    original_sentence TEXT NOT NULL DEFAULT '',
    expanded_context TEXT NOT NULL DEFAULT '',
    drill_format TEXT NOT NULL DEFAULT 'CONTEXTUAL_CLOZE' CHECK(drill_format IN ('CONTEXTUAL_CLOZE', 'C_TEST', 'SENTENCE_REWRITE', 'CHUNK_SCRAMBLE')),
    drill_data_json TEXT NOT NULL DEFAULT '{}',
    srs_card_id TEXT,
    mastery_status TEXT NOT NULL DEFAULT 'LEARNING' CHECK(mastery_status IN ('LEARNING', 'INTERNALIZED', 'RECIDIVIST')),
    is_fossilized_alert INTEGER NOT NULL DEFAULT 0 CHECK(is_fossilized_alert IN (0, 1)),
    times_recidivist INTEGER NOT NULL DEFAULT 0,
    is_resolved INTEGER NOT NULL DEFAULT 0 CHECK(is_resolved IN (0, 1)),
    created_at TEXT NOT NULL DEFAULT (DATETIME('now')),
    FOREIGN KEY (submission_id) REFERENCES writing_submissions(id) ON DELETE CASCADE,
    FOREIGN KEY (srs_card_id) REFERENCES srs_cards(id) ON DELETE SET NULL
);
''')
cur.execute('CREATE INDEX IF NOT EXISTS idx_wel_user_taxonomy ON writing_error_logs(user_id, taxonomy_code);')
cur.execute('CREATE INDEX IF NOT EXISTS idx_wel_submission ON writing_error_logs(submission_id);')
cur.execute('CREATE INDEX IF NOT EXISTS idx_wel_srs_card ON writing_error_logs(srs_card_id);')

# 6. Verify foreign keys can be turned on and an insertion works without error
cur.execute('PRAGMA foreign_keys = ON;')
cur.execute('''
INSERT INTO writing_submissions (id, user_id, user_text, word_count, status)
VALUES ('test_sanity_sub', 'user_local', 'Hello world test', 3, 'SOCRATIC_PHASE_1')
''')
cur.execute('''
INSERT INTO writing_draft_revisions (id, submission_id, revision_number, draft_text)
VALUES ('test_sanity_rev', 'test_sanity_sub', 1, 'Hello world test')
''')
cur.execute("DELETE FROM writing_submissions WHERE id = 'test_sanity_sub'")

conn.commit()
conn.close()
print("SUCCESS: Sanitization completed! All writing tables recreated from scratch with zero orphaned foreign keys.")
