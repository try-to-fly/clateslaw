import type { VampireRecord, VampireStats, VampireQueryParams } from '../../types/vampire.js';
import type { GrafanaClient } from '../grafana-client.js';
import { VAMPIRE_QUERIES } from '../queries/vampire.js';

export class VampireService {
  constructor(private readonly client: GrafanaClient) {}

  async getVampireRecords(params: VampireQueryParams): Promise<VampireRecord[]> {
    const { carId, from = 'now-90d', to = 'now', minDuration = 60 } = params;

    return this.client.query<VampireRecord>(VAMPIRE_QUERIES.list, {
      variables: { car_id: carId, min_duration: minDuration },
      timeRange: { from, to },
    });
  }

  async getVampireStats(params: VampireQueryParams): Promise<VampireStats> {
    const { carId, from = 'now-90d', to = 'now', minDuration = 60 } = params;

    const result = await this.client.query<{
      total_records: number;
      total_energy_drained: number;
      avg_range_loss_per_hour: number;
    }>(VAMPIRE_QUERIES.stats, {
      variables: { car_id: carId, min_duration: minDuration },
      timeRange: { from, to },
    });

    const stats = result[0] || {
      total_records: 0,
      total_energy_drained: 0,
      avg_range_loss_per_hour: 0,
    };

    return {
      total_records: stats.total_records,
      total_energy_drained: stats.total_energy_drained,
      avg_range_loss_per_hour: stats.avg_range_loss_per_hour,
      avg_standby_percent: 0,
    };
  }
}
