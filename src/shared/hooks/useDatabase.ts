import { useContext } from 'react';
import { DatabaseContext, DatabaseContextValue } from '@/app/providers/DatabaseProvider';

export function useDatabase(): DatabaseContextValue {
  const context = useContext(DatabaseContext);
  if (!context) {
    throw new Error('useDatabase must be used within a DatabaseProvider');
  }
  return context;
}
