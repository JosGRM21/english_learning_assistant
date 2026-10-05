import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useBackupRestore } from '../useBackupRestore';

describe('useBackupRestore Hook', () => {
  const dummyBackupPayload = {
    version: '1.0.0',
    exportedAt: '2026-10-05T00:00:00.000Z',
    userId: 'user_local',
    cardsCount: 2,
    reviewsCount: 1,
    errorsCount: 0,
    payload: {
      cards: [
        { id: 'c1', word: 'apple' },
        { id: 'c2', word: 'banana' },
      ],
      reviews: [{ id: 'r1', rating: 3 }],
      errors: [],
      streak: null,
      quests: [],
    },
  };

  it('calls onRestoreBackup asynchronously and sets importStatus upon success', async () => {
    const onRestoreBackup = vi.fn().mockResolvedValue(undefined);

    const { result } = renderHook(() =>
      useBackupRestore({
        userId: 'user_local',
        cards: [],
        reviewLogs: [],
        errors: [],
        streak: null,
        quests: [],
        onRestoreBackup,
      }),
    );

    const jsonBlob = new Blob([JSON.stringify(dummyBackupPayload)], { type: 'application/json' });
    const file = new File([jsonBlob], 'backup.json', { type: 'application/json' });

    const mockEvent = {
      target: {
        files: [file],
        value: 'C:\\fakepath\\backup.json',
      },
    } as unknown as React.ChangeEvent<HTMLInputElement>;

    await act(async () => {
      result.current.handleFileChange(mockEvent);
      // Wait for FileReader onload to resolve
      await new Promise((r) => setTimeout(r, 50));
    });

    expect(onRestoreBackup).toHaveBeenCalledTimes(1);
    expect(onRestoreBackup).toHaveBeenCalledWith(dummyBackupPayload.payload);
    expect(result.current.importStatus).toContain('2 tarjetas');
    expect(result.current.importStatus).toContain('1 repasos históricos');
    expect(result.current.importError).toBeNull();
    expect(result.current.isImporting).toBe(false);
  });

  it('sets importError when onRestoreBackup fails', async () => {
    const onRestoreBackup = vi.fn().mockRejectedValue(new Error('SQLite constraint failure'));

    const { result } = renderHook(() =>
      useBackupRestore({
        userId: 'user_local',
        cards: [],
        reviewLogs: [],
        errors: [],
        streak: null,
        quests: [],
        onRestoreBackup,
      }),
    );

    const jsonBlob = new Blob([JSON.stringify(dummyBackupPayload)], { type: 'application/json' });
    const file = new File([jsonBlob], 'backup.json', { type: 'application/json' });

    const mockEvent = {
      target: {
        files: [file],
        value: 'C:\\fakepath\\backup.json',
      },
    } as unknown as React.ChangeEvent<HTMLInputElement>;

    await act(async () => {
      result.current.handleFileChange(mockEvent);
      await new Promise((r) => setTimeout(r, 50));
    });

    expect(onRestoreBackup).toHaveBeenCalledTimes(1);
    expect(result.current.importError).toContain('SQLite constraint failure');
    expect(result.current.importStatus).toBeNull();
  });
});
