import React, { createContext, useEffect, useState, useMemo, useCallback } from 'react';
import { Kysely } from 'kysely';
import { DatabaseSchema } from '@/core/types/database';
import {
  createTestDatabase,
  createTauriDatabase,
  initializeDatabase,
  isTauri,
} from '@/infrastructure/db/database';
import { VocabRepository } from '@/infrastructure/db/repositories/VocabRepository';
import { CardRepository } from '@/infrastructure/db/repositories/CardRepository';

export interface DatabaseContextValue {
  db: Kysely<DatabaseSchema> | null;
  vocabRepo: VocabRepository | null;
  cardRepo: CardRepository | null;
  isReady: boolean;
  error: Error | null;
  retry: () => void;
}

export const DatabaseContext = createContext<DatabaseContextValue | null>(null);

export function DatabaseProvider({ children }: { children: React.ReactNode }) {
  const [db, setDb] = useState<Kysely<DatabaseSchema> | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [retryTrigger, setRetryTrigger] = useState(0);

  const retry = useCallback(() => {
    setError(null);
    setIsReady(false);
    setRetryTrigger((prev) => prev + 1);
  }, []);

  useEffect(() => {
    let isCancelled = false;

    async function initDb() {
      try {
        setError(null);
        let database: Kysely<DatabaseSchema>;

        if (isTauri()) {
          try {
            database = createTauriDatabase('sqlite:ela.db');
            await initializeDatabase(database);
          } catch (tauriErr) {
            console.warn('Tauri native SQLite unavailable, falling back to WASM SQLite:', tauriErr);
            database = await createTestDatabase();
          }
        } else {
          // In-browser / Vite environment with WASM SQLite
          database = await createTestDatabase();
        }

        // Ensure default users exist for foreign key integrity in all environments
        await database
          .insertInto('users')
          .values([
            {
              id: 'user_local',
              username: 'local_student',
              target_accent: 'GENERAL_AMERICAN',
              current_cefr_target: 'B1',
              default_ai_model: 'gemini-3.8-flash',
              api_key_rotation_mode: 'FAILOVER_ON_QUOTA',
            },
            {
              id: 'default_user',
              username: 'default_student',
              target_accent: 'GENERAL_AMERICAN',
              current_cefr_target: 'B1',
              default_ai_model: 'gemini-3.8-flash',
              api_key_rotation_mode: 'FAILOVER_ON_QUOTA',
            },
          ])
          .onConflict((oc) => oc.column('id').doNothing())
          .execute();

        if (!isCancelled) {
          setDb(database);
          setIsReady(true);
        }
      } catch (err) {
        console.error('Failed to initialize database:', err);
        if (!isCancelled) {
          setError(err instanceof Error ? err : new Error(String(err)));
        }
      }
    }

    initDb();

    return () => {
      isCancelled = true;
    };
  }, [retryTrigger]);

  const vocabRepo = useMemo(() => {
    return db ? new VocabRepository(db) : null;
  }, [db]);

  const cardRepo = useMemo(() => {
    return db ? new CardRepository(db) : null;
  }, [db]);

  const value = useMemo<DatabaseContextValue>(
    () => ({
      db,
      vocabRepo,
      cardRepo,
      isReady,
      error,
      retry,
    }),
    [db, vocabRepo, cardRepo, isReady, error, retry],
  );

  return <DatabaseContext.Provider value={value}>{children}</DatabaseContext.Provider>;
}
