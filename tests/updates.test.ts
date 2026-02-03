import { describe, it, expect } from 'vitest';
import { loadCarDataOrThrow } from './helpers/data-loader';
import { isValidTimestamp, isNonNegative, hasUniqueIds } from './helpers/validators';

interface UpdateRecord {
  id: number;
  version: string;
  start_date: number;
  end_date: number;
  duration_min: number;
}

interface UpdateStats {
  total_updates: number;
  median_interval_days: number;
  current_version: string;
}

const CAR_ID = 1;

describe('Updates', () => {
  describe('Records', () => {
    const records = loadCarDataOrThrow<UpdateRecord[]>(CAR_ID, 'updates/records.json');

    it('should be an array', () => {
      expect(Array.isArray(records)).toBe(true);
    });

    it('should have unique IDs', () => {
      expect(hasUniqueIds(records)).toBe(true);
    });

    it('should have valid version strings', () => {
      records.forEach((record) => {
        expect(typeof record.version).toBe('string');
        expect(record.version.length).toBeGreaterThan(0);
      });
    });

    it('should have valid start_date timestamps', () => {
      records.forEach((record) => {
        expect(
          isValidTimestamp(record.start_date),
          `Invalid start_date for record ${record.id}`
        ).toBe(true);
      });
    });

    it('should have valid end_date timestamps', () => {
      records.forEach((record) => {
        expect(
          isValidTimestamp(record.end_date),
          `Invalid end_date for record ${record.id}`
        ).toBe(true);
      });
    });

    it('should have start_date <= end_date', () => {
      records.forEach((record) => {
        expect(
          record.start_date <= record.end_date,
          `start_date > end_date for record ${record.id}`
        ).toBe(true);
      });
    });

    it('should have non-negative duration_min', () => {
      records.forEach((record) => {
        expect(
          isNonNegative(record.duration_min),
          `Negative duration_min for record ${record.id}`
        ).toBe(true);
      });
    });

    it('should have reasonable duration_min (< 120 min)', () => {
      records.forEach((record) => {
        expect(
          record.duration_min < 120,
          `Unreasonable duration_min ${record.duration_min} for record ${record.id}`
        ).toBe(true);
      });
    });
  });

  describe('Stats', () => {
    const stats = loadCarDataOrThrow<UpdateStats>(CAR_ID, 'updates/stats.json');

    it('should have non-negative total_updates', () => {
      expect(isNonNegative(stats.total_updates)).toBe(true);
    });

    it('should have non-negative median_interval_days', () => {
      expect(isNonNegative(stats.median_interval_days)).toBe(true);
    });

    it('should have valid current_version', () => {
      expect(typeof stats.current_version).toBe('string');
      expect(stats.current_version.length).toBeGreaterThan(0);
    });
  });
});
