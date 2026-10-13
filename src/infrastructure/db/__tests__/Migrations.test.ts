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

  it('cleans up legacy temporary tables and sets user_version to 4', async () => {
    // 1. Create a dummy legacy table that should be cleaned up
    await sql.raw(`CREATE TABLE users_new (id TEXT PRIMARY KEY)`).execute(db);

    // Initial version is 0
    const v0 = await sql<{ user_version: number }>`PRAGMA user_version`.execute(db);
    expect(v0.rows[0]?.user_version).toBe(0);

    // Run migrations
    await runMigrations(db);

    // Version should now be 4
    const v4 = await sql<{ user_version: number }>`PRAGMA user_version`.execute(db);
    expect(v4.rows[0]?.user_version).toBe(4);

    // Legacy table should be dropped
    const checkLegacy = await sql<{ name: string }>`SELECT name FROM sqlite_master WHERE type='table' AND name='users_new'`.execute(db);
    expect(checkLegacy.rows).toHaveLength(0);

    // Notification tables should exist
    const checkNotifSettings = await sql<{ name: string }>`SELECT name FROM sqlite_master WHERE type='table' AND name='notification_settings'`.execute(db);
    expect(checkNotifSettings.rows).toHaveLength(1);

    // App settings table should exist
    const checkAppSettings = await sql<{ name: string }>`SELECT name FROM sqlite_master WHERE type='table' AND name='app_settings'`.execute(db);
    expect(checkAppSettings.rows).toHaveLength(1);

    // Running migrations again is idempotent
    await runMigrations(db);
    const v4Idempotent = await sql<{ user_version: number }>`PRAGMA user_version`.execute(db);
    expect(v4Idempotent.rows[0]?.user_version).toBe(4);
  });

  it('migrates pre-existing vocab_items table without is_core column cleanly without throwing error', async () => {
    // Simulate legacy vocab_items schema from before is_core was introduced
    await sql.raw(`
      CREATE TABLE vocab_items (
        id TEXT PRIMARY KEY,
        word TEXT NOT NULL,
        grammatical_dimension TEXT NOT NULL,
        part_of_speech TEXT NOT NULL,
        definition_en TEXT NOT NULL,
        translation_es TEXT NOT NULL,
        ipa_general_american TEXT NOT NULL,
        cefr_level TEXT NOT NULL
      )
    `).execute(db);

    // Verify is_core does not exist yet
    const colsBefore = await sql<{ name: string }>`PRAGMA table_info(vocab_items)`.execute(db);
    const colNamesBefore = colsBefore.rows.map((r: any) => r.name.toLowerCase());
    expect(colNamesBefore).not.toContain('is_core');

    // Run migrations
    await runMigrations(db);

    // Verify is_core and other new columns were added
    const colsAfter = await sql<{ name: string }>`PRAGMA table_info(vocab_items)`.execute(db);
    const colNamesAfter = colsAfter.rows.map((r: any) => r.name.toLowerCase());
    expect(colNamesAfter).toContain('is_core');
    expect(colNamesAfter).toContain('mastery_status');
    expect(colNamesAfter).toContain('frequency_band');
  });

  it('safely sanitizes writing_submissions with legacy foreign key to writing_prompts', async () => {
    // 1. Simulate legacy schema where writing_prompts exists and writing_submissions references it
    await sql.raw(`
      CREATE TABLE writing_prompts (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL
      );

      CREATE TABLE writing_submissions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL DEFAULT 'user_local',
        prompt_id TEXT,
        submission_mode TEXT NOT NULL DEFAULT 'FREE',
        user_text TEXT NOT NULL,
        word_count INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT 'DRAFT',
        submitted_at TEXT NOT NULL DEFAULT (DATETIME('now')),
        FOREIGN KEY (prompt_id) REFERENCES writing_prompts(id) ON DELETE SET NULL
      );
    `).execute(db);

    // Insert legacy submission
    await sql.raw(`
      INSERT INTO writing_submissions (id, user_text, word_count)
      VALUES ('sub_legacy', 'Legacy text', 2)
    `).execute(db);

    // Drop writing_prompts (simulating previous incomplete drop or existing state)
    // Note: with foreign_keys ON, dropping writing_prompts leaves a broken reference
    await sql.raw(`DROP TABLE IF EXISTS writing_prompts`).execute(db);

    // 2. Run migrations
    await runMigrations(db);

    // 3. Verify writing_submissions was recreated without the REFERENCES writing_prompts
    const tableInfo = await sql<{ sql: string }>`
      SELECT sql FROM sqlite_master WHERE type='table' AND name='writing_submissions'
    `.execute(db);

    expect(tableInfo.rows[0].sql).not.toContain('REFERENCES writing_prompts');
    expect(tableInfo.rows[0].sql).not.toContain('prompt_id');

    // 4. Verify existing data was preserved
    const rows = await sql<{ id: string; user_text: string }>`
      SELECT id, user_text FROM writing_submissions WHERE id = 'sub_legacy'
    `.execute(db);
    expect(rows.rows).toHaveLength(1);
    expect(rows.rows[0].user_text).toBe('Legacy text');

    // 5. Verify insertion now works even with PRAGMA foreign_keys = ON
    await sql.raw('PRAGMA foreign_keys = ON;').execute(db);
    await sql.raw(`
      INSERT INTO writing_submissions (id, user_text, word_count, status)
      VALUES ('sub_new', 'New text after migration', 4, 'SOCRATIC_PHASE_1')
    `).execute(db);

    const checkNew = await sql<{ id: string }>`
      SELECT id FROM writing_submissions WHERE id = 'sub_new'
    `.execute(db);
    expect(checkNew.rows).toHaveLength(1);
  });
});


