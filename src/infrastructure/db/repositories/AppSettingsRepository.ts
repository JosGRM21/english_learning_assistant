import { Kysely } from 'kysely';
import { DatabaseSchema } from '../../../core/types/database';
import { IAppSettingsRepository } from '../../../core/repositories/IAppSettingsRepository';

export class AppSettingsRepository implements IAppSettingsRepository {
  constructor(private readonly db: Kysely<DatabaseSchema>) {}

  public async getSetting(key: string): Promise<string | null> {
    const row = await this.db
      .selectFrom('app_settings')
      .select('value')
      .where('key', '=', key)
      .executeTakeFirst();
    return row?.value ?? null;
  }

  public async setSetting(key: string, value: string): Promise<void> {
    const now = new Date().toISOString();
    const existing = await this.db
      .selectFrom('app_settings')
      .select('key')
      .where('key', '=', key)
      .executeTakeFirst();

    if (existing) {
      await this.db
        .updateTable('app_settings')
        .set({ value, updated_at: now })
        .where('key', '=', key)
        .execute();
    } else {
      await this.db
        .insertInto('app_settings')
        .values({ key, value, updated_at: now })
        .execute();
    }
  }

  public async deleteSetting(key: string): Promise<void> {
    await this.db
      .deleteFrom('app_settings')
      .where('key', '=', key)
      .execute();
  }

  public async getAllSettings(): Promise<Record<string, string>> {
    const rows = await this.db
      .selectFrom('app_settings')
      .selectAll()
      .execute();

    const record: Record<string, string> = {};
    for (const r of rows) {
      record[r.key] = r.value;
    }
    return record;
  }
}
