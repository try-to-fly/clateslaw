import type { Settings } from '../../types/settings.js';
import type { GrafanaClient } from '../grafana-client.js';
import { SETTINGS_QUERIES } from '../queries/settings.js';

export class SettingsService {
  private cachedSettings: Settings | null = null;

  constructor(private readonly client: GrafanaClient) {}

  async getSettings(): Promise<Settings> {
    if (this.cachedSettings) {
      return this.cachedSettings;
    }

    const results = await this.client.query<Settings>(SETTINGS_QUERIES.get, {});
    if (results.length === 0) {
      return {
        unit_of_length: 'km',
        unit_of_temperature: 'C',
        preferred_range: 'rated',
        base_url: '',
      };
    }

    this.cachedSettings = results[0];
    return this.cachedSettings;
  }
}
