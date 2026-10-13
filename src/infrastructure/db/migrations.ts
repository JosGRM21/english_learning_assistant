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
    try {
      await sql.raw(statement).execute(db);
    } catch (err: any) {
      if (/^\s*CREATE\s+(UNIQUE\s+)?INDEX/i.test(statement)) {
        console.warn(`[executeSqlBatch] Non-fatal warning on index statement: ${statement}`, err?.message || err);
      } else {
        throw err;
      }
    }
  }
}

/**
 * Detects existing tables and alters them to add any newly introduced columns.
 * This MUST run before executing DDL schemas that create indexes on these columns
 * to avoid "no such column: <col>" errors on pre-existing user databases.
 */
export async function migrateExistingTableColumns(db: Kysely<DatabaseSchema>): Promise<void> {
  // 1. notification_settings
  try {
    const notifCheck = await sql<{ name: string }>`SELECT name FROM sqlite_master WHERE type='table' AND name='notification_settings'`.execute(db);
    if (notifCheck.rows.length > 0) {
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
    }
  } catch (err) {
    console.warn('[migrateExistingTableColumns] notification_settings column check error:', err);
  }

  // 2. vocab_items
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
        ['frequency_band', 'TEXT'],
        ['is_core', 'INTEGER NOT NULL DEFAULT 1'],
        ['mastery_status', "TEXT NOT NULL DEFAULT 'INACTIVE'"],
        ['collocations_json', 'TEXT'],
        ['is_separable', 'INTEGER'],
        ['phonetic_ed_ending', 'TEXT'],
        ['subcategory', 'TEXT'],
        ['ipa_received_pronunciation', 'TEXT'],
        ['ipa_weak_form', 'TEXT'],
        ['is_false_friend', 'INTEGER NOT NULL DEFAULT 0'],
        ['false_friend_note', 'TEXT'],
        ['morphological_family_json', 'TEXT'],
        ['created_at', "TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))"],
      ];

      for (const [col, type] of colsToAdd) {
        if (!existingCols.has(col.split(' ')[0].toLowerCase())) {
          try {
            await sql.raw(`ALTER TABLE vocab_items ADD COLUMN ${col} ${type}`).execute(db);
          } catch (colErr: any) {
            if (!colErr?.message?.includes('duplicate column name')) {
              console.warn(`[migrateExistingTableColumns] Could not add column ${col}:`, colErr);
            }
          }
        }
      }
    }
  } catch (err) {
    console.warn('[migrateExistingTableColumns] vocab_items column alteration error:', err);
  }

  // 3. srs_cards
  try {
    const srsCheck = await sql<{ name: string }>`SELECT name FROM sqlite_master WHERE type='table' AND name='srs_cards'`.execute(db);
    if (srsCheck.rows.length > 0) {
      const srsInfo = await sql<{ name: string }>`PRAGMA table_info(srs_cards)`.execute(db);
      const existingCols = new Set(srsInfo.rows.map((r: any) => (r.name || r.NAME || '').toLowerCase()));
      const srsColsToAdd = [
        ['srs_profile', "TEXT NOT NULL DEFAULT 'VOCAB_AGILE'"],
        ['is_leech', 'INTEGER NOT NULL DEFAULT 0'],
        ['consecutive_lapses', 'INTEGER NOT NULL DEFAULT 0'],
        ['is_proceduralized', 'INTEGER NOT NULL DEFAULT 0'],
        ['consecutive_fast_retrievals', 'INTEGER NOT NULL DEFAULT 0'],
        ['last_reaction_time_ms', 'INTEGER'],
      ];
      for (const [col, type] of srsColsToAdd) {
        if (!existingCols.has(col.split(' ')[0].toLowerCase())) {
          try {
            await sql.raw(`ALTER TABLE srs_cards ADD COLUMN ${col} ${type}`).execute(db);
          } catch (colErr: any) {
            if (!colErr?.message?.includes('duplicate column name')) {
              console.warn(`[migrateExistingTableColumns] Could not add column ${col} to srs_cards:`, colErr);
            }
          }
        }
      }
    }
  } catch (err) {
    console.warn('[migrateExistingTableColumns] srs_cards column alteration error:', err);
  }

  // 4. phraseological_units
  try {
    const phraseCheck = await sql<{ name: string }>`SELECT name FROM sqlite_master WHERE type='table' AND name='phraseological_units'`.execute(db);
    if (phraseCheck.rows.length > 0) {
      const phraseInfo = await sql<{ name: string }>`PRAGMA table_info(phraseological_units)`.execute(db);
      const existingCols = new Set(phraseInfo.rows.map((r: any) => (r.name || r.NAME || '').toLowerCase()));
      if (!existingCols.has('pronoun_must_split')) {
        try {
          await sql.raw(`ALTER TABLE phraseological_units ADD COLUMN pronoun_must_split INTEGER NOT NULL DEFAULT 0`).execute(db);
        } catch {
          // Ignore
        }
      }
    }
  } catch (err) {
    console.warn('[migrateExistingTableColumns] phraseological_units check error:', err);
  }

  // 5. writing_evaluations
  try {
    const evalCheck = await sql<{ name: string }>`SELECT name FROM sqlite_master WHERE type='table' AND name='writing_evaluations'`.execute(db);
    if (evalCheck.rows.length > 0) {
      const evalInfo = await sql<{ name: string }>`PRAGMA table_info(writing_evaluations)`.execute(db);
      const existingCols = new Set(evalInfo.rows.map((r: any) => (r.name || r.NAME || '').toLowerCase()));
      const evalColsToAdd = [
        ['clean_structural_version', "TEXT NOT NULL DEFAULT ''"],
        ['native_recast_version', "TEXT NOT NULL DEFAULT ''"],
        ['noticing_the_gap_json', "TEXT NOT NULL DEFAULT '[]'"],
        ['accuracy_score', 'REAL NOT NULL DEFAULT 0.0'],
        ['range_precision_score', 'REAL NOT NULL DEFAULT 0.0'],
        ['cohesion_flow_score', 'REAL NOT NULL DEFAULT 0.0'],
        ['pragmatics_complexity_score', 'REAL NOT NULL DEFAULT 0.0'],
        ['qualitative_recommendations_es', "TEXT NOT NULL DEFAULT ''"],
      ];
      for (const [col, type] of evalColsToAdd) {
        if (!existingCols.has(col.split(' ')[0].toLowerCase())) {
          try {
            await sql.raw(`ALTER TABLE writing_evaluations ADD COLUMN ${col} ${type}`).execute(db);
          } catch (colErr: any) {
            if (!colErr?.message?.includes('duplicate column name')) {
              console.warn(`[migrateExistingTableColumns] Could not add column ${col} to writing_evaluations:`, colErr);
            }
          }
        }
      }
    }
  } catch (err) {
    console.warn('[migrateExistingTableColumns] writing_evaluations column alteration error:', err);
  }

  // 6. writing_error_logs
  try {
    const errCheck = await sql<{ name: string }>`SELECT name FROM sqlite_master WHERE type='table' AND name='writing_error_logs'`.execute(db);
    if (errCheck.rows.length > 0) {
      const errorLogInfo = await sql<{ name: string }>`PRAGMA table_info(writing_error_logs)`.execute(db);
      const existingCols = new Set(errorLogInfo.rows.map((r: any) => (r.name || r.NAME || '').toLowerCase()));
      const errColsToAdd = [
        ['original_sentence', "TEXT NOT NULL DEFAULT ''"],
        ['expanded_context', "TEXT NOT NULL DEFAULT ''"],
        ['drill_format', "TEXT NOT NULL DEFAULT 'CONTEXTUAL_CLOZE'"],
        ['drill_data_json', "TEXT NOT NULL DEFAULT '{}'"],
        ['srs_card_id', 'TEXT'],
        ['mastery_status', "TEXT NOT NULL DEFAULT 'LEARNING'"],
        ['is_fossilized_alert', 'INTEGER NOT NULL DEFAULT 0'],
        ['times_recidivist', 'INTEGER NOT NULL DEFAULT 0'],
        ['is_resolved', 'INTEGER NOT NULL DEFAULT 0'],
      ];
      for (const [col, type] of errColsToAdd) {
        if (!existingCols.has(col.split(' ')[0].toLowerCase())) {
          try {
            await sql.raw(`ALTER TABLE writing_error_logs ADD COLUMN ${col} ${type}`).execute(db);
          } catch (colErr: any) {
            if (!colErr?.message?.includes('duplicate column name')) {
              console.warn(`[migrateExistingTableColumns] Could not add column ${col} to writing_error_logs:`, colErr);
            }
          }
        }
      }
    }
  } catch (err) {
    console.warn('[migrateExistingTableColumns] writing_error_logs column check error:', err);
  }

  // 7. Sanitize writing_submissions to remove obsolete FOREIGN KEY (prompt_id) REFERENCES writing_prompts(id)
  try {
    const subCheck = await sql<{ name: string; sql?: string }>`
      SELECT name, sql FROM sqlite_master WHERE type='table' AND name='writing_submissions'
    `.execute(db);

    if (subCheck.rows.length > 0) {
      const tableDdl = subCheck.rows[0].sql || '';
      // If table DDL still contains a reference to writing_prompts or obsolete prompt_id column, rebuild table safely
      if (/REFERENCES\s+writing_prompts/i.test(tableDdl) || /\bprompt_id\b/i.test(tableDdl)) {
        await executeSqlBatch(
          db,
          `
          PRAGMA foreign_keys = OFF;

          CREATE TABLE IF NOT EXISTS writing_submissions_new (
              id TEXT PRIMARY KEY,
              user_id TEXT NOT NULL DEFAULT 'user_local',
              submission_mode TEXT NOT NULL DEFAULT 'FREE' CHECK(submission_mode IN ('FREE', 'GUIDED', 'MICRO_WRITING', 'READING_TO_WRITE')),
              user_text TEXT NOT NULL,
              word_count INTEGER NOT NULL,
              status TEXT NOT NULL DEFAULT 'DRAFT' CHECK(status IN ('DRAFT', 'SOCRATIC_PHASE_1', 'SOCRATIC_PHASE_2', 'EVALUATED', 'ERROR')),
              submitted_at TEXT NOT NULL DEFAULT (DATETIME('now'))
          );

          INSERT OR IGNORE INTO writing_submissions_new (
              id, user_id, submission_mode, user_text, word_count, status, submitted_at
          )
          SELECT
              id,
              COALESCE(user_id, 'user_local'),
              COALESCE(submission_mode, 'FREE'),
              user_text,
              word_count,
              COALESCE(status, 'DRAFT'),
              COALESCE(submitted_at, DATETIME('now'))
          FROM writing_submissions;

          DROP TABLE writing_submissions;
          ALTER TABLE writing_submissions_new RENAME TO writing_submissions;
          CREATE INDEX IF NOT EXISTS idx_sub_date ON writing_submissions(submitted_at);

          DROP TABLE IF EXISTS writing_prompts;

          PRAGMA foreign_keys = ON;
          `,
        );
      } else {
        // Table does not reference writing_prompts, safe to drop writing_prompts if exists
        try {
          await sql.raw(`DROP TABLE IF EXISTS writing_prompts`).execute(db);
        } catch {
          // Non-fatal
        }
      }
    } else {
      // writing_submissions does not exist yet; safe to drop writing_prompts if exists
      try {
        await sql.raw(`DROP TABLE IF EXISTS writing_prompts`).execute(db);
      } catch {
        // Non-fatal
      }
    }
  } catch (err) {
    console.warn('[migrateExistingTableColumns] writing_submissions foreign key migration error:', err);
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

  // Migrate any existing table columns
  await migrateExistingTableColumns(db);

  // Ensure app_settings & writing_error_logs table exist with updated schema
  await executeSqlBatch(
    db,
    `
    CREATE TABLE IF NOT EXISTS app_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TEXT NOT NULL DEFAULT (DATETIME('now'))
    );

    CREATE TABLE IF NOT EXISTS writing_error_logs (
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

    CREATE INDEX IF NOT EXISTS idx_wel_user_taxonomy ON writing_error_logs(user_id, taxonomy_code);
    CREATE INDEX IF NOT EXISTS idx_wel_submission ON writing_error_logs(submission_id);
    CREATE INDEX IF NOT EXISTS idx_wel_srs_card ON writing_error_logs(srs_card_id);
    `,
  );

  // Ensure writing_error_logs columns exist if table was already created
  try {
    const errorLogInfo = await sql<{ name: string }>`PRAGMA table_info(writing_error_logs)`.execute(db);
    const existingCols = new Set(errorLogInfo.rows.map((r: any) => (r.name || r.NAME || '').toLowerCase()));
    const errColsToAdd = [
      ['original_sentence', "TEXT NOT NULL DEFAULT ''"],
      ['expanded_context', "TEXT NOT NULL DEFAULT ''"],
      ['drill_format', "TEXT NOT NULL DEFAULT 'CONTEXTUAL_CLOZE'"],
      ['drill_data_json', "TEXT NOT NULL DEFAULT '{}'"],
      ['srs_card_id', 'TEXT'],
      ['mastery_status', "TEXT NOT NULL DEFAULT 'LEARNING'"],
      ['is_fossilized_alert', 'INTEGER NOT NULL DEFAULT 0'],
      ['times_recidivist', 'INTEGER NOT NULL DEFAULT 0'],
    ];
    for (const [col, type] of errColsToAdd) {
      if (!existingCols.has(col.split(' ')[0].toLowerCase())) {
        try {
          await sql.raw(`ALTER TABLE writing_error_logs ADD COLUMN ${col} ${type}`).execute(db);
        } catch (colErr: any) {
          if (!colErr?.message?.includes('duplicate column name')) {
            console.warn(`[runMigrations] Could not add column ${col} to writing_error_logs:`, colErr);
          }
        }
      }
    }
  } catch (err) {
    console.warn('[runMigrations] writing_error_logs column check error:', err);
  }

  // Ensure PRAGMA user_version is updated
  await sql.raw(`PRAGMA user_version = 4`).execute(db);
}

