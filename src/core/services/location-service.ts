import type { LocationStats, LocationRecord, LocationQueryParams } from '../../types/location.js';
import type { GrafanaClient } from '../grafana-client.js';
import { LOCATIONS_QUERIES } from '../queries/locations.js';

export class LocationService {
  constructor(private readonly client: GrafanaClient) {}

  async getLocationStats(carId: number): Promise<LocationStats> {
    const result = await this.client.query<LocationStats>(LOCATIONS_QUERIES.stats, {
      variables: { car_id: carId },
    });

    return (
      result[0] || {
        total_addresses: 0,
        total_cities: 0,
        total_states: 0,
        total_countries: 0,
      }
    );
  }

  async getTopLocations(params: LocationQueryParams): Promise<LocationRecord[]> {
    const { carId, from = 'now-1y', to = 'now', top = 10 } = params;

    return this.client.query<LocationRecord>(LOCATIONS_QUERIES.topLocations, {
      variables: { car_id: carId, top },
      timeRange: { from, to },
    });
  }
}
