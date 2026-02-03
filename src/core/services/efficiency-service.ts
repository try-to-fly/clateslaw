import type { GrafanaClient } from '../grafana-client.js';
import { EFFICIENCY_QUERIES } from '../queries/efficiency.js';

export interface EfficiencyData {
  net_consumption_wh_per_km: number;
  gross_consumption_wh_per_km: number;
  total_distance: number;
}

export interface EfficiencyByTemperature {
  temperature: number;
  avg_distance: number;
  efficiency_ratio: number;
}

export interface EfficiencyQueryParams {
  carId: number;
  minDistance?: number;
}

export class EfficiencyService {
  constructor(private readonly client: GrafanaClient) {}

  async getEfficiency(carId: number): Promise<EfficiencyData> {
    const [netResult, grossResult, distanceResult] = await Promise.all([
      this.client.query<{ consumption_wh_per_km: number }>(EFFICIENCY_QUERIES.netConsumption, {
        variables: { car_id: carId },
      }),
      this.client.query<{ consumption_wh_per_km: number }>(EFFICIENCY_QUERIES.grossConsumption, {
        variables: { car_id: carId },
      }),
      this.client.query<{ total_distance: number }>(EFFICIENCY_QUERIES.totalDistance, {
        variables: { car_id: carId },
      }),
    ]);

    return {
      net_consumption_wh_per_km: netResult[0]?.consumption_wh_per_km || 0,
      gross_consumption_wh_per_km: grossResult[0]?.consumption_wh_per_km || 0,
      total_distance: distanceResult[0]?.total_distance || 0,
    };
  }

  async getEfficiencyByTemperature(params: EfficiencyQueryParams): Promise<EfficiencyByTemperature[]> {
    const { carId, minDistance = 5 } = params;

    return this.client.query<EfficiencyByTemperature>(EFFICIENCY_QUERIES.efficiencyByTemperature, {
      variables: { car_id: carId, min_distance: minDistance },
    });
  }
}
