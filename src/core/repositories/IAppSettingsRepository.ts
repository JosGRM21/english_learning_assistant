export interface IAppSettingsRepository {
  getSetting(key: string): Promise<string | null>;
  setSetting(key: string, value: string): Promise<void>;
  deleteSetting(key: string): Promise<void>;
  getAllSettings(): Promise<Record<string, string>>;
}
