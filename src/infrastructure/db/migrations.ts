import { Kysely, sql } from 'kysely';
import { DatabaseSchema } from '../../core/types/database';

/**
 * Executes a batch of SQL statements sequentially.
 * Strips comments and empty statements to guarantee compatibility
 * with native SQLite drivers that only execute the first statement per call.
 */
export async function executeSqlBatch(
  db: Kysely<DatabaseSchema>,
  sqlBatch: string,
): Promise<void> {
  const cleanSql = sqlBatch
    .replace(/\/\*[\s\S]*?\*\//g, '') // remove multi-line comments
    .replace(/--.*$/gm, '');          // remove single-line comments

  const statements = cleanSql
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (const statement of statements) {
    await sql.raw(statement).execute(db);
  }
}

/**
 * Runs pending schema maintenance and guarantees version tracking.
 */
export async function runMigrations(db: Kysely<DatabaseSchema>): Promise<void> {
  try {
    // Drop any legacy temporary tables from past aborted migrations
    await sql.raw(`DROP TABLE IF EXISTS users_new`).execute(db);
    await sql.raw(`DROP TABLE IF EXISTS writing_evaluations_new`).execute(db);
    await sql.raw(`DROP TABLE IF EXISTS api_key_model_quotas_new`).execute(db);
  } catch (err) {
    console.warn('[runMigrations] Cleanup error:', err);
  }

  // Ensure notification tables exist
  await executeSqlBatch(
    db,
    `
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
    `,
  );

  // Migrate any existing notification_settings table to add per-activity columns
  const activityCols = [
    "ALTER TABLE notification_settings ADD COLUMN srs_enabled INTEGER NOT NULL DEFAULT 1",
    "ALTER TABLE notification_settings ADD COLUMN srs_schedule_mode TEXT NOT NULL DEFAULT 'AUTO'",
    "ALTER TABLE notification_settings ADD COLUMN srs_manual_time TEXT NOT NULL DEFAULT '19:00'",
    "ALTER TABLE notification_settings ADD COLUMN srs_detected_time TEXT DEFAULT '19:00'",
    "ALTER TABLE notification_settings ADD COLUMN writing_enabled INTEGER NOT NULL DEFAULT 1",
    "ALTER TABLE notification_settings ADD COLUMN writing_schedule_mode TEXT NOT NULL DEFAULT 'AUTO'",
    "ALTER TABLE notification_settings ADD COLUMN writing_manual_time TEXT NOT NULL DEFAULT '21:00'",
    "ALTER TABLE notification_settings ADD COLUMN writing_detected_time TEXT DEFAULT '21:00'",
  ];
  for (const alter of activityCols) {
    try {
      await sql.raw(alter).execute(db);
    } catch {
      // Column already exists, safe to ignore
    }
  }

  // Ensure new columns in vocab_items exist if table exists
  try {
    const tableCheck = await sql<{ name: string }>`SELECT name FROM sqlite_master WHERE type='table' AND name='vocab_items'`.execute(db);
    if (tableCheck.rows.length > 0) {
      const tableInfo = await sql<{ name: string }>`PRAGMA table_info(vocab_items)`.execute(db);
      const existingCols = new Set(
        tableInfo.rows.map((r: any) => (r.name || r.NAME || '').toLowerCase())
      );

      const colsToAdd = [
        ['verb_tenses_json', 'TEXT'],
        ['structured_family_json', 'TEXT'],
        ['domain_category', 'TEXT'],
        ['alternate_senses_json', 'TEXT'],
      ];

      for (const [col, type] of colsToAdd) {
        if (!existingCols.has(col.toLowerCase())) {
          try {
            await sql.raw(`ALTER TABLE vocab_items ADD COLUMN ${col} ${type}`).execute(db);
          } catch (colErr: any) {
            if (!colErr?.message?.includes('duplicate column name')) {
              console.warn(`[runMigrations] Could not add column ${col}:`, colErr);
            }
          }
        }
      }
    }
  } catch (err) {
    console.warn('[runMigrations] vocab_items column alteration error:', err);
  }

  // Ensure app_settings table exists
  await executeSqlBatch(
    db,
    `
    CREATE TABLE IF NOT EXISTS app_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TEXT NOT NULL DEFAULT (DATETIME('now'))
    );
    `,
  );

  // Ensure PRAGMA user_version is updated
  await sql.raw(`PRAGMA user_version = 3`).execute(db);
}

