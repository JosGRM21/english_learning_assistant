import {
  Dialect,
  Driver,
  DatabaseConnection,
  QueryResult,
  CompiledQuery,
  SqliteAdapter,
  SqliteIntrospector,
  SqliteQueryCompiler,
  Kysely,
} from 'kysely';
import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';

export class SqlJsDriver implements Driver {
  private db: SqlJsDatabase | null = null;
  private readonly initPromise: Promise<void>;

  constructor(existingDb?: SqlJsDatabase) {
    if (existingDb) {
      this.db = existingDb;
      this.initPromise = Promise.resolve();
    } else {
      this.initPromise = (async () => {
        const isNode = typeof process !== 'undefined' && Boolean(process.versions?.node);
        const SQL = await initSqlJs(
          !isNode
            ? {
                locateFile: (file: string) => {
                  if (file.endsWith('.wasm')) {
                    const base =
                      (typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL) || '/';
                    const cleanBase = base.endsWith('/') ? base : `${base}/`;
                    return `${cleanBase}${file}`;
                  }
                  return file;
                },
              }
            : undefined,
        );
        this.db = new SQL.Database();
        this.db.run('PRAGMA foreign_keys = ON;');
      })();
    }
  }

  async init(): Promise<void> {
    await this.initPromise;
  }

  async acquireConnection(): Promise<DatabaseConnection> {
    await this.initPromise;
    const db = this.db!;

    return {
      async executeQuery<R>(compiledQuery: CompiledQuery): Promise<QueryResult<R>> {
        const sql = compiledQuery.sql.trim();

        const cleanSingle = sql.replace(/;+\s*$/, '');
        const hasMultipleStatements = cleanSingle.includes(';');

        // Direct execution for multi-statement DDL scripts without parameters
        if (hasMultipleStatements && (!compiledQuery.parameters || compiledQuery.parameters.length === 0)) {
          db.run(sql);
          return {
            rows: [],
            numAffectedRows: BigInt(db.getRowsModified()),
          };
        }

        const stmt = db.prepare(cleanSingle);
        try {
          const params = (compiledQuery.parameters ?? []) as (string | number | null | Uint8Array)[];
          if (params.length > 0) {
            stmt.bind(params);
          }

          const rows: R[] = [];
          while (stmt.step()) {
            rows.push(stmt.getAsObject() as unknown as R);
          }

          return {
            rows,
            numAffectedRows: BigInt(db.getRowsModified()),
          };
        } finally {
          stmt.free();
        }
      },
      async *streamQuery() {
        throw new Error('Streaming not supported in SqlJsDriver');
      },
    };
  }

  async beginTransaction(connection: DatabaseConnection): Promise<void> {
    await connection.executeQuery(CompiledQuery.raw('BEGIN TRANSACTION'));
  }

  async commitTransaction(connection: DatabaseConnection): Promise<void> {
    await connection.executeQuery(CompiledQuery.raw('COMMIT'));
  }

  async rollbackTransaction(connection: DatabaseConnection): Promise<void> {
    await connection.executeQuery(CompiledQuery.raw('ROLLBACK'));
  }

  async releaseConnection(): Promise<void> {}

  async destroy(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  getRawDatabase(): SqlJsDatabase | null {
    return this.db;
  }
}

export class SqlJsDialect implements Dialect {
  private readonly driver: SqlJsDriver;

  constructor(driver?: SqlJsDriver) {
    this.driver = driver ?? new SqlJsDriver();
  }

  createDriver(): Driver {
    return this.driver;
  }

  createQueryCompiler(): SqliteQueryCompiler {
    return new SqliteQueryCompiler();
  }

  createAdapter(): SqliteAdapter {
    return new SqliteAdapter();
  }

  createIntrospector(db: Kysely<unknown>): SqliteIntrospector {
    return new SqliteIntrospector(db);
  }

  getDriver(): SqlJsDriver {
    return this.driver;
  }
}
