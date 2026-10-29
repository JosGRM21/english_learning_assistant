import { describe, it, expect } from 'vitest';
import { createTestDatabase } from '../../database';
import { AppSettingsRepository } from '../AppSettingsRepository';

describe('AppSettingsRepository', () => {
  it('stores, retrieves, updates and deletes settings in SQLite', async () => {
    const db = await createTestDatabase(false);
    const repo = new AppSettingsRepository(db);

    // Initial state
    const emptyVal = await repo.getSetting('test_key');
    expect(emptyVal).toBeNull();

    // Insert
    await repo.setSetting('test_key', 'hello_world');
    const readVal = await repo.getSetting('test_key');
    expect(readVal).toBe('hello_world');

    // Update
    await repo.setSetting('test_key', 'updated_value');
    const updatedVal = await repo.getSetting('test_key');
    expect(updatedVal).toBe('updated_value');

    // Multiple settings
    await repo.setSetting('another_key', '123');
    const all = await repo.getAllSettings();
    expect(all).toEqual({
      test_key: 'updated_value',
      another_key: '123',
    });

    // Delete
    await repo.deleteSetting('test_key');
    const afterDelete = await repo.getSetting('test_key');
    expect(afterDelete).toBeNull();
  }, 15000);

  it('handles typed SRS goal settings with sensible defaults and updates', async () => {
    const db = await createTestDatabase(false);
    const repo = new AppSettingsRepository(db);

    // Initial defaults
    const defaults = await repo.getSrsGoalSettings();
    expect(defaults.activeGoal).toBe('TOP_500');
    expect(defaults.dailyNewCardsTarget).toBe(10);
    expect(defaults.overloadThreshold).toBe(35);
    expect(defaults.includePhrasalVerbs).toBe(true);
    expect(defaults.phrasalVerbsRatio).toBe(0.2);

    // Update settings
    await repo.setSrsGoalSettings({
      activeGoal: 'TOP_1000',
      dailyNewCardsTarget: 15,
      overloadThreshold: 35,
      includePhrasalVerbs: false,
      phrasalVerbsRatio: 0.3,
    });

    const updated = await repo.getSrsGoalSettings();
    expect(updated.activeGoal).toBe('TOP_1000');
    expect(updated.dailyNewCardsTarget).toBe(15);
    expect(updated.overloadThreshold).toBe(35);
    expect(updated.includePhrasalVerbs).toBe(false);
    expect(updated.phrasalVerbsRatio).toBe(0.3);
  });
});
