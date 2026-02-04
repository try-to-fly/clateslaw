import { describe, it, expect } from 'vitest';
import { loadCarDataOrThrow, listCarDataFiles } from './helpers/data-loader';
import {
  isValidTimestamp,
  isPercentage,
  isNonNegative,
  isPositive,
  isInRange,
  isSortedAscending,
  isNonDecreasing,
} from './helpers/validators';

interface ChargeCurvePoint {
  date: number;
  battery_level: number;
  usable_battery_level: number;
  charger_power: number;
  charger_voltage: number;
  charger_actual_current: number;
  charge_energy_added: number;
  rated_battery_range_km: number;
}

const CAR_ID = 1;
const MAX_CHARGER_POWER_KW = 500;
const MAX_CHARGER_VOLTAGE = 1000;

describe('Charge Curves', () => {
  const curveFiles = listCarDataFiles(CAR_ID, 'charges/curves');

  it('should have curve files', () => {
    expect(curveFiles.length).toBeGreaterThan(0);
  });

  curveFiles.forEach((file) => {
    const chargeId = file.replace('.json', '');

    describe(`Charge ${chargeId}`, () => {
      const curve = loadCarDataOrThrow<ChargeCurvePoint[]>(
        CAR_ID,
        `charges/curves/${file}`
      );

      it('should be an array', () => {
        expect(Array.isArray(curve)).toBe(true);
      });

      it('should have at least one point', () => {
        expect(curve.length).toBeGreaterThan(0);
      });

      it('should have valid timestamps', () => {
        curve.forEach((point, index) => {
          expect(
            isValidTimestamp(point.date),
            `Invalid timestamp at index ${index}: ${point.date}`
          ).toBe(true);
        });
      });

      it('should have battery_level in 0-100%', () => {
        curve.forEach((point, index) => {
          expect(
            isPercentage(point.battery_level),
            `Invalid battery_level at index ${index}: ${point.battery_level}`
          ).toBe(true);
        });
      });

      it('should have usable_battery_level in 0-100%', () => {
        curve.forEach((point, index) => {
          expect(
            isPercentage(point.usable_battery_level),
            `Invalid usable_battery_level at index ${index}`
          ).toBe(true);
        });
      });

      it('should have usable_battery_level <= battery_level', () => {
        curve.forEach((point, index) => {
          expect(
            point.usable_battery_level <= point.battery_level,
            `usable > battery at index ${index}`
          ).toBe(true);
        });
      });

      it('should have non-negative charger_power', () => {
        curve.forEach((point, index) => {
          expect(
            isNonNegative(point.charger_power),
            `Negative charger_power at index ${index}`
          ).toBe(true);
        });
      });

      it('should have reasonable charger_power (< 500 kW)', () => {
        curve.forEach((point, index) => {
          expect(
            isInRange(point.charger_power, 0, MAX_CHARGER_POWER_KW),
            `Unreasonable charger_power at index ${index}`
          ).toBe(true);
        });
      });

      it('should have reasonable charger_voltage (0-1000 V)', () => {
        curve.forEach((point, index) => {
          expect(
            isInRange(point.charger_voltage, 0, MAX_CHARGER_VOLTAGE),
            `Unreasonable charger_voltage at index ${index}`
          ).toBe(true);
        });
      });

      it('should have non-negative charger_actual_current', () => {
        curve.forEach((point, index) => {
          expect(
            isNonNegative(point.charger_actual_current),
            `Negative charger_actual_current at index ${index}`
          ).toBe(true);
        });
      });

      it('should have non-negative charge_energy_added', () => {
        curve.forEach((point, index) => {
          expect(
            isNonNegative(point.charge_energy_added),
            `Negative charge_energy_added at index ${index}`
          ).toBe(true);
        });
      });

      it('should have charge_energy_added non-decreasing', () => {
        expect(
          isNonDecreasing(curve, 'charge_energy_added'),
          'charge_energy_added is not non-decreasing'
        ).toBe(true);
      });

      it('should have positive rated_battery_range_km', () => {
        curve.forEach((point, index) => {
          expect(
            isPositive(point.rated_battery_range_km),
            `Non-positive rated_battery_range_km at index ${index}`
          ).toBe(true);
        });
      });

      it('should have timestamps in ascending order', () => {
        expect(
          isSortedAscending(curve, 'date'),
          'Timestamps are not in ascending order'
        ).toBe(true);
      });
    });
  });
});