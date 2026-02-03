import { describe, it, expect } from 'vitest';
import { loadCarDataOrThrow } from './helpers/data-loader';
import { isNonNegative } from './helpers/validators';

interface LocationStats {
  total_addresses: number;
  total_cities: number;
  total_states: number;
  total_countries: number;
}

interface TopLocation {
  name: string | null;
  city: string | null;
  state: string | null;
  country: string;
  visit_count: number;
  total_charges: number;
  total_energy_added: number;
}

const CAR_ID = 1;

describe('Locations', () => {
  describe('Stats', () => {
    const stats = loadCarDataOrThrow<LocationStats>(CAR_ID, 'locations/stats.json');

    it('should have non-negative total_addresses', () => {
      expect(isNonNegative(stats.total_addresses)).toBe(true);
    });

    it('should have non-negative total_cities', () => {
      expect(isNonNegative(stats.total_cities)).toBe(true);
    });

    it('should have non-negative total_states', () => {
      expect(isNonNegative(stats.total_states)).toBe(true);
    });

    it('should have non-negative total_countries', () => {
      expect(isNonNegative(stats.total_countries)).toBe(true);
    });

    it('should have logical hierarchy (addresses >= cities >= states >= countries)', () => {
      expect(stats.total_addresses).toBeGreaterThanOrEqual(stats.total_cities);
      expect(stats.total_cities).toBeGreaterThanOrEqual(stats.total_states);
      expect(stats.total_states).toBeGreaterThanOrEqual(stats.total_countries);
    });
  });

  describe('Top Locations', () => {
    const locations = loadCarDataOrThrow<TopLocation[]>(CAR_ID, 'locations/top-locations.json');

    it('should be an array', () => {
      expect(Array.isArray(locations)).toBe(true);
    });

    it('should have valid location entries', () => {
      locations.forEach((loc, index) => {
        // name, city, state can be null
        expect(loc.name === null || typeof loc.name === 'string').toBe(true);
        expect(loc.state === null || typeof loc.state === 'string').toBe(true);
        expect(typeof loc.country).toBe('string');
      });
    });

    it('should have non-negative visit_count', () => {
      locations.forEach((loc, index) => {
        expect(
          isNonNegative(loc.visit_count),
          `Invalid visit_count at index ${index}`
        ).toBe(true);
      });
    });

    it('should have non-negative total_charges', () => {
      locations.forEach((loc, index) => {
        expect(
          isNonNegative(loc.total_charges),
          `Invalid total_charges at index ${index}`
        ).toBe(true);
      });
    });

    it('should have non-negative total_energy_added', () => {
      locations.forEach((loc, index) => {
        expect(
          isNonNegative(loc.total_energy_added),
          `Invalid total_energy_added at index ${index}`
        ).toBe(true);
      });
    });
  });
});
