import { Kysely } from 'kysely';
import { DatabaseSchema } from '../../core/types/database';
import { SQLITE_DDL_SCHEMA, CLEANUP_OBSOLETE_TABLES_SQL } from './schema';
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

// Track active initialization promises per Kysely instance to prevent concurrent DDL executions
const activeInitPromises = new WeakMap<Kysely<DatabaseSchema>, Promise<void>>();
let globalTauriInitPromise: Promise<void> | null = null;
let tauriDbSingleton: Kysely<DatabaseSchema> | null = null;

/**
 * Executes the DDL statements to create all 10 active tables and indexes, and runs migrations.
 * Guaranteed to be idempotent and safe against concurrent executions.
 */
export async function initializeDatabase(db: Kysely<DatabaseSchema>): Promise<void> {
  const existing = activeInitPromises.get(db);
  if (existing) {
    return existing;
  }

  const initPromise = (async () => {
    // 1. Drop obsolete tables if any exist
    await executeSqlBatch(db, CLEANUP_OBSOLETE_TABLES_SQL);

    // 2. Execute base DDL schema with comment stripping and clean sequential execution
    await executeSqlBatch(db, SQLITE_DDL_SCHEMA);

    // 3. Ensure schema maintenance and pragma user_version
    await runMigrations(db);
  })();

  activeInitPromises.set(db, initPromise);

  try {
    await initPromise;
  } catch (err) {
    activeInitPromises.delete(db);
    throw err;
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
 * Creates or retrieves the singleton Kysely instance connected to the native Tauri SQLite plugin.
 */
export function createTauriDatabase(dbPath = 'sqlite:ela.db'): Kysely<DatabaseSchema> {
  if (!tauriDbSingleton) {
    const dialect = new TauriSqliteDialect({
      database: () => Database.load(dbPath),
    });
    tauriDbSingleton = new Kysely<DatabaseSchema>({ dialect });
  }
  return tauriDbSingleton;
}

/**
 * Helper to ensure Tauri database is initialized only once across mounts.
 */
export async function initializeTauriDatabase(db: Kysely<DatabaseSchema>): Promise<void> {
  if (globalTauriInitPromise) {
    return globalTauriInitPromise;
  }

  globalTauriInitPromise = initializeDatabase(db);
  try {
    await globalTauriInitPromise;
  } catch (err) {
    globalTauriInitPromise = null;
    throw err;
  }
}
