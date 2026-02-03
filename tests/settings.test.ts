import { describe, it, expect } from 'vitest';
import { loadJsonOrThrow } from './helpers/data-loader';

interface Settings {
  unit_of_length: string;
  unit_of_temperature: string;
  preferred_range: string;
  base_url: string;
}

describe('Settings', () => {
  const settings = loadJsonOrThrow<Settings>('settings/settings.json');

  it('should have valid unit_of_length', () => {
    expect(['km', 'mi']).toContain(settings.unit_of_length);
  });

  it('should have valid unit_of_temperature', () => {
    expect(['C', 'F']).toContain(settings.unit_of_temperature);
  });

  it('should have valid preferred_range', () => {
    expect(['rated', 'ideal']).toContain(settings.preferred_range);
  });

  it('should have valid base_url', () => {
    expect(typeof settings.base_url).toBe('string');
    expect(settings.base_url.length).toBeGreaterThan(0);
  });
});
