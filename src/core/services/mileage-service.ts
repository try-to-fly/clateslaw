import type { MileageRecord, MileageStats, MileageQueryParams } from '../../types/mileage.js';
import type { GrafanaClient } from '../grafana-client.js';
import { MILEAGE_QUERIES } from '../queries/mileage.js';

export class MileageService {
  constructor(private readonly client: GrafanaClient) {}

  async getMileageStats(carId: number): Promise<MileageStats> {
    const [statsResult, avgResult] = await Promise.all([
      this.client.query<{ current_odometer: number; total_logged: number }>(MILEAGE_QUERIES.stats, {
        variables: { car_id: carId },
      }),
      this.client.query<{ avg_daily: number; avg_monthly: number }>(MILEAGE_QUERIES.avgDaily, {
        variables: { car_id: carId },
      }),
    ]);

    const stats = statsResult[0] || { current_odometer: 0, total_logged: 0 };
    const avg = avgResult[0] || { avg_daily: 0, avg_monthly: 0 };

    return {
      current_odometer: stats.current_odometer,
      total_logged: stats.total_logged,
      avg_daily: avg.avg_daily,
      avg_monthly: avg.avg_monthly,
    };
  }

  async getDailyMileage(params: MileageQueryParams): Promise<MileageRecord[]> {
    const { carId, from = 'now-30d', to = 'now' } = params;

    return this.client.query<MileageRecord>(MILEAGE_QUERIES.daily, {
      variables: { car_id: carId, limit: 100 },
      timeRange: { from, to },
    });
  }
}
