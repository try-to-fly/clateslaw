import type { UpdateRecord, UpdateStats, UpdateQueryParams } from '../../types/update.js';
import type { GrafanaClient } from '../grafana-client.js';
import { UPDATES_QUERIES } from '../queries/updates.js';

export class UpdateService {
  constructor(private readonly client: GrafanaClient) {}

  async getUpdates(params: UpdateQueryParams): Promise<UpdateRecord[]> {
    const { carId, from = 'now-1y', to = 'now', limit = 50 } = params;

    return this.client.query<UpdateRecord>(UPDATES_QUERIES.list, {
      variables: { car_id: carId, limit },
      timeRange: { from, to },
    });
  }

  async getUpdateStats(carId: number): Promise<UpdateStats> {
    const [statsResult, intervalResult, versionResult] = await Promise.all([
      this.client.query<{ total_updates: number }>(UPDATES_QUERIES.stats, {
        variables: { car_id: carId },
      }),
      this.client.query<{ median_interval_days: number }>(UPDATES_QUERIES.medianInterval, {
        variables: { car_id: carId },
      }),
      this.client.query<{ version: string }>(UPDATES_QUERIES.currentVersion, {
        variables: { car_id: carId },
      }),
    ]);

    return {
      total_updates: statsResult[0]?.total_updates || 0,
      median_interval_days: intervalResult[0]?.median_interval_days || 0,
      current_version: versionResult[0]?.version || 'Unknown',
    };
  }
}
