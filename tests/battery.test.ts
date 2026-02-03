import { describe, it, expect } from 'vitest';
import { loadCarDataOrThrow } from './helpers/data-loader';
import { isPercentage, isNonNegative, isPositive } from './helpers/validators';

interface BatteryHealth {
  usable_capacity_now: number;
  usable_capacity_new: number;
  capacity_difference: number;
  max_range_new: number;
  max_range_now: number;
  range_lost: number;
  degradation_percent: number;
  battery_health_percent: number;
  current_soc: number;
  current_stored_energy: number;
  efficiency: number;
}

interface ChargingStats {
  total_charges: number;
  total_energy_added: number;
  avg_energy_per_charge: number;
}

interface DriveStats {
  logged_distance: number;
  mileage: number;
  odometer: number;
  data_lost: number;
}

const CAR_ID = 1;

describe('Battery', () => {
  describe('Health', () => {
    const health = loadCarDataOrThrow<BatteryHealth>(CAR_ID, 'battery/health.json');

    it('should have battery_health_percent in 0-100', () => {
      expect(isPercentage(health.battery_health_percent)).toBe(true);
    });

    it('should have degradation_percent in 0-100', () => {
      expect(isPercentage(health.degradation_percent)).toBe(true);
    });

    it('should have current_soc in 0-100', () => {
      expect(isPercentage(health.current_soc)).toBe(true);
    });

    it('should have battery_health + degradation = 100', () => {
      const sum = health.battery_health_percent + health.degradation_percent;
      expect(sum).toBeCloseTo(100, 1);
    });

    it('should have non-negative usable_capacity_now', () => {
      expect(isNonNegative(health.usable_capacity_now)).toBe(true);
    });

    it('should have non-negative usable_capacity_new', () => {
      expect(isNonNegative(health.usable_capacity_new)).toBe(true);
    });

    it('should have usable_capacity_now <= usable_capacity_new', () => {
      expect(health.usable_capacity_now).toBeLessThanOrEqual(health.usable_capacity_new);
    });

    it('should have non-negative current_stored_energy', () => {
      expect(isNonNegative(health.current_stored_energy)).toBe(true);
    });

    it('should have positive efficiency', () => {
      expect(isPositive(health.efficiency)).toBe(true);
    });
  });

  describe('Charging Stats', () => {
    const stats = loadCarDataOrThrow<ChargingStats>(CAR_ID, 'battery/charging-stats.json');

    it('should have non-negative total_charges', () => {
      expect(isNonNegative(stats.total_charges)).toBe(true);
    });

    it('should have non-negative total_energy_added', () => {
      expect(isNonNegative(stats.total_energy_added)).toBe(true);
    });
  });

  describe('Drive Stats', () => {
    const stats = loadCarDataOrThrow<DriveStats>(CAR_ID, 'battery/drive-stats.json');

    it('should have non-negative logged_distance', () => {
      expect(isNonNegative(stats.logged_distance)).toBe(true);
    });

    it('should have non-negative odometer', () => {
      expect(isNonNegative(stats.odometer)).toBe(true);
    });

    it('should have logged_distance <= odometer', () => {
      expect(stats.logged_distance).toBeLessThanOrEqual(stats.odometer);
    });
  });
});
