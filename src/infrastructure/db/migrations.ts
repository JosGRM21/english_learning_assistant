import { Kysely, sql } from 'kysely';
import { DatabaseSchema } from '../../core/types/database';

/**
 * Migration 1:
 * Updates tables with outdated CHECK constraints that restricted AI models to:
 * ('gemini-3.5-flash', 'gemini-3.6-flash', 'gemini-3.7-flash', 'gemini-3.8-flash')
 * by changing 'gemini-3.5-flash' to 'gemini-3.5-flash-lite'.
 *
 * Affects:
 * - writing_evaluations
 * - users
 * - api_key_model_quotas
 */
export async function runMigrations(db: Kysely<DatabaseSchema>): Promise<void> {
  // Check current pragma user_version
  const versionResult = await sql<{ user_version: number }>`PRAGMA user_version`.execute(db);
  const currentVersion = versionResult.rows[0]?.user_version ?? 0;

  if (currentVersion < 1) {
    await migrateToV1(db);
  }
}

async function migrateToV1(db: Kysely<DatabaseSchema>): Promise<void> {
  // SQLite table re-creation pattern to update CHECK constraints without losing data
  await sql.raw(`
    PRAGMA foreign_keys = OFF;

    -- 1. writing_evaluations
    CREATE TABLE IF NOT EXISTS writing_evaluations_new (
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
      evaluated_at TEXT NOT NULL DEFAULT (DATETIME('now')),
      FOREIGN KEY (submission_id) REFERENCES writing_submissions(id) ON DELETE CASCADE
    );

    INSERT OR IGNORE INTO writing_evaluations_new (
      id, submission_id, model_used, estimated_cefr, grammar_score,
      vocabulary_score, coherence_score, overall_feedback_es,
      corrections_json, micro_challenge_json, evaluated_at
    )
    SELECT
      id, submission_id,
      CASE WHEN model_used = 'gemini-3.5-flash' THEN 'gemini-3.5-flash-lite' ELSE model_used END,
      estimated_cefr, grammar_score, vocabulary_score, coherence_score,
      overall_feedback_es, corrections_json, micro_challenge_json, evaluated_at
    FROM writing_evaluations;

    DROP TABLE IF EXISTS writing_evaluations;
    ALTER TABLE writing_evaluations_new RENAME TO writing_evaluations;

    -- 2. users
    CREATE TABLE IF NOT EXISTS users_new (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      target_accent TEXT NOT NULL DEFAULT 'GENERAL_AMERICAN' CHECK(target_accent IN ('GENERAL_AMERICAN', 'RECEIVED_PRONUNCIATION')),
      current_cefr_target TEXT NOT NULL DEFAULT 'B1' CHECK(current_cefr_target IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
      default_ai_model TEXT NOT NULL DEFAULT 'gemini-3.8-flash' CHECK(default_ai_model IN ('gemini-3.5-flash-lite', 'gemini-3.6-flash', 'gemini-3.7-flash', 'gemini-3.8-flash')),
      api_key_rotation_mode TEXT NOT NULL DEFAULT 'FAILOVER_ON_QUOTA' CHECK(api_key_rotation_mode IN ('FAILOVER_ON_QUOTA', 'MANUAL_PRIMARY', 'ROUND_ROBIN')),
      backlog_throttling_enabled INTEGER NOT NULL DEFAULT 1 CHECK(backlog_throttling_enabled IN (0, 1)),
      max_daily_review_limit INTEGER NOT NULL DEFAULT 30,
      created_at TEXT NOT NULL DEFAULT (DATETIME('now'))
    );

    INSERT OR IGNORE INTO users_new (
      id, username, target_accent, current_cefr_target, default_ai_model,
      api_key_rotation_mode, backlog_throttling_enabled, max_daily_review_limit, created_at
    )
    SELECT
      id, username, target_accent, current_cefr_target,
      CASE WHEN default_ai_model = 'gemini-3.5-flash' THEN 'gemini-3.5-flash-lite' ELSE default_ai_model END,
      api_key_rotation_mode, backlog_throttling_enabled, max_daily_review_limit, created_at
    FROM users;

    DROP TABLE IF EXISTS users;
    ALTER TABLE users_new RENAME TO users;

    -- 3. api_key_model_quotas
    CREATE TABLE IF NOT EXISTS api_key_model_quotas_new (
      id TEXT PRIMARY KEY,
      api_key_id TEXT NOT NULL,
      model_id TEXT NOT NULL CHECK(model_id IN ('gemini-3.5-flash-lite', 'gemini-3.6-flash', 'gemini-3.7-flash', 'gemini-3.8-flash')),
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

    INSERT OR IGNORE INTO api_key_model_quotas_new (
      id, api_key_id, model_id, requests_today, daily_limit, rpm_limit,
      last_request_timestamp, rpm_cooldown_until, rpd_status, last_pt_reset_date, created_at
    )
    SELECT
      id, api_key_id,
      CASE WHEN model_id = 'gemini-3.5-flash' THEN 'gemini-3.5-flash-lite' ELSE model_id END,
      requests_today, daily_limit, rpm_limit,
      last_request_timestamp, rpm_cooldown_until, rpd_status, last_pt_reset_date, created_at
    FROM api_key_model_quotas;

    DROP TABLE IF EXISTS api_key_model_quotas;
    ALTER TABLE api_key_model_quotas_new RENAME TO api_key_model_quotas;

    CREATE INDEX IF NOT EXISTS idx_quota_lookup ON api_key_model_quotas(api_key_id, model_id, rpd_status);

    PRAGMA user_version = 1;
    PRAGMA foreign_keys = ON;
  `).execute(db);
}
