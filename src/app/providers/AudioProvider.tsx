import React, { createContext, useMemo } from 'react';
import { AudioService } from '@/infrastructure/audio/AudioService';

export interface AudioContextValue {
  audioService: AudioService;
}

export const AudioContext = createContext<AudioContextValue | null>(null);

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const audioService = useMemo(() => new AudioService(), []);

  const value = useMemo<AudioContextValue>(
    () => ({
      audioService,
    }),
    [audioService],
  );

  return <AudioContext.Provider value={value}>{children}</AudioContext.Provider>;
}
