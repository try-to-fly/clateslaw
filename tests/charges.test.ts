import { describe, it, expect } from 'vitest';
import { loadCarDataOrThrow } from './helpers/data-loader';
import {
  isValidTimestamp,
  isNonNegative,
  isPercentage,
  hasUniqueIds,
  hasRequiredFields,
} from './helpers/validators';

interface ChargeRecord {
  id: number;
  start_date: number;
  end_date: number;
  charge_energy_added: number;
  charge_energy_used: number | null;
  start_battery_level: number;
  end_battery_level: number;
  duration_min: number;
  cost: number | null;
  location: string | null;
}

const CAR_ID = 1;
const REQUIRED_FIELDS: (keyof ChargeRecord)[] = [
  'id',
  'start_date',
  'end_date',
  'charge_energy_added',
  'start_battery_level',
  'end_battery_level',
  'duration_min',
];

describe('Charges', () => {
  const records = loadCarDataOrThrow<ChargeRecord[]>(CAR_ID, 'charges/records.json');

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

    it('should have non-negative charge_energy_added', () => {
      records.forEach((record) => {
        expect(
          isNonNegative(record.charge_energy_added),
          `Negative charge_energy_added for record ${record.id}`
        ).toBe(true);
      });
    });

    it('should have start_battery_level in 0-100', () => {
      records.forEach((record) => {
        expect(
          isPercentage(record.start_battery_level),
          `Invalid start_battery_level for record ${record.id}`
        ).toBe(true);
      });
    });

    it('should have end_battery_level in 0-100', () => {
      records.forEach((record) => {
        expect(
          isPercentage(record.end_battery_level),
          `Invalid end_battery_level for record ${record.id}`
        ).toBe(true);
      });
    });

    it('should have start_battery_level <= end_battery_level', () => {
      records.forEach((record) => {
        expect(
          record.start_battery_level <= record.end_battery_level,
          `start_battery_level > end_battery_level for record ${record.id}`
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
  });

  describe('Data quality', () => {
    it('should not have excessive null charge_energy_used values', () => {
      const nullCount = records.filter((r) => r.charge_energy_used === null).length;
      const nullPercentage = (nullCount / records.length) * 100;
      expect(nullPercentage).toBeLessThan(10);
    });
  });
});
