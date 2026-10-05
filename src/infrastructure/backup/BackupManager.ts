import { z } from 'zod';

export const UserBackupSchema = z.object({
  version: z.literal('1.0.0'),
  exportedAt: z.string(),
  userId: z.string(),
  cardsCount: z.number(),
  reviewsCount: z.number(),
  errorsCount: z.number().default(0),
  payload: z.object({
    cards: z.array(z.record(z.string(), z.any())),
    reviews: z.array(z.record(z.string(), z.any())),
    errors: z.array(z.record(z.string(), z.any())).default([]),
    streak: z.record(z.string(), z.any()).nullable(),
    quests: z.array(z.record(z.string(), z.any())).default([]),
  }),
});

export type UserBackup = z.infer<typeof UserBackupSchema>;

export class BackupManager {
  /**
   * Generates a validated JSON backup structure from user data.
   */
  public createBackup(data: {
    userId: string;
    cards: Record<string, unknown>[];
    reviews: Record<string, unknown>[];
    errors?: Record<string, unknown>[];
    streak: Record<string, unknown> | null;
    quests?: Record<string, unknown>[];
  }): UserBackup {
    const errorsList = data.errors ?? [];
    const questsList = data.quests ?? [];

    const backup: UserBackup = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      userId: data.userId,
      cardsCount: data.cards.length,
      reviewsCount: data.reviews.length,
      errorsCount: errorsList.length,
      payload: {
        cards: data.cards,
        reviews: data.reviews,
        errors: errorsList,
        streak: data.streak,
        quests: questsList,
      },
    };

    return UserBackupSchema.parse(backup);
  }

  /**
   * Serializes backup to formatted JSON string.
   */
  public serialize(backup: UserBackup): string {
    return JSON.stringify(backup, null, 2);
  }

  /**
   * Parses and validates raw JSON input.
   */
  public deserialize(rawJson: string): UserBackup {
    const parsed = JSON.parse(rawJson);
    return UserBackupSchema.parse(parsed);
  }
}
