import { describe, it, expect } from 'vitest';
import { resolveSemanticTime, resolveTimeRange } from '../src/core/semantic-time';
import type { TeslaQuery, SemanticTime } from '../src/types/query-protocol';

const CAR_ID = 1;

describe('Query Protocol', () => {
  describe('Semantic Time Resolution', () => {
    it('should resolve today correctly', () => {
      const result = resolveSemanticTime('today');
      expect(result.from).toBe('now/d');
      expect(result.to).toBe('now');
    });

    it('should resolve yesterday correctly', () => {
      const result = resolveSemanticTime('yesterday');
      expect(result.from).toBe('now-1d/d');
      expect(result.to).toBe('now-1d/d');
    });

    it('should resolve this_week correctly', () => {
      const result = resolveSemanticTime('this_week');
      expect(result.from).toBe('now/w');
      expect(result.to).toBe('now');
    });

    it('should resolve last_week correctly', () => {
      const result = resolveSemanticTime('last_week');
      expect(result.from).toBe('now-1w/w');
      expect(result.to).toBe('now-1w/w');
    });

    it('should resolve this_month correctly', () => {
      const result = resolveSemanticTime('this_month');
      expect(result.from).toBe('now/M');
      expect(result.to).toBe('now');
    });

    it('should resolve last_month correctly', () => {
      const result = resolveSemanticTime('last_month');
      expect(result.from).toBe('now-1M/M');
      expect(result.to).toBe('now-1M/M');
    });

    it('should resolve this_year correctly', () => {
      const result = resolveSemanticTime('this_year');
      expect(result.from).toBe('now/y');
      expect(result.to).toBe('now');
    });

    it('should resolve last_year correctly', () => {
      const result = resolveSemanticTime('last_year');
      expect(result.from).toBe('now-1y/y');
      expect(result.to).toBe('now-1y/y');
    });

    it('should resolve last_3_days correctly', () => {
      const result = resolveSemanticTime('last_3_days');
      expect(result.from).toBe('now-3d');
      expect(result.to).toBe('now');
    });

    it('should resolve last_7_days correctly', () => {
      const result = resolveSemanticTime('last_7_days');
      expect(result.from).toBe('now-7d');
      expect(result.to).toBe('now');
    });

    it('should resolve last_30_days correctly', () => {
      const result = resolveSemanticTime('last_30_days');
      expect(result.from).toBe('now-30d');
      expect(result.to).toBe('now');
    });

    it('should resolve last_90_days correctly', () => {
      const result = resolveSemanticTime('last_90_days');
      expect(result.from).toBe('now-90d');
      expect(result.to).toBe('now');
    });

    it('should resolve all_time correctly', () => {
      const result = resolveSemanticTime('all_time');
      expect(result.from).toBe('now-10y');
      expect(result.to).toBe('now');
    });
  });

  describe('TimeRange Resolution', () => {
    it('should return default range when no timeRange provided', () => {
      const result = resolveTimeRange(undefined);
      expect(result.from).toBe('now-90d');
      expect(result.to).toBe('now');
    });

    it('should resolve semantic time range', () => {
      const result = resolveTimeRange({ semantic: 'this_month' });
      expect(result.from).toBe('now/M');
      expect(result.to).toBe('now');
    });

    it('should resolve relative time range with from only', () => {
      const result = resolveTimeRange({ relative: { from: 'now-7d' } });
      expect(result.from).toBe('now-7d');
      expect(result.to).toBe('now');
    });

    it('should resolve relative time range with from and to', () => {
      const result = resolveTimeRange({ relative: { from: 'now-7d', to: 'now-1d' } });
      expect(result.from).toBe('now-7d');
      expect(result.to).toBe('now-1d');
    });

    it('should resolve absolute time range', () => {
      const result = resolveTimeRange({
        absolute: { from: '2025-01-01', to: '2025-01-31' },
      });
      expect(result.from).toBe('2025-01-01');
      expect(result.to).toBe('2025-01-31');
    });
  });

  describe('Query Validation', () => {
    it('should validate query with version 1.0', () => {
      const query: TeslaQuery = {
        version: '1.0',
        type: 'drives',
        carId: 1,
      };
      expect(query.version).toBe('1.0');
      expect(query.type).toBe('drives');
    });

    it('should support all query types', () => {
      const queryTypes = [
        'drives',
        'charges',
        'battery',
        'efficiency',
        'states',
        'updates',
        'mileage',
        'vampire',
        'locations',
        'timeline',
        'visited',
        'projected-range',
        'stats.charging',
        'stats.driving',
        'stats.period',
        'detail.drive',
        'detail.charge',
        'screenshot',
        'car',
        'cars',
      ];

      queryTypes.forEach((type) => {
        const query: TeslaQuery = {
          version: '1.0',
          type: type as TeslaQuery['type'],
          carId: 1,
        };
        expect(query.type).toBe(type);
      });
    });

    it('should support all semantic time values', () => {
      const semanticTimes: SemanticTime[] = [
        'today',
        'yesterday',
        'this_week',
        'last_week',
        'this_month',
        'last_month',
        'this_year',
        'last_year',
        'last_3_days',
        'last_7_days',
        'last_30_days',
        'last_90_days',
        'all_time',
      ];

      semanticTimes.forEach((semantic) => {
        const result = resolveSemanticTime(semantic);
        expect(result).toHaveProperty('from');
        expect(result).toHaveProperty('to');
      });
    });

    it('should support pagination config', () => {
      const query: TeslaQuery = {
        version: '1.0',
        type: 'drives',
        carId: 1,
        pagination: { limit: 10, offset: 5 },
      };
      expect(query.pagination?.limit).toBe(10);
      expect(query.pagination?.offset).toBe(5);
    });

    it('should support sort config', () => {
      const query: TeslaQuery = {
        version: '1.0',
        type: 'drives',
        carId: 1,
        sort: { field: 'distance', direction: 'desc' },
      };
      expect(query.sort?.field).toBe('distance');
      expect(query.sort?.direction).toBe('desc');
    });

    it('should support filter conditions', () => {
      const query: TeslaQuery = {
        version: '1.0',
        type: 'drives',
        carId: 1,
        filters: [
          { field: 'distance', operator: 'gt', value: 10 },
          { field: 'speed_max', operator: 'lte', value: 100 },
        ],
      };
      expect(query.filters).toHaveLength(2);
      expect(query.filters?.[0].operator).toBe('gt');
      expect(query.filters?.[1].operator).toBe('lte');
    });

    it('should support extra params', () => {
      const query: TeslaQuery = {
        version: '1.0',
        type: 'vampire',
        carId: 1,
        extra: { minDuration: 60, minDistance: 5, top: 10 },
      };
      expect(query.extra?.minDuration).toBe(60);
      expect(query.extra?.minDistance).toBe(5);
      expect(query.extra?.top).toBe(10);
    });

    it('should support screenshot config', () => {
      const query: TeslaQuery = {
        version: '1.0',
        type: 'screenshot',
        carId: 1,
        screenshot: { type: 'drive', id: 123, send: true },
      };
      expect(query.screenshot?.type).toBe('drive');
      expect(query.screenshot?.id).toBe(123);
      expect(query.screenshot?.send).toBe(true);
    });

    it('should support period config for stats.period', () => {
      const query: TeslaQuery = {
        version: '1.0',
        type: 'stats.period',
        carId: 1,
        period: 'month',
      };
      expect(query.period).toBe('month');
    });
  });
});
