import { describe, it, expect } from 'vitest';
import {
  buildRangeScreenshotQuery,
  formatLocalDate,
  parseUserDateTime,
  resolveExplicitTimeRange,
} from '../src/cli/commands/screenshot-range';

describe('screenshot range helpers', () => {
  it('parses local date-only input as local midnight', () => {
    const d = parseUserDateTime('2026-02-21');
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(1);
    expect(d.getDate()).toBe(21);
    expect(d.getHours()).toBe(0);
    expect(d.getMinutes()).toBe(0);
  });

  it('parses local datetime input without shifting timezone', () => {
    const d = parseUserDateTime('2026-02-21 10:30');
    expect(formatLocalDate(d)).toBe('2026-02-21');
    expect(d.getHours()).toBe(10);
    expect(d.getMinutes()).toBe(30);
  });

  it('resolves explicit range into ascending ISO timestamps', () => {
    const range = resolveExplicitTimeRange('2026-02-21 10:00', '2026-02-22 04:00');
    expect(range.from < range.to).toBe(true);
    expect(range.from.endsWith('Z')).toBe(true);
    expect(range.to.endsWith('Z')).toBe(true);
  });

  it('throws when from is later than to', () => {
    expect(() => resolveExplicitTimeRange('2026-02-22 04:00', '2026-02-21 10:00')).toThrow(/from/);
  });

  it('builds a screenshot query for explicit ranges', () => {
    const query = buildRangeScreenshotQuery({
      from: '2026-02-21 10:00',
      to: '2026-02-22 04:00',
      carId: 3,
      send: true,
    });

    expect(query.type).toBe('screenshot');
    expect(query.carId).toBe(3);
    expect(query.screenshot?.type).toBe('daily');
    expect(query.screenshot?.send).toBe(true);
    expect(query.timeRange?.absolute?.from).toBeTruthy();
    expect(query.timeRange?.absolute?.to).toBeTruthy();
  });

  it('builds a screenshot query from semantic time ranges too', () => {
    const query = buildRangeScreenshotQuery({
      carId: 1,
      timeRange: { semantic: 'last_3_days' },
    });

    expect(query.type).toBe('screenshot');
    expect(query.timeRange?.absolute?.from).toBe('now-3d');
    expect(query.timeRange?.absolute?.to).toBe('now');
    expect(query.screenshot?.type).toBe('daily');
  });
});
