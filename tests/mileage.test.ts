import { describe, it, expect } from 'vitest';
import { loadCarDataOrThrow } from './helpers/data-loader';
import { isNonNegative, isPositive, isValidTimestamp } from './helpers/validators';

interface MileageStats {
  current_odometer: number;
  total_logged: number;
  avg_daily: number;
  avg_monthly: number;
}

interface DailyMileage {
  date: number;
  odometer: number;
  daily_distance: number;
}

const CAR_ID = 1;

describe('Mileage', () => {
  describe('Stats', () => {
    const stats = loadCarDataOrThrow<MileageStats>(CAR_ID, 'mileage/stats.json');

    it('should have positive current_odometer', () => {
      expect(isPositive(stats.current_odometer)).toBe(true);
    });

    it('should have non-negative total_logged', () => {
      expect(isNonNegative(stats.total_logged)).toBe(true);
    });

    it('should have non-negative avg_daily', () => {
      expect(isNonNegative(stats.avg_daily)).toBe(true);
    });

    it('should have non-negative avg_monthly', () => {
      expect(isNonNegative(stats.avg_monthly)).toBe(true);
    });

    it('should have total_logged <= current_odometer', () => {
      expect(stats.total_logged).toBeLessThanOrEqual(stats.current_odometer);
    });

    it('should have reasonable avg_daily (< 1000 km)', () => {
      expect(stats.avg_daily).toBeLessThan(1000);
    });

    it('should have avg_monthly approximately 30x avg_daily', () => {
      const ratio = stats.avg_monthly / stats.avg_daily;
      expect(ratio).toBeGreaterThan(25);
      expect(ratio).toBeLessThan(35);
    });
  });

  describe('Daily', () => {
    const daily = loadCarDataOrThrow<DailyMileage[]>(CAR_ID, 'mileage/daily.json');

    it('should be an array', () => {
      expect(Array.isArray(daily)).toBe(true);
    });

    it('should have valid date timestamps', () => {
      daily.forEach((entry, index) => {
        expect(
          isValidTimestamp(entry.date),
          `Invalid date at index ${index}`
        ).toBe(true);
      });
    });

    it('should have non-negative daily_distance', () => {
      daily.forEach((entry, index) => {
        expect(
          isNonNegative(entry.daily_distance),
          `Invalid daily_distance at index ${index}`
        ).toBe(true);
      });
    });

    it('should have positive odometer', () => {
      daily.forEach((entry, index) => {
        expect(
          isPositive(entry.odometer),
          `Invalid odometer at index ${index}`
        ).toBe(true);
      });
    });
  });
});
