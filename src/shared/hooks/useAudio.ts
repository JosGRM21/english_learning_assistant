import { useContext } from 'react';
import { AudioContext, AudioContextValue } from '@/app/providers/AudioProvider';

export function useAudio(): AudioContextValue {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
}
