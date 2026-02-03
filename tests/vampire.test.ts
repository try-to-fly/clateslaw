import { describe, it, expect } from 'vitest';
import { loadCarDataOrThrow } from './helpers/data-loader';
import { isNonNegative, isValidTimestamp } from './helpers/validators';

interface VampireStats {
  total_records: number;
  total_energy_drained: number;
  avg_range_loss_per_hour: number;
  avg_standby_percent: number;
}

interface VampireRecord {
  start_date: number;
  end_date: number;
  duration_sec: number;
  soc_diff: number;
  range_loss: number;
  energy_drained: number;
  avg_power: number;
  range_loss_per_hour: number;
}

const CAR_ID = 1;

describe('Vampire (Standby Drain)', () => {
  describe('Stats', () => {
    const stats = loadCarDataOrThrow<VampireStats>(CAR_ID, 'vampire/stats.json');

    it('should have non-negative total_records', () => {
      expect(isNonNegative(stats.total_records)).toBe(true);
    });

    it('should have non-negative total_energy_drained', () => {
      expect(isNonNegative(stats.total_energy_drained)).toBe(true);
    });

    it('should have non-negative avg_range_loss_per_hour', () => {
      expect(isNonNegative(stats.avg_range_loss_per_hour)).toBe(true);
    });

    it('should have non-negative avg_standby_percent', () => {
      expect(isNonNegative(stats.avg_standby_percent)).toBe(true);
    });

    it('should have reasonable avg_range_loss_per_hour (< 10 km/h)', () => {
      expect(stats.avg_range_loss_per_hour).toBeLessThan(10);
    });
  });

  describe('Records', () => {
    const records = loadCarDataOrThrow<VampireRecord[]>(CAR_ID, 'vampire/records.json');

    it('should be an array', () => {
      expect(Array.isArray(records)).toBe(true);
    });

    it('should have valid start_date timestamps', () => {
      records.forEach((record, index) => {
        expect(
          isValidTimestamp(record.start_date),
          `Invalid start_date at index ${index}`
        ).toBe(true);
      });
    });

    it('should have valid end_date timestamps', () => {
      records.forEach((record, index) => {
        expect(
          isValidTimestamp(record.end_date),
          `Invalid end_date at index ${index}`
        ).toBe(true);
      });
    });

    it('should have start_date <= end_date', () => {
      records.forEach((record, index) => {
        expect(
          record.start_date <= record.end_date,
          `start_date > end_date at index ${index}`
        ).toBe(true);
      });
    });

    it('should have non-negative duration_sec', () => {
      records.forEach((record, index) => {
        expect(
          isNonNegative(record.duration_sec),
          `Negative duration_sec at index ${index}`
        ).toBe(true);
      });
    });

    it('should have non-negative energy_drained', () => {
      records.forEach((record, index) => {
        expect(
          isNonNegative(record.energy_drained),
          `Negative energy_drained at index ${index}`
        ).toBe(true);
      });
    });

    it('should have non-negative range_loss_per_hour', () => {
      records.forEach((record, index) => {
        expect(
          isNonNegative(record.range_loss_per_hour),
          `Negative range_loss_per_hour at index ${index}`
        ).toBe(true);
      });
    });
  });
});
