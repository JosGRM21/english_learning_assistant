import React from 'react';
import { DatabaseProvider } from './DatabaseProvider';
import { AudioProvider } from './AudioProvider';
import { AiProvider } from './AiProvider';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <DatabaseProvider>
      <AudioProvider>
        <AiProvider>{children}</AiProvider>
      </AudioProvider>
    </DatabaseProvider>
  );
}
