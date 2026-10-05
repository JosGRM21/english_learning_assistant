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

  // Ensure PRAGMA user_version is updated
  await sql.raw(`PRAGMA user_version = 1`).execute(db);
}
