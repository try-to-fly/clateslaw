import { describe, it, expect } from 'vitest';
import { loadCarDataOrThrow } from './helpers/data-loader';
import { isNonNegative, isPositive } from './helpers/validators';

interface EfficiencySummary {
  net_consumption_wh_per_km: number;
  gross_consumption_wh_per_km: number;
  total_distance: number;
}

interface EfficiencyByTemperature {
  temperature: number;
  avg_distance: number;
  efficiency_ratio: number;
}

const CAR_ID = 1;

describe('Efficiency', () => {
  describe('Summary', () => {
    const summary = loadCarDataOrThrow<EfficiencySummary>(CAR_ID, 'efficiency/summary.json');

    it('should have positive net_consumption_wh_per_km', () => {
      expect(isPositive(summary.net_consumption_wh_per_km)).toBe(true);
    });

    it('should have positive gross_consumption_wh_per_km', () => {
      expect(isPositive(summary.gross_consumption_wh_per_km)).toBe(true);
    });

    it('should have non-negative total_distance', () => {
      expect(isNonNegative(summary.total_distance)).toBe(true);
    });

    it('should have reasonable consumption (50-500 Wh/km)', () => {
      expect(summary.net_consumption_wh_per_km).toBeGreaterThan(50);
      expect(summary.net_consumption_wh_per_km).toBeLessThan(500);
    });
  });

  describe('By Temperature', () => {
    const data = loadCarDataOrThrow<EfficiencyByTemperature[]>(
      CAR_ID,
      'efficiency/by-temperature.json'
    );

    it('should be an array', () => {
      expect(Array.isArray(data)).toBe(true);
    });

    it('should have valid temperature entries', () => {
      data.forEach((entry, index) => {
        expect(typeof entry.temperature).toBe('number');
        expect(entry.temperature).toBeGreaterThanOrEqual(-50);
        expect(entry.temperature).toBeLessThanOrEqual(60);
      });
    });

    it('should have positive efficiency_ratio', () => {
      data.forEach((entry, index) => {
        expect(
          isPositive(entry.efficiency_ratio),
          `Invalid efficiency_ratio at index ${index}`
        ).toBe(true);
      });
    });

    it('should have non-negative avg_distance', () => {
      data.forEach((entry, index) => {
        expect(
          isNonNegative(entry.avg_distance),
          `Invalid avg_distance at index ${index}`
        ).toBe(true);
      });
    });
  });
});
