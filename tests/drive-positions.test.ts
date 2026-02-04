import { describe, it, expect } from 'vitest';
import { loadCarDataOrThrow, listCarDataFiles } from './helpers/data-loader';
import {
  isValidTimestamp,
  isValidLatitude,
  isValidLongitude,
  isPercentage,
  isNonNegative,
  isInRange,
  isSortedAscending,
} from './helpers/validators';

interface PositionPoint {
  latitude: number;
  longitude: number;
  date: number;
  battery_level: number;
  speed: number;
  power: number;
  odometer: number;
}

const CAR_ID = 1;
const MAX_SPEED_KMH = 300;

describe('Drive Positions', () => {
  const positionFiles = listCarDataFiles(CAR_ID, 'drives/positions');

  it('should have position files', () => {
    expect(positionFiles.length).toBeGreaterThan(0);
  });

  positionFiles.forEach((file) => {
    const driveId = file.replace('.json', '');

    describe(`Drive ${driveId}`, () => {
      const positions = loadCarDataOrThrow<PositionPoint[]>(
        CAR_ID,
        `drives/positions/${file}`
      );

      it('should be an array', () => {
        expect(Array.isArray(positions)).toBe(true);
      });

      it('should have at least one position', () => {
        expect(positions.length).toBeGreaterThan(0);
      });

      it('should have valid latitudes', () => {
        positions.forEach((pos, index) => {
          expect(
            isValidLatitude(pos.latitude),
            `Invalid latitude at index ${index}: ${pos.latitude}`
          ).toBe(true);
        });
      });

      it('should have valid longitudes', () => {
        positions.forEach((pos, index) => {
          expect(
            isValidLongitude(pos.longitude),
            `Invalid longitude at index ${index}: ${pos.longitude}`
          ).toBe(true);
        });
      });

      it('should have valid timestamps', () => {
        positions.forEach((pos, index) => {
          expect(
            isValidTimestamp(pos.date),
            `Invalid timestamp at index ${index}: ${pos.date}`
          ).toBe(true);
        });
      });

      it('should have battery_level in 0-100%', () => {
        positions.forEach((pos, index) => {
          expect(
            isPercentage(pos.battery_level),
            `Invalid battery_level at index ${index}: ${pos.battery_level}`
          ).toBe(true);
        });
      });

      it('should have non-negative speed', () => {
        positions.forEach((pos, index) => {
          expect(
            isNonNegative(pos.speed),
            `Negative speed at index ${index}: ${pos.speed}`
          ).toBe(true);
        });
      });

      it('should have reasonable speed (< 300 km/h)', () => {
        positions.forEach((pos, index) => {
          expect(
            isInRange(pos.speed, 0, MAX_SPEED_KMH),
            `Unreasonable speed at index ${index}: ${pos.speed}`
          ).toBe(true);
        });
      });

      it('should have non-negative odometer', () => {
        positions.forEach((pos, index) => {
          expect(
            isNonNegative(pos.odometer),
            `Negative odometer at index ${index}: ${pos.odometer}`
          ).toBe(true);
        });
      });

      it('should have timestamps in ascending order', () => {
        expect(
          isSortedAscending(positions, 'date'),
          'Timestamps are not in ascending order'
        ).toBe(true);
      });
    });
  });
});
