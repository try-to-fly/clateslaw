import type { LatestPosition } from '../../types/position.js';
import type { GrafanaClient } from '../grafana-client.js';
import { POSITION_QUERIES } from '../queries/positions.js';

export class PositionService {
  constructor(private readonly client: GrafanaClient) {}

  async getLatestPosition(carId: number): Promise<LatestPosition | null> {
    const rows = await this.client.query<LatestPosition>(POSITION_QUERIES.latest, {
      variables: { car_id: carId },
    });

    return rows[0] ?? null;
  }
}
