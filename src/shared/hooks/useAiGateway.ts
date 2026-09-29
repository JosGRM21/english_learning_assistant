import { useContext } from 'react';
import { AiContext, AiContextValue } from '@/app/providers/AiProvider';

export function useAiGateway(): AiContextValue {
  const context = useContext(AiContext);
  if (!context) {
    throw new Error('useAiGateway must be used within an AiProvider');
  }
  return context;
}
