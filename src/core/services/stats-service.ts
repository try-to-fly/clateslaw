import type {
  ChargingStats,
  ChargingStatsQueryParams,
  DrivingStats,
  DrivingStatsQueryParams,
  PeriodStats,
  PeriodStatsQueryParams,
  AggregatedStats,
  AggregatedStatsQueryParams,
} from '../../types/stats.js';
import type { GrafanaClient } from '../grafana-client.js';
import { CHARGING_STATS_QUERIES } from '../queries/charging-stats.js';
import { DRIVING_STATS_QUERIES } from '../queries/driving-stats.js';
import { getWeekRange, getMonthRange } from '../utils/time.js';

export class StatsService {
  constructor(private readonly client: GrafanaClient) {}

  async getChargingStats(params: ChargingStatsQueryParams): Promise<ChargingStats> {
    const { carId, from = 'now-90d', to = 'now', minDuration = 0 } = params;

    const [summaryResult, sucResult, avgCostResult] = await Promise.all([
      this.client.query<{
        total_charges: number;
        total_energy_added: number;
        total_energy_used: number;
        total_cost: number;
        charging_efficiency: number;
      }>(CHARGING_STATS_QUERIES.summary, {
        variables: { car_id: carId, min_duration: minDuration },
        timeRange: { from, to },
      }),
      this.client.query<{ suc_cost: number }>(CHARGING_STATS_QUERIES.sucCost, {
        variables: { car_id: carId, min_duration: minDuration },
        timeRange: { from, to },
      }),
      this.client.query<{ avg_cost_per_kwh: number }>(CHARGING_STATS_QUERIES.avgCostPerKwh, {
        variables: { car_id: carId, min_duration: minDuration },
        timeRange: { from, to },
      }),
    ]);

    const summary = summaryResult[0] || {
      total_charges: 0,
      total_energy_added: 0,
      total_energy_used: 0,
      total_cost: 0,
      charging_efficiency: 0,
    };
    const suc = sucResult[0] || { suc_cost: 0 };
    const avgCost = avgCostResult[0] || { avg_cost_per_kwh: 0 };

    return {
      total_charges: summary.total_charges,
      total_energy_added: summary.total_energy_added,
      total_energy_used: summary.total_energy_used,
      total_cost: summary.total_cost,
      suc_cost: suc.suc_cost,
      avg_cost_per_kwh: avgCost.avg_cost_per_kwh,
      charging_efficiency: summary.charging_efficiency,
    };
  }

  async getDrivingStats(params: DrivingStatsQueryParams): Promise<DrivingStats> {
    const { carId, from = 'now-90d', to = 'now' } = params;

    const [summaryResult, medianResult, energyResult] = await Promise.all([
      this.client.query<{
        total_drives: number;
        total_distance: number;
        total_duration_min: number;
        avg_speed: number;
        max_speed: number;
      }>(DRIVING_STATS_QUERIES.summary, {
        variables: { car_id: carId },
        timeRange: { from, to },
      }),
      this.client.query<{ median_distance: number }>(DRIVING_STATS_QUERIES.medianDistance, {
        variables: { car_id: carId },
        timeRange: { from, to },
      }),
      this.client.query<{ total_energy_consumed: number }>(DRIVING_STATS_QUERIES.totalEnergy, {
        variables: { car_id: carId },
        timeRange: { from, to },
      }),
    ]);

    const summary = summaryResult[0] || {
      total_drives: 0,
      total_distance: 0,
      total_duration_min: 0,
      avg_speed: 0,
      max_speed: 0,
    };
    const median = medianResult[0] || { median_distance: 0 };
    const energy = energyResult[0] || { total_energy_consumed: 0 };

    return {
      total_drives: summary.total_drives,
      total_distance: summary.total_distance,
      total_energy_consumed: energy.total_energy_consumed,
      median_distance: median.median_distance,
      avg_speed: summary.avg_speed,
      max_speed: summary.max_speed,
      total_duration_min: summary.total_duration_min,
    };
  }

  async getPeriodStats(params: PeriodStatsQueryParams): Promise<PeriodStats[]> {
    const { carId, from = 'now-1y', to = 'now', period = 'month' } = params;

    const periodFormat = {
      day: 'YYYY-MM-DD',
      week: 'IYYY-IW',
      month: 'YYYY-MM',
      year: 'YYYY',
    }[period];

    const query = `
      WITH drive_stats AS (
        SELECT
          to_char(start_date, '${periodFormat}') AS period,
          COUNT(*) AS drives,
          COALESCE(SUM(distance), 0) AS distance,
          COALESCE(SUM((start_rated_range_km - end_rated_range_km) * c.efficiency), 0) AS energy_consumed
        FROM drives d
        INNER JOIN cars c ON d.car_id = c.id
        WHERE car_id = $car_id AND end_date IS NOT NULL
        GROUP BY 1
      ),
      charge_stats AS (
        SELECT
          to_char(end_date, '${periodFormat}') AS period,
          COUNT(*) AS charges,
          COALESCE(SUM(charge_energy_added), 0) AS energy_added,
          COALESCE(SUM(cost), 0) AS cost
        FROM charging_processes
        WHERE car_id = $car_id AND charge_energy_added > 0
        GROUP BY 1
      )
      SELECT
        COALESCE(d.period, c.period) AS period,
        COALESCE(d.drives, 0) AS drives,
        COALESCE(d.distance, 0) AS distance,
        COALESCE(d.energy_consumed, 0) AS energy_consumed,
        COALESCE(c.charges, 0) AS charges,
        COALESCE(c.energy_added, 0) AS energy_added,
        COALESCE(c.cost, 0) AS cost
      FROM drive_stats d
      FULL OUTER JOIN charge_stats c ON d.period = c.period
      ORDER BY period DESC
    `;

    return this.client.query<PeriodStats>(query, {
      variables: { car_id: carId },
      timeRange: { from, to },
    });
  }

