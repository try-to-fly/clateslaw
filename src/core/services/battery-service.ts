import type { BatteryHealth, BatteryChargingStats, BatteryDriveStats } from '../../types/battery.js';
import type { GrafanaClient } from '../grafana-client.js';
import { BATTERY_QUERIES } from '../queries/battery.js';

export class BatteryService {
  constructor(private readonly client: GrafanaClient) {}

  async getBatteryHealth(carId: number): Promise<BatteryHealth> {
    const [capacityResult, healthResult, socResult, chargingResult, acDcResult, driveResult] =
      await Promise.all([
        this.client.query<{
          usable_capacity_new: number;
          usable_capacity_now: number;
          capacity_difference: number;
          efficiency: number;
        }>(BATTERY_QUERIES.currentCapacity, { variables: { car_id: carId } }),
        this.client.query<{
          degradation_percent: number;
          battery_health_percent: number;
        }>(BATTERY_QUERIES.healthPercent, { variables: { car_id: carId } }),
        this.client.query<{ usable_battery_level: number }>(BATTERY_QUERIES.currentSoc, {
          variables: { car_id: carId },
        }),
        this.client.query<BatteryChargingStats>(BATTERY_QUERIES.chargingStats, {
          variables: { car_id: carId },
        }),
        this.client.query<{ ac_energy: number; dc_energy: number }>(BATTERY_QUERIES.acDcEnergy, {
          variables: { car_id: carId },
        }),
        this.client.query<BatteryDriveStats>(BATTERY_QUERIES.driveStats, {
          variables: { car_id: carId },
        }),
      ]);

    const capacity = capacityResult[0] || {
      usable_capacity_new: 0,
      usable_capacity_now: 0,
      capacity_difference: 0,
      efficiency: 0,
    };
    const health = healthResult[0] || { degradation_percent: 0, battery_health_percent: 100 };
    const soc = socResult[0] || { usable_battery_level: 0 };
    const charging = chargingResult[0] || {
      total_charges: 0,
      charging_cycles: 0,
      total_energy_added: 0,
      total_energy_used: 0,
      charging_efficiency: 0,
    };
    const acDc = acDcResult[0] || { ac_energy: 0, dc_energy: 0 };
    const drive = driveResult[0] || { logged_distance: 0, mileage: 0, odometer: 0, data_lost: 0 };

    const currentStoredEnergy = (soc.usable_battery_level * capacity.usable_capacity_now) / 100;

    return {
      usable_capacity_now: capacity.usable_capacity_now,
      usable_capacity_new: capacity.usable_capacity_new,
      capacity_difference: capacity.capacity_difference,
      max_range_new: 0,
      max_range_now: 0,
      range_lost: 0,
      degradation_percent: health.degradation_percent,
      battery_health_percent: health.battery_health_percent,
      current_soc: soc.usable_battery_level,
      current_stored_energy: currentStoredEnergy,
      efficiency: capacity.efficiency,
    };
  }

  async getChargingStats(carId: number): Promise<BatteryChargingStats> {
    const [chargingResult, acDcResult] = await Promise.all([
      this.client.query<{
        total_charges: number;
        total_energy_added: number;
        total_energy_used: number;
        charging_efficiency: number;
      }>(BATTERY_QUERIES.chargingStats, { variables: { car_id: carId } }),
      this.client.query<{ ac_energy: number; dc_energy: number }>(BATTERY_QUERIES.acDcEnergy, {
        variables: { car_id: carId },
      }),
    ]);

    const charging = chargingResult[0] || {
      total_charges: 0,
      total_energy_added: 0,
      total_energy_used: 0,
      charging_efficiency: 0,
    };
    const acDc = acDcResult[0] || { ac_energy: 0, dc_energy: 0 };

    const chargingCycles = Math.floor(charging.total_energy_added / 75);

    return {
      total_charges: charging.total_charges,
      charging_cycles: chargingCycles,
      total_energy_added: charging.total_energy_added,
      total_energy_used: charging.total_energy_used,
      charging_efficiency: charging.charging_efficiency,
      ac_energy: acDc.ac_energy,
      dc_energy: acDc.dc_energy,
    };
  }

  async getDriveStats(carId: number): Promise<BatteryDriveStats> {
    const result = await this.client.query<BatteryDriveStats>(BATTERY_QUERIES.driveStats, {
      variables: { car_id: carId },
    });

    return (
      result[0] || {
        logged_distance: 0,
        mileage: 0,
        odometer: 0,
        data_lost: 0,
      }
    );
  }
}
