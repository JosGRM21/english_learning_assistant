import { describe, it, expect, beforeEach } from 'vitest';
import { useSrsStore } from '../srsStore';
import { VocabItem, VocabContextExample } from '@/core/types/vocab';

describe('useSrsStore.addVocabItem', () => {
  beforeEach(() => {
    useSrsStore.setState({
      vocabList: [],
      selectedVocab: null,
      availableContexts: [],
      currentContext: null,
      srsCard: null,
      reviewLogs: [],
      searchQuery: '',
      showAnswer: false,
      reviewCount: 0,
    });
  });

  const sampleVocab: VocabItem = {
    id: 'voc_test_1',
    word: 'resilient',
    translationEs: 'resiliente',
    definitionEn: 'able to withstand or recover quickly from difficult conditions',
    ipaGeneralAmerican: 'rɪˈzɪl.jənt',
    cefrLevel: 'B2',
    partOfSpeech: 'ADJECTIVE',
    grammaticalDimension: 'CONTENT',
    isFalseFriend: false,
    createdAt: new Date().toISOString(),
  };

  const sampleContext: VocabContextExample = {
    id: 'ctx_test_1',
    vocabId: 'voc_test_1',
    sentenceEn: 'She remained resilient in the face of adversity.',
    sentenceEs: 'Ella se mantuvo resiliente frente a la adversidad.',
    clozeTarget: 'resilient',
    cefrLevel: 'B2',
    createdAt: new Date().toISOString(),
  };

  it('immediately updates the deck and selects the word when deck was previously empty', () => {
    const store = useSrsStore.getState();
    expect(store.vocabList.length).toBe(0);
    expect(store.selectedVocab).toBeNull();
    expect(store.srsCard).toBeNull();

    store.addVocabItem(sampleVocab, sampleContext);

    const updated = useSrsStore.getState();
    expect(updated.vocabList.length).toBe(1);
    expect(updated.vocabList[0].word).toBe('resilient');
    expect(updated.selectedVocab?.id).toBe(sampleVocab.id);
    expect(updated.srsCard?.targetId).toBe(sampleVocab.id);
    expect(updated.currentContext?.sentenceEn).toBe(sampleContext.sentenceEn);
  });

  it('prepends new word to deck without disrupting active review if a word was already selected', () => {
    const existingVocab: VocabItem = {
      id: 'voc_existing',
      word: 'thorough',
      translationEs: 'exhaustivo',
      definitionEn: 'complete with regard to every detail',
      ipaGeneralAmerican: 'ˈθɜːr.oʊ',
      cefrLevel: 'B2',
      partOfSpeech: 'ADJECTIVE',
      grammaticalDimension: 'CONTENT',
      isFalseFriend: false,
      createdAt: new Date().toISOString(),
    };

    useSrsStore.setState({
      vocabList: [existingVocab],
      selectedVocab: existingVocab,
      srsCard: {
        id: `card_${existingVocab.id}`,
        userId: 'user_local',
        targetType: 'VOCAB',
        targetId: existingVocab.id,
        state: 'REVIEW',
        stability: 3.5,
        difficulty: 4.8,
        reps: 2,
        lapses: 0,
        lastReviewedAt: null,
        scheduledFor: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      },
    });

    useSrsStore.getState().addVocabItem(sampleVocab, sampleContext);

    const state = useSrsStore.getState();
    expect(state.vocabList.length).toBe(2);
    expect(state.vocabList[0].id).toBe(sampleVocab.id);
    // Active card and selected vocab remain on the card currently being reviewed
    expect(state.selectedVocab?.id).toBe(existingVocab.id);
    expect(state.srsCard?.targetId).toBe(existingVocab.id);
  });
});
