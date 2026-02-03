import { describe, it, expect } from 'vitest';
import { loadCarDataOrThrow } from './helpers/data-loader';
import { isNonNegative, isPercentage, isValidTimestamp } from './helpers/validators';

interface StateStats {
  state: string;
  count: number;
  total_duration_min: number;
  percentage: number;
}

interface CurrentState {
  state: string;
  start_date: number;
}

interface StateRecord {
  id: number;
  state: string;
  start_date: number;
  end_date: number | null;
  duration_min: number;
}

const CAR_ID = 1;
const VALID_STATES = ['online', 'offline', 'asleep', 'charging', 'driving'];

describe('States', () => {
  describe('Stats', () => {
    const stats = loadCarDataOrThrow<StateStats[]>(CAR_ID, 'states/stats.json');

    it('should be an array', () => {
      expect(Array.isArray(stats)).toBe(true);
    });

    it('should have valid state names', () => {
      stats.forEach((entry) => {
        expect(VALID_STATES).toContain(entry.state);
      });
    });

    it('should have non-negative count', () => {
      stats.forEach((entry) => {
        expect(isNonNegative(entry.count)).toBe(true);
      });
    });

    it('should have non-negative total_duration_min', () => {
      stats.forEach((entry) => {
        expect(isNonNegative(entry.total_duration_min)).toBe(true);
      });
    });

    it('should have percentage in 0-100', () => {
      stats.forEach((entry) => {
        expect(isPercentage(entry.percentage)).toBe(true);
      });
    });

    it('should have percentages summing to approximately 100', () => {
      const totalPercentage = stats.reduce((sum, entry) => sum + entry.percentage, 0);
      expect(totalPercentage).toBeGreaterThan(99);
      expect(totalPercentage).toBeLessThan(101);
    });
  });

  describe('Current', () => {
    const current = loadCarDataOrThrow<CurrentState>(CAR_ID, 'states/current.json');

    it('should have valid state', () => {
      expect(VALID_STATES).toContain(current.state);
    });

    it('should have valid start_date timestamp', () => {
      expect(isValidTimestamp(current.start_date)).toBe(true);
    });
  });

  describe('Records', () => {
    const records = loadCarDataOrThrow<StateRecord[]>(CAR_ID, 'states/records.json');

    it('should be an array', () => {
      expect(Array.isArray(records)).toBe(true);
    });

    it('should have valid state names', () => {
      records.forEach((record) => {
        expect(VALID_STATES).toContain(record.state);
      });
    });

    it('should have non-negative duration_min', () => {
      records.forEach((record) => {
        expect(isNonNegative(record.duration_min)).toBe(true);
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

    it('should have start_date <= end_date (when end_date is not null)', () => {
      records
        .filter((r) => r.end_date !== null)
        .forEach((record) => {
          expect(
            record.start_date <= record.end_date!,
            `start_date > end_date for record ${record.id}`
          ).toBe(true);
        });
    });
  });
});
