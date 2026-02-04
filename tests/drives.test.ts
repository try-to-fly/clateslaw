import { describe, it, expect } from 'vitest';
import { loadCarDataOrThrow } from './helpers/data-loader';
import {
  isValidTimestamp,
  isNonNegative,
  hasUniqueIds,
  hasRequiredFields,
} from './helpers/validators';

interface DriveRecord {
  id: number;
  start_date: number;
  end_date: number;
  distance: number;
  duration_min: number;
  speed_max: number;
  power_max: number;
  outside_temp_avg: number;
  start_location: string | null;
  end_location: string | null;
  ascent: number | null;
  descent: number | null;
}

const CAR_ID = 1;
const REQUIRED_FIELDS: (keyof DriveRecord)[] = [
  'id',
  'start_date',
  'end_date',
  'distance',
  'duration_min',
  'speed_max',
  'power_max',
];

describe('Drives', () => {
  const records = loadCarDataOrThrow<DriveRecord[]>(CAR_ID, 'drives/records.json');

  it('should be an array', () => {
    expect(Array.isArray(records)).toBe(true);
  });

  it('should have unique IDs', () => {
    expect(hasUniqueIds(records)).toBe(true);
  });

  describe('Record validation', () => {
    it('should have all required fields', () => {
      records.forEach((record, index) => {
        expect(
          hasRequiredFields(record, REQUIRED_FIELDS),
          `Record at index ${index} missing required fields`
        ).toBe(true);
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

    it('should have non-negative distance', () => {
      records.forEach((record) => {
        expect(
          isNonNegative(record.distance),
          `Negative distance for record ${record.id}`
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

    it('should have non-negative speed_max', () => {
      records.forEach((record) => {
        expect(
          isNonNegative(record.speed_max),
          `Negative speed_max for record ${record.id}`
        ).toBe(true);
      });
    });

    it('should have non-negative power_max', () => {
      records.forEach((record) => {
        expect(
          isNonNegative(record.power_max),
          `Negative power_max for record ${record.id}`
        ).toBe(true);
      });
    });

    it('should have reasonable speed_max (< 300 km/h)', () => {
      records.forEach((record) => {
        expect(
          record.speed_max < 300,
          `Unreasonable speed_max ${record.speed_max} for record ${record.id}`
        ).toBe(true);
      });
    });

    it('should have valid ascent/descent values when present', () => {
      records.forEach((record) => {
        if (record.ascent !== null && record.ascent !== undefined) {
          expect(
            isNonNegative(record.ascent),
            `Negative ascent for record ${record.id}`
          ).toBe(true);
        }
        if (record.descent !== null && record.descent !== undefined) {
          expect(
            isNonNegative(record.descent),
            `Negative descent for record ${record.id}`
          ).toBe(true);
        }
      });
    });
  });
});
