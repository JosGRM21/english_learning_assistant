import { Kysely, sql } from 'kysely';
import { DatabaseSchema } from '../../core/types/database';
import { SQLITE_DDL_SCHEMA, CLEANUP_OBSOLETE_TABLES_SQL } from './schema';
import { SqlJsDialect } from './dialects/SqlJsDialect';
import { TauriSqliteDialect } from 'kysely-dialect-tauri';
import Database from '@tauri-apps/plugin-sql';
import { runMigrations, executeSqlBatch, migrateExistingTableColumns } from './migrations';

export { isTauri } from '@/shared/utils/platform';

// Track active initialization promises per Kysely instance to prevent concurrent DDL executions
const activeInitPromises = new WeakMap<Kysely<DatabaseSchema>, Promise<void>>();
let globalTauriInitPromise: Promise<void> | null = null;
let tauriDbSingleton: Kysely<DatabaseSchema> | null = null;

/**
 * Applies essential SQLite performance PRAGMAs:
 * - WAL journal mode (concurrent reads/writes, eliminates exclusive locking)
 * - NORMAL synchronous (safe in WAL, removes unnecessary fsync latency)
 * - Cache size of 64MB (-64000)
 * - In-memory temporary store
 * - Memory-mapped I/O (256MB)
 * - Foreign keys enabled per-connection
 * - Busy timeout of 5000ms
 */
export async function applyPerformancePragmas(db: Kysely<DatabaseSchema>): Promise<void> {
  const pragmas = [
    'PRAGMA foreign_keys = ON',
    'PRAGMA journal_mode = WAL',
    'PRAGMA synchronous = NORMAL',
    'PRAGMA cache_size = -64000',
    'PRAGMA temp_store = MEMORY',
    'PRAGMA mmap_size = 268435456',
    'PRAGMA busy_timeout = 5000',
  ];

  for (const pragma of pragmas) {
    try {
      await sql.raw(pragma).execute(db);
    } catch {
      // Ignored for environments like WASM/SqlJs where some pragmas are unsupported
    }
  }
}

/**
 * Executes the DDL statements to create all 10 active tables and indexes, and runs migrations.
 * Guaranteed to be idempotent and safe against concurrent executions.
 */
export async function initializeDatabase(db: Kysely<DatabaseSchema>, seed = true): Promise<void> {
  const existing = activeInitPromises.get(db);
  if (existing) {
    return existing;
  }

  const initPromise = (async () => {
    // 0. Apply performance PRAGMAs on every connection
    await applyPerformancePragmas(db);

    const versionRes = await sql<{ user_version: number }>`PRAGMA user_version`.execute(db);
    const userVersion = Number(versionRes.rows[0]?.user_version ?? 0);

    if (userVersion < 8) {
      // 1. Drop obsolete tables if any exist
      await executeSqlBatch(db, CLEANUP_OBSOLETE_TABLES_SQL);

      // 2. Pre-migrate columns on any existing tables
      await migrateExistingTableColumns(db);

      // 3. Execute base DDL schema with comment stripping and clean sequential execution
      await executeSqlBatch(db, SQLITE_DDL_SCHEMA);

      // 4. Ensure schema maintenance and pragma user_version
      await runMigrations(db);
    } else {
      // Defensive fallback: guarantee that newly declared columns exist even if user_version was already bumped
      await migrateExistingTableColumns(db);
    }

    // 5. Seed master core vocabulary corpus if DB is clean
    if (seed) {
      const { seedCoreCorpus } = await import('./seeder');
      await seedCoreCorpus(db);
    }
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
export async function createTestDatabase(seed = true): Promise<Kysely<DatabaseSchema>> {
  const dialect = new SqlJsDialect();
  const db = new Kysely<DatabaseSchema>({ dialect });
  await initializeDatabase(db, seed);
  return db;
}

/**
 * Creates or retrieves the singleton Kysely instance connected to the native Tauri SQLite plugin.
 */
export function createTauriDatabase(dbPath = 'sqlite:ela.db'): Kysely<DatabaseSchema> {
  if (!tauriDbSingleton) {
    const dialect = new TauriSqliteDialect({
      database: () => Database.load(dbPath),
      isQuery: (sql) => /^\s*(SELECT|PRAGMA)/i.test(sql),
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
