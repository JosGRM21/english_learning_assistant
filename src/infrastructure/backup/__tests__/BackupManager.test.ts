import { describe, it, expect } from 'vitest';
import { BackupManager } from '../BackupManager';

describe('BackupManager', () => {
  const backupManager = new BackupManager();

  it('creates and serializes a schema-valid backup', () => {
    const backup = backupManager.createBackup({
      userId: 'user_01',
      cards: [{ id: 'c1', stability: 2.5 }],
      reviews: [{ id: 'r1', rating: 3 }],
      errors: [{ id: 'e1', code: 'L1_PREP_DEPEND_ON' }],
      streak: { currentStreak: 5 },
      quests: [{ id: 'q1', isCompleted: true }],
    });

    expect(backup.version).toBe('1.0.0');
    expect(backup.cardsCount).toBe(1);
    expect(backup.reviewsCount).toBe(1);
    expect(backup.errorsCount).toBe(1);

    const json = backupManager.serialize(backup);
    expect(typeof json).toBe('string');
    expect(json).toContain('"version": "1.0.0"');

    const restored = backupManager.deserialize(json);
    expect(restored.userId).toBe('user_01');
    expect(restored.payload.cards).toHaveLength(1);
  });

  it('throws validation error when importing corrupt or mismatched backup schema', () => {
    const invalidJson = JSON.stringify({
      version: '99.0.0', // wrong version
      userId: 'user_x',
    });

    expect(() => backupManager.deserialize(invalidJson)).toThrow();
  });
});
