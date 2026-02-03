import type { GrafanaClient } from '../grafana-client.js';
import { PROJECTED_RANGE_QUERIES } from '../queries/projected-range.js';

export interface ProjectedRangeStats {
  projected_range: number;
  avg_battery_level: number;
  avg_usable_battery_level: number;
  current_odometer: number;
}

export interface ProjectedRangeHistory {
  date: string;
  projected_range: number;
  odometer: number;
}

export interface ProjectedRangeQueryParams {
  carId: number;
  from?: string;
  to?: string;
  limit?: number;
}

export class ProjectedRangeService {
  constructor(private readonly client: GrafanaClient) {}

  async getProjectedRangeStats(carId: number): Promise<ProjectedRangeStats> {
    const result = await this.client.query<ProjectedRangeStats>(PROJECTED_RANGE_QUERIES.stats, {
      variables: { car_id: carId },
    });

    return (
      result[0] || {
        projected_range: 0,
        avg_battery_level: 0,
        avg_usable_battery_level: 0,
        current_odometer: 0,
      }
    );
  }

  async getProjectedRangeHistory(params: ProjectedRangeQueryParams): Promise<ProjectedRangeHistory[]> {
    const { carId, from = 'now-30d', to = 'now', limit = 30 } = params;

    return this.client.query<ProjectedRangeHistory>(PROJECTED_RANGE_QUERIES.history, {
      variables: { car_id: carId, limit },
      timeRange: { from, to },
    });
  }
}
