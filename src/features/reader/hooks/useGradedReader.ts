import { useState, useMemo, useCallback } from 'react';
import { ARTICLES_CATALOG } from '@/data/articles-catalog';
import { NoticingAnnotator } from '@/core/reader/NoticingAnnotator';
import { ReaderArticle, AnnotatedToken, OneClickCardPayload } from '@/core/types/reader';
import { VocabItem } from '@/core/types/vocab';
import { useAudio } from '@/shared/hooks/useAudio';

export function useGradedReader(
  vocabList: VocabItem[],
  onSaveToFlashcards: (payload: OneClickCardPayload) => Promise<void>,
) {
  const { audioService } = useAudio();
  const annotator = useMemo(() => new NoticingAnnotator(vocabList), [vocabList]);

  const [selectedArticle, setSelectedArticle] = useState<ReaderArticle>(ARTICLES_CATALOG[0]);
  const [selectedCefr, setSelectedCefr] = useState<'ALL' | 'A1' | 'A2' | 'B1' | 'B2'>('ALL');

  // Selected token drawer state
  const [activeToken, setActiveToken] = useState<AnnotatedToken | null>(null);
  const [activeSentence, setActiveSentence] = useState<string>('');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const filteredArticles = useMemo(() => {
    return ARTICLES_CATALOG.filter(
      (a) => selectedCefr === 'ALL' || a.cefrLevel === selectedCefr,
    );
  }, [selectedCefr]);

  const segments = useMemo(() => {
    return annotator.annotateText(selectedArticle.contentText);
  }, [annotator, selectedArticle]);

  const handleTokenClick = useCallback(
    (token: AnnotatedToken, sentenceEn: string) => {
      if (token.isPunctuation) return;
      setActiveToken(token);
      setActiveSentence(sentenceEn);
      setSavedSuccess(false);

      if (token.cleanWord) {
        audioService.speak(token.cleanWord, 1.0);
      }
    },
    [audioService],
  );

  const handleSaveCard = useCallback(async () => {
    if (!activeToken || !activeSentence) return;
    setIsSaving(true);
    try {
      const payload = annotator.buildOneClickCardPayload(
        activeToken,
        activeSentence,
        activeToken.ipa ?? 'ˈsample',
        activeToken.translationEs ?? 'Traducción directa',
      );

      await onSaveToFlashcards(payload);
      audioService.playFeedback(true);
      setSavedSuccess(true);
    } finally {
      setIsSaving(false);
    }
  }, [activeToken, activeSentence, annotator, onSaveToFlashcards, audioService]);

  return {
    selectedArticle,
    selectedCefr,
    activeToken,
    activeSentence,
    savedSuccess,
    isSaving,
    filteredArticles,
    segments,
    setSelectedArticle,
    setSelectedCefr,
    handleTokenClick,
    handleSaveCard,
    setActiveToken,
  };
}
