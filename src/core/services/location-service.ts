import type {
  LocationStats,
  LocationRecord,
  LocationQueryParams,
  ChargingStationRecord,
  ChargingStationSummary,
} from '../../types/location.js';
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

  async getChargingStations(params: LocationQueryParams): Promise<ChargingStationSummary> {
    const { carId, from = 'now-1y', to = 'now', top = 20 } = params;

    const stations = await this.client.query<ChargingStationRecord>(
      LOCATIONS_QUERIES.chargingStations,
      {
        variables: { car_id: carId, top },
        timeRange: { from, to },
      }
    );

    const superchargers = stations.filter(s => s.is_supercharger);
    const homeCharging = stations.filter(s =>
      s.name?.toLowerCase().includes('home') ||
      s.name?.toLowerCase().includes('家') ||
      s.total_charges >= 10 && s.avg_power_kw < 20
    );
    const otherCharging = stations.filter(s =>
      !s.is_supercharger &&
      !(s.name?.toLowerCase().includes('home') || s.name?.toLowerCase().includes('家'))
    );

    const totalStations = stations.length;
    const superchargerRatio = totalStations > 0
      ? superchargers.length / totalStations
      : 0;

    return {
      total_stations: totalStations,
      supercharger_count: superchargers.length,
      home_charging_count: homeCharging.length,
      other_charging_count: otherCharging.length,
      supercharger_ratio: superchargerRatio,
      stations,
    };
  }
}
