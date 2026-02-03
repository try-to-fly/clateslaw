import { describe, it, expect } from 'vitest';
import { loadCarDataOrThrow } from './helpers/data-loader';
import { isNonNegative, isInRange } from './helpers/validators';

interface ChargingStats {
  total_charges: number;
  total_energy_added: number;
  total_energy_used: number;
  total_cost: number;
  suc_cost: number;
  avg_cost_per_kwh: number;
  charging_efficiency: number;
}

interface DrivingStats {
  total_drives: number;
  total_distance: number;
  total_energy_consumed: number;
  median_distance: number;
  avg_speed: number;
  max_speed: number;
  total_duration_min: number;
}

interface PeriodStats {
  period: string;
  drives: number;
  distance: number;
  energy_consumed: number;
  charges: number;
  energy_added: number;
  cost: number;
}

const CAR_ID = 1;

describe('Stats', () => {
  describe('Charging Stats', () => {
    const stats = loadCarDataOrThrow<ChargingStats>(CAR_ID, 'stats/charging.json');

    it('should have non-negative total_charges', () => {
      expect(isNonNegative(stats.total_charges)).toBe(true);
    });

    it('should have non-negative total_energy_added', () => {
      expect(isNonNegative(stats.total_energy_added)).toBe(true);
    });

    it('should have non-negative total_energy_used', () => {
      expect(isNonNegative(stats.total_energy_used)).toBe(true);
    });

    it('should have non-negative total_cost', () => {
      expect(isNonNegative(stats.total_cost)).toBe(true);
    });

    it('should have charging_efficiency in 0-1', () => {
      expect(isInRange(stats.charging_efficiency, 0, 1)).toBe(true);
    });

    it('should have total_energy_added <= total_energy_used', () => {
      expect(stats.total_energy_added).toBeLessThanOrEqual(stats.total_energy_used);
    });
  });

  describe('Driving Stats', () => {
    const stats = loadCarDataOrThrow<DrivingStats>(CAR_ID, 'stats/driving.json');

    it('should have non-negative total_drives', () => {
      expect(isNonNegative(stats.total_drives)).toBe(true);
    });

    it('should have non-negative total_distance', () => {
      expect(isNonNegative(stats.total_distance)).toBe(true);
    });

    it('should have non-negative total_energy_consumed', () => {
      expect(isNonNegative(stats.total_energy_consumed)).toBe(true);
    });

    it('should have non-negative median_distance', () => {
      expect(isNonNegative(stats.median_distance)).toBe(true);
    });

    it('should have non-negative avg_speed', () => {
      expect(isNonNegative(stats.avg_speed)).toBe(true);
    });

    it('should have non-negative max_speed', () => {
      expect(isNonNegative(stats.max_speed)).toBe(true);
    });

    it('should have non-negative total_duration_min', () => {
      expect(isNonNegative(stats.total_duration_min)).toBe(true);
    });

    it('should have reasonable avg_speed (< 200 km/h)', () => {
      expect(stats.avg_speed).toBeLessThan(200);
    });
  });

  describe('Period Stats', () => {
    const stats = loadCarDataOrThrow<PeriodStats[]>(CAR_ID, 'stats/period.json');

    it('should be an array', () => {
      expect(Array.isArray(stats)).toBe(true);
    });

    it('should have valid period entries', () => {
      stats.forEach((entry, index) => {
        expect(typeof entry.period).toBe('string');
        expect(isNonNegative(entry.distance), `Invalid distance at index ${index}`).toBe(true);
        expect(isNonNegative(entry.energy_consumed), `Invalid energy_consumed at index ${index}`).toBe(true);
        expect(isNonNegative(entry.charges), `Invalid charges at index ${index}`).toBe(true);
        expect(isNonNegative(entry.drives), `Invalid drives at index ${index}`).toBe(true);
      });
    });
  });
});
