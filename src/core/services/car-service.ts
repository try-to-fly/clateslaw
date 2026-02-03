import type { Car, CarOverview, CarState } from '../../types/car.js';
import type { GrafanaClient } from '../grafana-client.js';
import { CAR_QUERIES } from '../queries/cars.js';

export class CarService {
  constructor(private readonly client: GrafanaClient) {}

  /**
   * 获取所有车辆列表
   */
  async getCars(): Promise<Car[]> {
    return this.client.query<Car>(CAR_QUERIES.list);
  }

  /**
   * 获取车辆概览信息
   */
  async getCarOverview(carId: number): Promise<CarOverview> {
    const variables = { car_id: carId };

    const [battery, range, odometer, version, state] = await Promise.all([
      this.client.query<{ battery_level: number; date: string }>(
        CAR_QUERIES.batteryLevel,
        { variables }
      ),
      this.client.query<{ range: number }>(
        CAR_QUERIES.range,
        { variables }
      ),
      this.client.query<{ odometer: number }>(
        CAR_QUERIES.odometer,
        { variables }
      ),
      this.client.query<{ version: string }>(
        CAR_QUERIES.softwareVersion,
        { variables }
      ),
      this.client.query<{ state: string }>(
        CAR_QUERIES.state,
        { variables }
      ),
    ]);

    return {
      battery_level: battery[0]?.battery_level ?? 0,
      range_km: range[0]?.range ?? 0,
      odometer_km: odometer[0]?.odometer ?? 0,
      software_version: version[0]?.version ?? 'Unknown',
      last_update: battery[0]?.date ?? new Date().toISOString(),
      state: (state[0]?.state as CarState) ?? 'offline',
    };
  }
}
