import { describe, it, expect } from 'vitest';
import { loadJsonOrThrow } from './helpers/data-loader';
import { isPositive, hasUniqueIds } from './helpers/validators';

interface Car {
  id: number;
  name: string;
  vin: string;
  model: string;
  efficiency: number;
  display_priority: number;
}

describe('Cars', () => {
  const cars = loadJsonOrThrow<Car[]>('cars/cars.json');

  it('should be a non-empty array', () => {
    expect(Array.isArray(cars)).toBe(true);
    expect(cars.length).toBeGreaterThan(0);
  });

  it('should have unique IDs', () => {
    expect(hasUniqueIds(cars)).toBe(true);
  });

  describe.each(cars)('Car $name (ID: $id)', (car) => {
    it('should have valid id', () => {
      expect(typeof car.id).toBe('number');
      expect(car.id).toBeGreaterThan(0);
    });

    it('should have valid name', () => {
      expect(typeof car.name).toBe('string');
      expect(car.name.length).toBeGreaterThan(0);
    });

    it('should have valid VIN', () => {
      expect(typeof car.vin).toBe('string');
      expect(car.vin.length).toBe(17);
    });

    it('should have valid model', () => {
      expect(typeof car.model).toBe('string');
      expect(['3', 'S', 'X', 'Y']).toContain(car.model);
    });

    it('should have positive efficiency', () => {
      expect(isPositive(car.efficiency)).toBe(true);
    });

    it('should have valid display_priority', () => {
      expect(typeof car.display_priority).toBe('number');
      expect(car.display_priority).toBeGreaterThan(0);
    });
  });
});
