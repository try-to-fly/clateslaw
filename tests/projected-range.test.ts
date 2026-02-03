import { describe, it, expect } from 'vitest';
import { loadCarDataOrThrow } from './helpers/data-loader';
import { isNonNegative, isPositive, isValidTimestamp } from './helpers/validators';

interface ProjectedRangeStats {
  projected_range: number;
  avg_battery_level: number;
  avg_usable_battery_level: number;
  current_odometer: number;
}

interface ProjectedRangeHistory {
  date: number;
  projected_range: number;
  odometer: number;
}

const CAR_ID = 1;

describe('Projected Range', () => {
  describe('Stats', () => {
    const stats = loadCarDataOrThrow<ProjectedRangeStats>(CAR_ID, 'projected-range/stats.json');

    it('should have positive projected_range', () => {
      expect(isPositive(stats.projected_range)).toBe(true);
    });

    it('should have avg_battery_level in 0-100', () => {
      expect(stats.avg_battery_level).toBeGreaterThanOrEqual(0);
      expect(stats.avg_battery_level).toBeLessThanOrEqual(100);
    });

    it('should have avg_usable_battery_level in 0-100', () => {
      expect(stats.avg_usable_battery_level).toBeGreaterThanOrEqual(0);
      expect(stats.avg_usable_battery_level).toBeLessThanOrEqual(100);
    });

    it('should have positive current_odometer', () => {
      expect(isPositive(stats.current_odometer)).toBe(true);
    });

    it('should have reasonable projected_range (100-800 km)', () => {
      expect(stats.projected_range).toBeGreaterThan(100);
      expect(stats.projected_range).toBeLessThan(800);
    });

    it('should have avg_usable_battery_level <= avg_battery_level', () => {
      expect(stats.avg_usable_battery_level).toBeLessThanOrEqual(stats.avg_battery_level);
    });
  });

  describe('History', () => {
    const history = loadCarDataOrThrow<ProjectedRangeHistory[]>(
      CAR_ID,
      'projected-range/history.json'
    );

    it('should be an array', () => {
      expect(Array.isArray(history)).toBe(true);
    });

    it('should have valid date timestamps', () => {
      history.forEach((entry, index) => {
        expect(
          isValidTimestamp(entry.date),
          `Invalid date at index ${index}`
        ).toBe(true);
      });
    });

    it('should have positive projected_range', () => {
      history.forEach((entry, index) => {
        expect(
          isPositive(entry.projected_range),
          `Invalid projected_range at index ${index}`
        ).toBe(true);
      });
    });

    it('should have positive odometer', () => {
      history.forEach((entry, index) => {
        expect(
          isPositive(entry.odometer),
          `Invalid odometer at index ${index}`
        ).toBe(true);
      });
    });
  });
});
