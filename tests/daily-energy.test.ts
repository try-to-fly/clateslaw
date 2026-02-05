import { describe, it, expect } from 'vitest';
import { loadCarDataOrThrow } from './helpers/data-loader';

interface DriveRecord {
  id: number;
  distance: number;
  start_rated_range_km?: number | null;
  end_rated_range_km?: number | null;
}

interface ChargeRecord {
  charge_energy_added: number;
}

const CAR_ID = 1;
const EFF_KWH_PER_KM = 0.153;

function computeDailyEnergyFromDrives(drives: DriveRecord[]): number {
  // Mirrors screenshot.ts getDailyData() totalEnergyUsed calculation.
  return drives.reduce((sum, d) => {
    const start = Number(d.start_rated_range_km);
    const end = Number(d.end_rated_range_km);
    if (!Number.isFinite(start) || !Number.isFinite(end)) return sum;
    return sum + Math.max(0, (start - end) * EFF_KWH_PER_KM);
  }, 0);
}

describe('Daily energy/efficiency inputs', () => {
  it('should include rated range fields in drive records fixture', () => {
    const drives = loadCarDataOrThrow<DriveRecord[]>(CAR_ID, 'drives/records.json');
    expect(drives.length).toBeGreaterThan(0);

    // At least one record should have rated range present; otherwise Daily efficiency will be forced to 0.
    const hasRatedRange = drives.some(
      (d) =>
        typeof d.start_rated_range_km === 'number' &&
        typeof d.end_rated_range_km === 'number'
    );
    expect(hasRatedRange).toBe(true);
  });

  it('should produce non-zero driving energy when there are drives but no charges', () => {
    const drives = loadCarDataOrThrow<DriveRecord[]>(CAR_ID, 'drives/records.json');
    const charges = loadCarDataOrThrow<ChargeRecord[]>(CAR_ID, 'charges/records.json');

    const totalDistance = drives.reduce((s, d) => s + (d.distance || 0), 0);
    const totalEnergyAdded = charges.reduce((s, c) => s + (c.charge_energy_added || 0), 0);
    const drivingEnergy = computeDailyEnergyFromDrives(drives);

    // Fixture sanity: if this ever breaks, Daily screenshot may regress to showing 0 Wh/km.
    expect(totalDistance).toBeGreaterThan(0);
    expect(drivingEnergy).toBeGreaterThan(0);
    // If there are no charges, we should still be able to compute driving energy.
    if (totalEnergyAdded === 0) {
      expect(drivingEnergy).toBeGreaterThan(0);
    }
  });
});
