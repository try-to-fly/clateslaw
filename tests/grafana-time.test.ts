import { describe, it, expect } from 'vitest';
import { parseGrafanaTime } from '../src/core/grafana-client';

describe('parseGrafanaTime', () => {
  describe('Basic time parsing', () => {
    it('should parse "now" to current time', () => {
      const before = Date.now();
      const result = parseGrafanaTime('now');
      const after = Date.now();
      const parsed = new Date(result).getTime();
      expect(parsed).toBeGreaterThanOrEqual(before);
      expect(parsed).toBeLessThanOrEqual(after);
    });

    it('should parse "now-1d" correctly', () => {
      const result = parseGrafanaTime('now-1d');
      const parsed = new Date(result).getTime();
      const expected = Date.now() - 86400000;
      expect(Math.abs(parsed - expected)).toBeLessThan(1000);
    });

    it('should parse "now-7d" correctly', () => {
      const result = parseGrafanaTime('now-7d');
      const parsed = new Date(result).getTime();
      const expected = Date.now() - 7 * 86400000;
      expect(Math.abs(parsed - expected)).toBeLessThan(1000);
    });

    it('should parse "now-30d" correctly', () => {
      const result = parseGrafanaTime('now-30d');
      const parsed = new Date(result).getTime();
      const expected = Date.now() - 30 * 86400000;
      expect(Math.abs(parsed - expected)).toBeLessThan(1000);
    });

    it('should parse "now-1h" correctly', () => {
      const result = parseGrafanaTime('now-1h');
      const parsed = new Date(result).getTime();
      const expected = Date.now() - 3600000;
      expect(Math.abs(parsed - expected)).toBeLessThan(1000);
    });

    it('should parse "now-30m" correctly', () => {
      const result = parseGrafanaTime('now-30m');
      const parsed = new Date(result).getTime();
      const expected = Date.now() - 30 * 60000;
      expect(Math.abs(parsed - expected)).toBeLessThan(1000);
    });
  });

  describe('Boundary alignment', () => {
    it('should parse "today" to start of day', () => {
      const result = parseGrafanaTime('today');
      const parsed = new Date(result);
      expect(parsed.getHours()).toBe(0);
      expect(parsed.getMinutes()).toBe(0);
      expect(parsed.getSeconds()).toBe(0);
      expect(parsed.getMilliseconds()).toBe(0);
    });

    it('should parse "day" to start of day', () => {
      const result = parseGrafanaTime('day');
      const parsed = new Date(result);
      expect(parsed.getHours()).toBe(0);
      expect(parsed.getMinutes()).toBe(0);
      expect(parsed.getSeconds()).toBe(0);
      expect(parsed.getMilliseconds()).toBe(0);
    });

    it('should parse "yesterday" to start of yesterday', () => {
      const result = parseGrafanaTime('yesterday');
      const parsed = new Date(result);
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);
      expect(parsed.getTime()).toBe(yesterday.getTime());
    });

    it('should parse "now/d" to start of day', () => {
      const result = parseGrafanaTime('now/d');
      const parsed = new Date(result);
      expect(parsed.getHours()).toBe(0);
      expect(parsed.getMinutes()).toBe(0);
      expect(parsed.getSeconds()).toBe(0);
      expect(parsed.getMilliseconds()).toBe(0);
    });

    it('should parse "now-1d/d" to start of yesterday', () => {
      const result = parseGrafanaTime('now-1d/d');
      const parsed = new Date(result);
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);
      expect(parsed.getTime()).toBe(yesterday.getTime());
    });

    it('should parse "month" to start of month', () => {
      const result = parseGrafanaTime('month');
      const parsed = new Date(result);
      expect(parsed.getDate()).toBe(1);
      expect(parsed.getHours()).toBe(0);
      expect(parsed.getMinutes()).toBe(0);
    });

    it('should parse "now/M" to start of month', () => {
      const result = parseGrafanaTime('now/M');
      const parsed = new Date(result);
      expect(parsed.getDate()).toBe(1);
      expect(parsed.getHours()).toBe(0);
      expect(parsed.getMinutes()).toBe(0);
    });

    it('should parse "now-1M/M" to start of last month', () => {
      const result = parseGrafanaTime('now-1M/M');
      const parsed = new Date(result);
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      lastMonth.setDate(1);
      lastMonth.setHours(0, 0, 0, 0);
      expect(parsed.getTime()).toBe(lastMonth.getTime());
    });

    it('should parse "year" to start of year', () => {
      const result = parseGrafanaTime('year');
      const parsed = new Date(result);
      expect(parsed.getMonth()).toBe(0);
      expect(parsed.getDate()).toBe(1);
      expect(parsed.getHours()).toBe(0);
    });

    it('should parse "now/y" to start of year', () => {
      const result = parseGrafanaTime('now/y');
      const parsed = new Date(result);
      expect(parsed.getMonth()).toBe(0);
      expect(parsed.getDate()).toBe(1);
      expect(parsed.getHours()).toBe(0);
    });

    it('should parse "week" to start of week (Monday)', () => {
      const result = parseGrafanaTime('week');
      const parsed = new Date(result);
      // Monday is day 1
      const day = parsed.getDay();
      expect(day).toBe(1);
      expect(parsed.getHours()).toBe(0);
      expect(parsed.getMinutes()).toBe(0);
    });

    it('should parse "now/w" to start of week (Monday)', () => {
      const result = parseGrafanaTime('now/w');
      const parsed = new Date(result);
      // Monday is day 1
      const day = parsed.getDay();
      expect(day).toBe(1);
      expect(parsed.getHours()).toBe(0);
      expect(parsed.getMinutes()).toBe(0);
    });
  });

  describe('Week boundary edge cases', () => {
    it('should handle week boundary for Sunday', () => {
      const result = parseGrafanaTime('now/w');
      const parsed = new Date(result);
      expect(parsed.getDay()).toBe(1); // Monday
    });
  });

  describe('Invalid input handling', () => {
    it('should return input unchanged for invalid format', () => {
      const result = parseGrafanaTime('invalid');
      expect(result).toBe('invalid');
    });

    it('should return ISO date string unchanged', () => {
      const isoDate = '2025-01-15T10:30:00.000Z';
      const result = parseGrafanaTime(isoDate);
      expect(result).toBe(isoDate);
    });
  });
});
