import { useContext } from 'react';
import { DatabaseContext, DatabaseContextValue } from '@/app/providers/DatabaseProvider';

export function useDatabase(): DatabaseContextValue {
  const context = useContext(DatabaseContext);
  if (!context) {
    return {
      db: null,
      vocabRepo: null,
      cardRepo: null,
      writingRepo: null,
      notificationRepo: null,
      appSettingsRepo: null,
      isReady: false,
      error: null,
      retry: () => {},
    };
  }
  return context;
}
