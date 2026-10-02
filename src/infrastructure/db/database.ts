import { Kysely } from 'kysely';
import { DatabaseSchema } from '../../core/types/database';
import { SQLITE_DDL_SCHEMA } from './schema';
import { SqlJsDialect } from './dialects/SqlJsDialect';
import { TauriSqliteDialect } from 'kysely-dialect-tauri';
import Database from '@tauri-apps/plugin-sql';
import { runMigrations, executeSqlBatch } from './migrations';

/**
 * Checks whether the app is executing inside a Tauri desktop webview runtime.
 */
export function isTauri(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean(
    (window as unknown as { isTauri?: boolean }).isTauri ||
      '__TAURI_INTERNALS__' in window ||
      '__TAURI__' in window,
  );
}

/**
 * Executes the DDL statements to create all 15 tables and indexes, and runs migrations.
 */
export async function initializeDatabase(db: Kysely<DatabaseSchema>): Promise<void> {
  // Execute base DDL schema with comment stripping and clean sequential execution
  await executeSqlBatch(db, SQLITE_DDL_SCHEMA);

  // Run schema migrations for existing persistent databases
  await runMigrations(db);
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
