import { describe, it, expect } from 'vitest';
import { loadJsonOrThrow } from './helpers/data-loader';
import { isValidISODate, isNonNegative } from './helpers/validators';

interface Metadata {
  collectedAt: string;
  totalApis: number;
  successCount: number;
  failureCount: number;
  errors: Array<{ api: string; error: string }>;
  cars: Array<{ id: number; name: string }>;
}

describe('Metadata', () => {
  const metadata = loadJsonOrThrow<Metadata>('_metadata.json');

  it('should have valid collectedAt timestamp', () => {
    expect(isValidISODate(metadata.collectedAt)).toBe(true);
  });

  it('should have non-negative totalApis', () => {
    expect(isNonNegative(metadata.totalApis)).toBe(true);
  });

  it('should have non-negative successCount', () => {
    expect(isNonNegative(metadata.successCount)).toBe(true);
  });

  it('should have non-negative failureCount', () => {
    expect(isNonNegative(metadata.failureCount)).toBe(true);
  });

  it('should have successCount + failureCount = totalApis', () => {
    expect(metadata.successCount + metadata.failureCount).toBe(metadata.totalApis);
  });

  it('should have errors array', () => {
    expect(Array.isArray(metadata.errors)).toBe(true);
  });

  it('should have error count matching failureCount', () => {
    expect(metadata.errors.length).toBe(metadata.failureCount);
  });

  it('should have cars array with at least one car', () => {
    expect(Array.isArray(metadata.cars)).toBe(true);
    expect(metadata.cars.length).toBeGreaterThan(0);
  });

  it('should have valid car entries', () => {
    metadata.cars.forEach((car) => {
      expect(typeof car.id).toBe('number');
      expect(typeof car.name).toBe('string');
    });
  });
});
