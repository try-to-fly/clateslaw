import { describe, it, expect } from 'vitest';
import { loadCarDataOrThrow } from './helpers/data-loader';
import {
  isValidTimestamp,
  isNonNegative,
  isPercentage,
} from './helpers/validators';

interface TimelineEvent {
  action: string;
  start_date: number;
  end_date: number;
  start_address: string | null;
  end_address: string | null;
  duration_min: number;
  soc_start: number;
  soc_end: number;
  soc_diff: number;
  energy_kwh: number;
  distance: number;
  odometer: number;
}

const CAR_ID = 1;
const VALID_ACTIONS = ['Drive', 'Charge', 'Update', 'Sleep', 'Online', 'Offline'];

describe('Timeline', () => {
  const events = loadCarDataOrThrow<TimelineEvent[]>(CAR_ID, 'timeline/events.json');

  it('should be an array', () => {
    expect(Array.isArray(events)).toBe(true);
  });

  describe('Event validation', () => {
    it('should have valid action types', () => {
      events.forEach((event, index) => {
        expect(
          VALID_ACTIONS,
          `Invalid action "${event.action}" at index ${index}`
        ).toContain(event.action);
      });
    });

    it('should have valid start_date timestamps', () => {
      events.forEach((event, index) => {
        expect(
          isValidTimestamp(event.start_date),
          `Invalid start_date at index ${index}`
        ).toBe(true);
      });
    });

    it('should have valid end_date timestamps', () => {
      events.forEach((event, index) => {
        expect(
          isValidTimestamp(event.end_date),
          `Invalid end_date at index ${index}`
        ).toBe(true);
      });
    });

    it('should have start_date <= end_date', () => {
      events.forEach((event, index) => {
        expect(
          event.start_date <= event.end_date,
          `start_date > end_date at index ${index}`
        ).toBe(true);
      });
    });

    it('should have non-negative duration_min', () => {
      events.forEach((event, index) => {
        expect(
          isNonNegative(event.duration_min),
          `Negative duration_min at index ${index}`
        ).toBe(true);
      });
    });

    it('should have soc_start in 0-100', () => {
      events.forEach((event, index) => {
        expect(
          isPercentage(event.soc_start),
          `Invalid soc_start at index ${index}`
        ).toBe(true);
      });
    });

    it('should have soc_end in 0-100', () => {
      events.forEach((event, index) => {
        expect(
          isPercentage(event.soc_end),
          `Invalid soc_end at index ${index}`
        ).toBe(true);
      });
    });

    it('should have non-negative distance', () => {
      events.forEach((event, index) => {
        expect(
          isNonNegative(event.distance),
          `Negative distance at index ${index}`
        ).toBe(true);
      });
    });

    it('should have non-negative odometer', () => {
      events.forEach((event, index) => {
        expect(
          isNonNegative(event.odometer),
          `Negative odometer at index ${index}`
        ).toBe(true);
      });
    });
  });

  describe('Logical consistency', () => {
    it('should have soc_diff = soc_end - soc_start', () => {
      events.forEach((event, index) => {
        const expectedDiff = event.soc_end - event.soc_start;
        expect(
          event.soc_diff,
          `soc_diff mismatch at index ${index}`
        ).toBe(expectedDiff);
      });
    });

    it('Charge events should have soc_diff >= 0', () => {
      events
        .filter((e) => e.action === 'Charge')
        .forEach((event, index) => {
          expect(
            event.soc_diff >= 0,
            `Charge event at index ${index} has negative soc_diff`
          ).toBe(true);
        });
    });

    it('Charge events should have non-negative energy_kwh', () => {
      events
        .filter((e) => e.action === 'Charge')
        .forEach((event, index) => {
          expect(
            isNonNegative(event.energy_kwh),
            `Charge event at index ${index} has negative energy_kwh`
          ).toBe(true);
        });
    });
  });

  describe('Data quality warnings', () => {
    it('should report Drive events with positive soc_diff (regeneration anomaly)', () => {
      const anomalies = events
        .filter((e) => e.action === 'Drive' && e.soc_diff > 0)
        .map((e, i) => ({ index: i, soc_diff: e.soc_diff }));

      if (anomalies.length > 0) {
        console.warn(`Found ${anomalies.length} Drive events with positive soc_diff (possible regeneration or data anomaly)`);
      }
      // This is a warning, not a failure - some regeneration is possible
      expect(true).toBe(true);
    });

    it('should report events with negative energy_kwh', () => {
      const anomalies = events
        .filter((e) => e.energy_kwh < 0)
        .map((e, i) => ({ index: i, action: e.action, energy_kwh: e.energy_kwh }));

      if (anomalies.length > 0) {
        console.warn(`Found ${anomalies.length} events with negative energy_kwh`);
      }
      // This is a warning, not a failure
      expect(true).toBe(true);
    });
  });
});
