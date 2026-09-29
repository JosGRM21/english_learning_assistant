import { useMemo, useState, useCallback } from 'react';
import { ConnectedSpeechMatcher } from '@/core/phonology/ConnectedSpeechMatcher';
import { PhoneticBoundary } from '@/core/types/phonology';
import { useAudio } from '@/shared/hooks/useAudio';

export function useConnectedSpeech(sentence: string) {
  const matcher = useMemo(() => new ConnectedSpeechMatcher(), []);
  const { audioService } = useAudio();

  const [selectedBoundary, setSelectedBoundary] = useState<PhoneticBoundary | null>(null);

  const boundaries = useMemo(() => {
    if (!sentence) return [];
    return matcher.analyze(sentence);
  }, [matcher, sentence]);

  const speakNormal = useCallback(() => {
    audioService.speak(sentence, 1.0);
  }, [audioService, sentence]);

  const speakSlow = useCallback(() => {
    audioService.speak(sentence, 0.75);
  }, [audioService, sentence]);

  return {
    boundaries,
    selectedBoundary,
    setSelectedBoundary,
    speakNormal,
    speakSlow,
  };
}
