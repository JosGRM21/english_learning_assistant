import { Kysely } from 'kysely';
import { DatabaseSchema } from '../../../core/types/database';
import { IAppSettingsRepository } from '../../../core/repositories/IAppSettingsRepository';
import { SrsGoalSettings } from '../../../core/types/srs';

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

  public async getSrsGoalSettings(): Promise<SrsGoalSettings> {
    const rows = await this.db
      .selectFrom('app_settings')
      .select(['key', 'value'])
      .where('key', 'in', [
        'srs.active_goal',
        'srs.daily_new_cards',
        'srs.overload_threshold',
        'srs.include_phrasal_verbs',
        'srs.phrasal_ratio',
      ])
      .execute();

    const map = new Map(rows.map((r) => [r.key, r.value]));
    const activeGoal = map.get('srs.active_goal') as SrsGoalSettings['activeGoal'] | undefined;
    const dailyTargetRaw = map.get('srs.daily_new_cards');
    const thresholdRaw = map.get('srs.overload_threshold');
    const includePhrasalRaw = map.get('srs.include_phrasal_verbs');
    const phrasalRatioRaw = map.get('srs.phrasal_ratio');

    return {
      activeGoal: activeGoal && ['TOP_500', 'TOP_1000', 'TOP_3000', 'TOP_5000'].includes(activeGoal)
        ? activeGoal
        : 'TOP_500',
      dailyNewCardsTarget: dailyTargetRaw ? Math.max(1, parseInt(dailyTargetRaw, 10)) : 10,
      overloadThreshold: thresholdRaw ? Math.max(1, parseInt(thresholdRaw, 10)) : 35,
      includePhrasalVerbs: includePhrasalRaw === undefined ? true : includePhrasalRaw === 'true',
      phrasalVerbsRatio: phrasalRatioRaw ? parseFloat(phrasalRatioRaw) : 0.2,
    };
  }

  public async setSrsGoalSettings(settings: Partial<SrsGoalSettings>): Promise<void> {
    const pairs: Array<{ key: string; value: string }> = [];
    if (settings.activeGoal !== undefined) {
      pairs.push({ key: 'srs.active_goal', value: settings.activeGoal });
    }
    if (settings.dailyNewCardsTarget !== undefined) {
      pairs.push({ key: 'srs.daily_new_cards', value: String(settings.dailyNewCardsTarget) });
    }
    if (settings.overloadThreshold !== undefined) {
      pairs.push({ key: 'srs.overload_threshold', value: String(settings.overloadThreshold) });
    }
    if (settings.includePhrasalVerbs !== undefined) {
      pairs.push({ key: 'srs.include_phrasal_verbs', value: String(settings.includePhrasalVerbs) });
    }
    if (settings.phrasalVerbsRatio !== undefined) {
      pairs.push({ key: 'srs.phrasal_ratio', value: String(settings.phrasalVerbsRatio) });
    }

    if (pairs.length === 0) return;

    const now = new Date().toISOString();
    await this.db.transaction().execute(async (trx) => {
      for (const { key, value } of pairs) {
        const existing = await trx
          .selectFrom('app_settings')
          .select('key')
          .where('key', '=', key)
          .executeTakeFirst();

        if (existing) {
          await trx
            .updateTable('app_settings')
            .set({ value, updated_at: now })
            .where('key', '=', key)
            .execute();
        } else {
          await trx
            .insertInto('app_settings')
            .values({ key, value, updated_at: now })
            .execute();
        }
      }
    });
  }
}
