import React, { createContext, useEffect, useState, useMemo, useCallback } from 'react';
import { Kysely } from 'kysely';
import { DatabaseSchema } from '@/core/types/database';
import {
  createTestDatabase,
  createTauriDatabase,
  initializeTauriDatabase,
  isTauri,
} from '@/infrastructure/db/database';
import { VocabRepository } from '@/infrastructure/db/repositories/VocabRepository';
import { CardRepository } from '@/infrastructure/db/repositories/CardRepository';
import { WritingRepository } from '@/infrastructure/db/repositories/WritingRepository';

export interface DatabaseContextValue {
  db: Kysely<DatabaseSchema> | null;
  vocabRepo: VocabRepository | null;
  cardRepo: CardRepository | null;
  writingRepo?: WritingRepository | null;
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
          database = createTauriDatabase('sqlite:ela.db');
          await initializeTauriDatabase(database);
        } else {
          // In-browser / Vite environment with WASM SQLite
          database = await createTestDatabase();
        }

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

  const writingRepo = useMemo(() => {
    return db ? new WritingRepository(db) : null;
  }, [db]);

  const value = useMemo<DatabaseContextValue>(
    () => ({
      db,
      vocabRepo,
      cardRepo,
      writingRepo,
      isReady,
      error,
      retry,
    }),
    [db, vocabRepo, cardRepo, writingRepo, isReady, error, retry],
  );

  return <DatabaseContext.Provider value={value}>{children}</DatabaseContext.Provider>;
}
