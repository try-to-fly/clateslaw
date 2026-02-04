import { describe, it, expect } from 'vitest';
import { loadCarDataOrThrow } from './helpers/data-loader';
import {
  isValidTimestamp,
  isValidTirePressure,
  isValidTemperature,
} from './helpers/validators';

interface TpmsLatest {
  date: number;
  fl: number;
  fr: number;
  rl: number;
  rr: number;
  outside_temp: number;
}

interface TpmsStats {
  latest: TpmsLatest;
  avg: {
    fl: number;
    fr: number;
    rl: number;
    rr: number;
  };
  hasAlert: boolean;
  alertMessage: string | null;
}

const CAR_ID = 1;
const MAX_PRESSURE_DIFF = 0.5;

describe('TPMS', () => {
  describe('Latest', () => {
    const latest = loadCarDataOrThrow<TpmsLatest>(CAR_ID, 'tpms/latest.json');

    it('should have valid timestamp', () => {
      expect(isValidTimestamp(latest.date), 'Invalid timestamp').toBe(true);
    });

    it('should have valid front-left tire pressure', () => {
      expect(
        isValidTirePressure(latest.fl),
        `Invalid FL pressure: ${latest.fl}`
      ).toBe(true);
    });

    it('should have valid front-right tire pressure', () => {
      expect(
        isValidTirePressure(latest.fr),
        `Invalid FR pressure: ${latest.fr}`
      ).toBe(true);
    });

    it('should have valid rear-left tire pressure', () => {
      expect(
        isValidTirePressure(latest.rl),
        `Invalid RL pressure: ${latest.rl}`
      ).toBe(true);
    });

    it('should have valid rear-right tire pressure', () => {
      expect(
        isValidTirePressure(latest.rr),
        `Invalid RR pressure: ${latest.rr}`
      ).toBe(true);
    });

    it('should have tire pressure differences within acceptable range', () => {
      const pressures = [latest.fl, latest.fr, latest.rl, latest.rr];
      const maxPressure = Math.max(...pressures);
      const minPressure = Math.min(...pressures);
      const diff = maxPressure - minPressure;
      expect(
        diff <= MAX_PRESSURE_DIFF,
        `Pressure difference ${diff} exceeds ${MAX_PRESSURE_DIFF} bar`
      ).toBe(true);
    });

    it('should have valid outside temperature', () => {
      expect(
        isValidTemperature(latest.outside_temp),
        `Invalid temperature: ${latest.outside_temp}`
      ).toBe(true);
    });
  });

  describe('Stats', () => {
    const stats = loadCarDataOrThrow<TpmsStats>(CAR_ID, 'tpms/stats.json');

    it('should have valid average front-left pressure', () => {
      expect(
        isValidTirePressure(stats.avg.fl),
        `Invalid avg FL pressure: ${stats.avg.fl}`
      ).toBe(true);
    });

    it('should have valid average front-right pressure', () => {
      expect(
        isValidTirePressure(stats.avg.fr),
        `Invalid avg FR pressure: ${stats.avg.fr}`
      ).toBe(true);
    });

    it('should have valid average rear-left pressure', () => {
      expect(
        isValidTirePressure(stats.avg.rl),
        `Invalid avg RL pressure: ${stats.avg.rl}`
      ).toBe(true);
    });

    it('should have valid average rear-right pressure', () => {
      expect(
        isValidTirePressure(stats.avg.rr),
        `Invalid avg RR pressure: ${stats.avg.rr}`
      ).toBe(true);
    });

    it('should have hasAlert as boolean', () => {
      expect(typeof stats.hasAlert).toBe('boolean');
    });

    it('should have alertMessage as null or string', () => {
      expect(
        stats.alertMessage === null || typeof stats.alertMessage === 'string',
        `Invalid alertMessage type: ${typeof stats.alertMessage}`
      ).toBe(true);
    });
  });
});