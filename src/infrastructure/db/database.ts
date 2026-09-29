import { Kysely, sql } from 'kysely';
import { DatabaseSchema } from '../../core/types/database';
import { SQLITE_DDL_SCHEMA } from './schema';
import { SqlJsDialect } from './dialects/SqlJsDialect';
import { TauriSqliteDialect } from 'kysely-dialect-tauri';
import Database from '@tauri-apps/plugin-sql';

/**
 * Executes the DDL statements to create all 15 tables and indexes.
 */
export async function initializeDatabase(db: Kysely<DatabaseSchema>): Promise<void> {
  // Split statements by semicolon, ignoring empty segments
  const statements = SQLITE_DDL_SCHEMA.split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (const statement of statements) {
    await sql.raw(statement).execute(db);
  }
}

/**
 * Creates an in-memory Kysely instance backed by WASM SQLite (for testing and browser fallback).
 */
export async function createTestDatabase(): Promise<Kysely<DatabaseSchema>> {
  const dialect = new SqlJsDialect();
  const db = new Kysely<DatabaseSchema>({ dialect });
  await initializeDatabase(db);
  return db;
}

/**
 * Creates a Kysely instance connected to the native Tauri SQLite plugin.
 */
export function createTauriDatabase(dbPath = 'sqlite:ela.db'): Kysely<DatabaseSchema> {
  const dialect = new TauriSqliteDialect({
    database: () => Database.load(dbPath),
  });

  return new Kysely<DatabaseSchema>({ dialect });
}
