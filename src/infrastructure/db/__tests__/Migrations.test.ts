import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Kysely, sql } from 'kysely';
import { DatabaseSchema } from '../../../core/types/database';
import { SqlJsDialect } from '../dialects/SqlJsDialect';
import { executeSqlBatch, runMigrations } from '../migrations';

describe('Database Migrations Engine', () => {
  let db: Kysely<DatabaseSchema>;

  beforeEach(() => {
    const dialect = new SqlJsDialect();
    db = new Kysely<DatabaseSchema>({ dialect });
  });

  afterEach(async () => {
    await db.destroy();
  });

  it('executeSqlBatch strips comments and executes all statements sequentially', async () => {
    const batch = `
      -- Create test table
      CREATE TABLE test_batch (
        id TEXT PRIMARY KEY,
        val INTEGER NOT NULL
      );

      /* Multi-line
         comment here */
      INSERT INTO test_batch (id, val) VALUES ('row1', 10);
      INSERT INTO test_batch (id, val) VALUES ('row2', 20);
    `;

    await executeSqlBatch(db, batch);

    const rows = await sql<{ id: string; val: number }>`SELECT id, val FROM test_batch ORDER BY val ASC`.execute(db);
    expect(rows.rows).toHaveLength(2);
    expect(rows.rows[0].id).toBe('row1');
    expect(rows.rows[1].id).toBe('row2');
  });

  it('runs all migrations up to v3 on initial schema and correctly sets user_version to 3', async () => {
    // 1. Create bare v0 tables
    await executeSqlBatch(
      db,
      `
      CREATE TABLE users (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL,
        target_accent TEXT DEFAULT 'GENERAL_AMERICAN',
        current_cefr_target TEXT DEFAULT 'B1',
        default_ai_model TEXT DEFAULT 'gemini-3.5-flash',
        api_key_rotation_mode TEXT DEFAULT 'FAILOVER_ON_QUOTA',
        backlog_throttling_enabled INTEGER DEFAULT 1,
        max_daily_review_limit INTEGER DEFAULT 30,
        created_at TEXT DEFAULT (DATETIME('now'))
      );

      CREATE TABLE writing_submissions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        user_text TEXT NOT NULL,
        word_count INTEGER NOT NULL,
        status TEXT DEFAULT 'DRAFT',
        submitted_at TEXT DEFAULT (DATETIME('now'))
      );

      CREATE TABLE writing_evaluations (
        id TEXT PRIMARY KEY,
        submission_id TEXT NOT NULL UNIQUE,
        model_used TEXT DEFAULT 'gemini-3.5-flash',
        estimated_cefr TEXT NOT NULL,
        grammar_score REAL NOT NULL,
        vocabulary_score REAL NOT NULL,
        coherence_score REAL NOT NULL,
        overall_feedback_es TEXT NOT NULL,
        corrections_json TEXT NOT NULL,
        micro_challenge_json TEXT,
        evaluated_at TEXT DEFAULT (DATETIME('now'))
      );

      CREATE TABLE ai_api_keys (
        id TEXT PRIMARY KEY,
        provider TEXT NOT NULL
      );

      CREATE TABLE api_key_model_quotas (
        id TEXT PRIMARY KEY,
        api_key_id TEXT NOT NULL,
        model_id TEXT NOT NULL,
        requests_today INTEGER DEFAULT 0,
        daily_limit INTEGER DEFAULT 20,
        rpm_limit INTEGER DEFAULT 5,
        last_request_timestamp TEXT,
        rpm_cooldown_until TEXT,
        rpd_status TEXT DEFAULT 'AVAILABLE',
        last_pt_reset_date TEXT NOT NULL,
        created_at TEXT DEFAULT (DATETIME('now'))
      );

      CREATE TABLE srs_cards (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        target_type TEXT NOT NULL,
        target_id TEXT NOT NULL
      );
      `,
    );

    // Initial version should be 0
    const v0 = await sql<{ user_version: number }>`PRAGMA user_version`.execute(db);
    expect(v0.rows[0]?.user_version).toBe(0);

    // Run migrations
    await runMigrations(db);

    // Version should now be 3
    const v3 = await sql<{ user_version: number }>`PRAGMA user_version`.execute(db);
    expect(v3.rows[0]?.user_version).toBe(3);

    // Verify successful_repairs_json column exists
    const cols = await sql<{ name: string }>`PRAGMA table_info(writing_evaluations)`.execute(db);
    const hasSuccessfulRepairs = cols.rows.some((c) => c.name === 'successful_repairs_json');
    expect(hasSuccessfulRepairs).toBe(true);

    // Running migrations again must be a no-op and idempotent
    await runMigrations(db);
    const v3Idempotent = await sql<{ user_version: number }>`PRAGMA user_version`.execute(db);
    expect(v3Idempotent.rows[0]?.user_version).toBe(3);
  });
});