  async getWeeklyStats(params: AggregatedStatsQueryParams): Promise<AggregatedStats> {
    const { carId, date, includePrevious = true } = params;

    const currentRange = getWeekRange(date);
    const [drivingStats, chargingStats] = await Promise.all([
      this.getDrivingStats({ carId, from: currentRange.from, to: currentRange.to }),
      this.getChargingStats({ carId, from: currentRange.from, to: currentRange.to }),
    ]);

    const avgEfficiency = drivingStats.total_distance > 0
      ? (drivingStats.total_energy_consumed / drivingStats.total_distance) * 1000
      : 0;

    const result: AggregatedStats = {
      period: currentRange.from.split('T')[0],
      periodLabel: currentRange.label,
      totalDistance: drivingStats.total_distance,
      totalDuration: drivingStats.total_duration_min,
      totalDrives: drivingStats.total_drives,
      totalCharges: chargingStats.total_charges,
      totalEnergyUsed: drivingStats.total_energy_consumed,
      totalEnergyAdded: chargingStats.total_energy_added,
      totalCost: chargingStats.total_cost,
      avgEfficiency,
    };

    if (includePrevious) {
      const prevDate = new Date(currentRange.from);
      prevDate.setDate(prevDate.getDate() - 7);
      const prevRange = getWeekRange(prevDate.toISOString());

      const [prevDriving, prevCharging] = await Promise.all([
        this.getDrivingStats({ carId, from: prevRange.from, to: prevRange.to }),
        this.getChargingStats({ carId, from: prevRange.from, to: prevRange.to }),
      ]);

      const distanceChange = result.totalDistance - prevDriving.total_distance;
      const energyChange = result.totalEnergyUsed - prevDriving.total_energy_consumed;

      result.comparison = {
        distanceChange,
        distanceChangePercent: prevDriving.total_distance > 0
          ? (distanceChange / prevDriving.total_distance) * 100
          : 0,
        energyChange,
        energyChangePercent: prevDriving.total_energy_consumed > 0
          ? (energyChange / prevDriving.total_energy_consumed) * 100
          : 0,
      };
    }

    return result;
  }

  async getMonthlyStats(params: AggregatedStatsQueryParams): Promise<AggregatedStats> {
    const { carId, date, includePrevious = true } = params;

    const currentRange = getMonthRange(date);
    const [drivingStats, chargingStats] = await Promise.all([
      this.getDrivingStats({ carId, from: currentRange.from, to: currentRange.to }),
      this.getChargingStats({ carId, from: currentRange.from, to: currentRange.to }),
    ]);

    const avgEfficiency = drivingStats.total_distance > 0
      ? (drivingStats.total_energy_consumed / drivingStats.total_distance) * 1000
      : 0;

    const result: AggregatedStats = {
      period: currentRange.from.split('T')[0],
      periodLabel: currentRange.label,
      totalDistance: drivingStats.total_distance,
      totalDuration: drivingStats.total_duration_min,
      totalDrives: drivingStats.total_drives,
      totalCharges: chargingStats.total_charges,
      totalEnergyUsed: drivingStats.total_energy_consumed,
      totalEnergyAdded: chargingStats.total_energy_added,
      totalCost: chargingStats.total_cost,
      avgEfficiency,
    };

    if (includePrevious) {
      const prevDate = new Date(currentRange.from);
      prevDate.setMonth(prevDate.getMonth() - 1);
      const prevRange = getMonthRange(prevDate.toISOString());

      const [prevDriving, prevCharging] = await Promise.all([
        this.getDrivingStats({ carId, from: prevRange.from, to: prevRange.to }),
        this.getChargingStats({ carId, from: prevRange.from, to: prevRange.to }),
      ]);

      const distanceChange = result.totalDistance - prevDriving.total_distance;
      const energyChange = result.totalEnergyUsed - prevDriving.total_energy_consumed;

      result.comparison = {
        distanceChange,
        distanceChangePercent: prevDriving.total_distance > 0
          ? (distanceChange / prevDriving.total_distance) * 100
          : 0,
        energyChange,
        energyChangePercent: prevDriving.total_energy_consumed > 0
          ? (energyChange / prevDriving.total_energy_consumed) * 100
          : 0,
      };
    }

    return result;
  }
}
