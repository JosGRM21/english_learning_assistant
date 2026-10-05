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

  it('cleans up legacy temporary tables and sets user_version to 2', async () => {
    // 1. Create a dummy legacy table that should be cleaned up
    await sql.raw(`CREATE TABLE users_new (id TEXT PRIMARY KEY)`).execute(db);

    // Initial version is 0
    const v0 = await sql<{ user_version: number }>`PRAGMA user_version`.execute(db);
    expect(v0.rows[0]?.user_version).toBe(0);

    // Run migrations
    await runMigrations(db);

    // Version should now be 2
    const v2 = await sql<{ user_version: number }>`PRAGMA user_version`.execute(db);
    expect(v2.rows[0]?.user_version).toBe(2);

    // Legacy table should be dropped
    const checkLegacy = await sql<{ name: string }>`SELECT name FROM sqlite_master WHERE type='table' AND name='users_new'`.execute(db);
    expect(checkLegacy.rows).toHaveLength(0);

    // Notification tables should exist
    const checkNotifSettings = await sql<{ name: string }>`SELECT name FROM sqlite_master WHERE type='table' AND name='notification_settings'`.execute(db);
    expect(checkNotifSettings.rows).toHaveLength(1);

    // Running migrations again is idempotent
    await runMigrations(db);
    const v2Idempotent = await sql<{ user_version: number }>`PRAGMA user_version`.execute(db);
    expect(v2Idempotent.rows[0]?.user_version).toBe(2);
  });
});

