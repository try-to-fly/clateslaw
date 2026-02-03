import type { StateRecord, StateStats, StateQueryParams } from '../../types/state.js';
import type { GrafanaClient } from '../grafana-client.js';
import { STATES_QUERIES } from '../queries/states.js';

export class StateService {
  constructor(private readonly client: GrafanaClient) {}

  async getStates(params: StateQueryParams): Promise<StateRecord[]> {
    const { carId, from = 'now-30d', to = 'now', limit = 50 } = params;

    return this.client.query<StateRecord>(STATES_QUERIES.list, {
      variables: { car_id: carId, limit },
      timeRange: { from, to },
    });
  }

  async getCurrentState(carId: number): Promise<{ state: string; start_date: string } | null> {
    const result = await this.client.query<{ state: string; start_date: string }>(
      STATES_QUERIES.current,
      { variables: { car_id: carId } }
    );
    return result[0] || null;
  }

  async getStateStats(carId: number): Promise<StateStats[]> {
    return this.client.query<StateStats>(STATES_QUERIES.stats, {
      variables: { car_id: carId },
    });
  }
}
