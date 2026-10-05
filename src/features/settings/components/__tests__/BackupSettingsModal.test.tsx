import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BackupSettingsModal } from '../BackupSettingsModal';
import { DatabaseContext, DatabaseContextValue } from '@/app/providers/DatabaseProvider';
import { createTestDatabase } from '@/infrastructure/db/database';
import { CardRepository } from '@/infrastructure/db/repositories/CardRepository';
import { VocabRepository } from '@/infrastructure/db/repositories/VocabRepository';
import { useSrsStore } from '@/features/srs/store/srsStore';

describe('BackupSettingsModal Integration', () => {
  let dbContextValue: DatabaseContextValue;

  beforeEach(async () => {
    const db = await createTestDatabase();
    const cardRepo = new CardRepository(db);
    const vocabRepo = new VocabRepository(db);

    dbContextValue = {
      db,
      cardRepo,
      vocabRepo,
      writingRepo: null,
      isReady: true,
      error: null,
      retry: vi.fn(),
    };

    useSrsStore.setState({
      vocabList: [],
      srsCard: null,
      reviewLogs: [],
    });
  });

  it('restores backup file and persists into SQLite and updates UI and stores', async () => {
    render(
      <DatabaseContext.Provider value={dbContextValue}>
        <BackupSettingsModal />
      </DatabaseContext.Provider>,
    );

    expect(screen.getByText(/Exportar Copia de Seguridad JSON \(0 tarjetas\)/i)).toBeDefined();
    expect(screen.queryByText(/Buscar actualizaciones/i)).toBeNull();
    expect(screen.queryByText(/Actualizaciones de la Aplicación/i)).toBeNull();

    const sampleBackup = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      userId: 'user_local',
      cardsCount: 1,
      reviewsCount: 0,
      errorsCount: 0,
      payload: {
        cards: [
          {
            id: 'card_resilient',
            targetType: 'VOCAB',
            targetId: 'voc_resilient',
            state: 'NEW',
            stability: 0,
            difficulty: 5.0,
            vocab: {
              id: 'voc_resilient',
              word: 'resilient',
              translationEs: 'resiliente',
              definitionEn: 'able to withstand or recover quickly from difficult conditions',
              ipaGeneralAmerican: '/rɪˈzɪl.jənt/',
              cefrLevel: 'B2',
            },
          },
        ],
        reviews: [],
        errors: [],
        streak: null,
        quests: [],
      },
    };

    const jsonBlob = new Blob([JSON.stringify(sampleBackup)], { type: 'application/json' });
    const file = new File([jsonBlob], 'backup.json', { type: 'application/json' });

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput).not.toBeNull();

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText(/Copia de seguridad válida restaurada con éxito: 1 tarjetas/i)).toBeDefined();
    });

    // Verify DB persistence
    const vocabsInDb = await dbContextValue.vocabRepo!.getAllVocabs(10);
    expect(vocabsInDb).toHaveLength(1);
    expect(vocabsInDb[0].word).toBe('resilient');
    expect(vocabsInDb[0].ipaGeneralAmerican).toBe('/rɪˈzɪl.jənt/');

    // Verify SRS store synchronization
    const srsVocabList = useSrsStore.getState().vocabList;
    expect(srsVocabList).toHaveLength(1);
    expect(srsVocabList[0].word).toBe('resilient');

    // Verify export button count updated
    await waitFor(() => {
      expect(screen.getByText(/Exportar Copia de Seguridad JSON \(1 tarjetas\)/i)).toBeDefined();
    });
  });
});
