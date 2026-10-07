import { describe, it, expect } from 'vitest';
import { createTestDatabase } from '../../database';
import { AppSettingsRepository } from '../AppSettingsRepository';

describe('AppSettingsRepository', () => {
  it('stores, retrieves, updates and deletes settings in SQLite', async () => {
    const db = await createTestDatabase();
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
  });
});
