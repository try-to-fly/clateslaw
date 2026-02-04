import { describe, it, expect } from 'vitest';
import { queryToCommand } from '../src/core/query-command';
import type { TeslaQuery } from '../src/types/query-protocol';

describe('queryToCommand', () => {
  describe('Basic commands', () => {
    it('should convert cars query to command', () => {
      const query: TeslaQuery = {
        version: '1.0',
        type: 'cars',
      };
      const cmd = queryToCommand(query);
      expect(cmd).toBe('tesla cars');
    });

    it('should convert car query to command', () => {
      const query: TeslaQuery = {
        version: '1.0',
        type: 'car',
        carId: 1,
      };
      const cmd = queryToCommand(query);
      expect(cmd).toBe('tesla car 1');
    });

    it('should convert battery query to command', () => {
      const query: TeslaQuery = {
        version: '1.0',
        type: 'battery',
        carId: 1,
      };
      const cmd = queryToCommand(query);
      expect(cmd).toBe('tesla battery 1');
    });
  });

  describe('Commands with time range', () => {
    it('should convert drives query with default time range', () => {
      const query: TeslaQuery = {
        version: '1.0',
        type: 'drives',
        carId: 1,
      };
      const cmd = queryToCommand(query);
      expect(cmd).toContain('tesla drives 1');
      expect(cmd).toContain('-f now-90d');
      expect(cmd).toContain('-t now');
    });

    it('should convert drives query with semantic time range', () => {
      const query: TeslaQuery = {
        version: '1.0',
        type: 'drives',
        carId: 1,
        timeRange: { semantic: 'today' },
      };
      const cmd = queryToCommand(query);
      expect(cmd).toContain('-f now/d');
      expect(cmd).toContain('-t now');
    });

    it('should convert charges query with this_month', () => {
      const query: TeslaQuery = {
        version: '1.0',
        type: 'charges',
        carId: 1,
        timeRange: { semantic: 'this_month' },
      };
      const cmd = queryToCommand(query);
      expect(cmd).toContain('tesla charges 1');
      expect(cmd).toContain('-f now/M');
    });
  });

  describe('Commands with pagination', () => {
    it('should include limit in drives query', () => {
      const query: TeslaQuery = {
        version: '1.0',
        type: 'drives',
        carId: 1,
        pagination: { limit: 10 },
      };
      const cmd = queryToCommand(query);
      expect(cmd).toContain('-l 10');
    });

    it('should include limit in charges query', () => {
      const query: TeslaQuery = {
        version: '1.0',
        type: 'charges',
        carId: 1,
        pagination: { limit: 5 },
      };
      const cmd = queryToCommand(query);
      expect(cmd).toContain('-l 5');
    });
  });

  describe('Stats commands', () => {
    it('should convert stats.charging query', () => {
      const query: TeslaQuery = {
        version: '1.0',
        type: 'stats.charging',
        carId: 1,
        timeRange: { semantic: 'this_month' },
      };
      const cmd = queryToCommand(query);
      expect(cmd).toContain('tesla stats charging 1');
      expect(cmd).toContain('-f now/M');
    });

    it('should convert stats.driving query', () => {
      const query: TeslaQuery = {
        version: '1.0',
        type: 'stats.driving',
        carId: 1,
      };
      const cmd = queryToCommand(query);
      expect(cmd).toContain('tesla stats driving 1');
    });

    it('should convert stats.period query with period', () => {
      const query: TeslaQuery = {
        version: '1.0',
        type: 'stats.period',
        carId: 1,
        timeRange: { semantic: 'last_3_days' },
        period: 'day',
      };
      const cmd = queryToCommand(query);
      expect(cmd).toContain('tesla stats period 1');
      expect(cmd).toContain('-f now-3d');
      expect(cmd).toContain('-p day');
    });

    it('should convert stats.period query with month period', () => {
      const query: TeslaQuery = {
        version: '1.0',
        type: 'stats.period',
        carId: 1,
        timeRange: { semantic: 'this_year' },
        period: 'month',
      };
      const cmd = queryToCommand(query);
      expect(cmd).toContain('-p month');
    });
  });

  describe('Detail commands', () => {
    it('should convert detail.drive query', () => {
      const query: TeslaQuery = {
        version: '1.0',
        type: 'detail.drive',
        recordId: 4275,
      };
      const cmd = queryToCommand(query);
      expect(cmd).toBe('tesla detail drive 4275');
    });

    it('should convert detail.charge query', () => {
      const query: TeslaQuery = {
        version: '1.0',
        type: 'detail.charge',
        recordId: 785,
      };
      const cmd = queryToCommand(query);
      expect(cmd).toBe('tesla detail charge 785');
    });
  });

  describe('Screenshot commands', () => {
    it('should convert screenshot drive query', () => {
      const query: TeslaQuery = {
        version: '1.0',
        type: 'screenshot',
        carId: 1,
        screenshot: { type: 'drive', id: 123 },
      };
      const cmd = queryToCommand(query);
      expect(cmd).toContain('tesla screenshot drive 123');
      expect(cmd).toContain('-c 1');
    });

    it('should convert screenshot charge query with send', () => {
      const query: TeslaQuery = {
        version: '1.0',
        type: 'screenshot',
        carId: 1,
        screenshot: { type: 'charge', id: 456, send: true },
      };
      const cmd = queryToCommand(query);
      expect(cmd).toContain('tesla screenshot charge 456');
      expect(cmd).toContain('-s');
    });

    it('should convert screenshot daily query with date', () => {
      const query: TeslaQuery = {
        version: '1.0',
        type: 'screenshot',
        carId: 1,
        screenshot: { type: 'daily', date: '2025-01-15' },
      };
      const cmd = queryToCommand(query);
      expect(cmd).toContain('tesla screenshot daily 2025-01-15');
    });
  });

  describe('Extra params', () => {
    it('should include minDuration in vampire query', () => {
      const query: TeslaQuery = {
        version: '1.0',
        type: 'vampire',
        carId: 1,
        extra: { minDuration: 120 },
      };
      const cmd = queryToCommand(query);
      expect(cmd).toContain('--min-duration 120');
    });

    it('should include minDistance in efficiency query', () => {
      const query: TeslaQuery = {
        version: '1.0',
        type: 'efficiency',
        carId: 1,
        extra: { minDistance: 10 },
      };
      const cmd = queryToCommand(query);
      expect(cmd).toContain('--min-distance 10');
    });

    it('should include top in locations query', () => {
      const query: TeslaQuery = {
        version: '1.0',
        type: 'locations',
        carId: 1,
        extra: { top: 20 },
      };
      const cmd = queryToCommand(query);
      expect(cmd).toContain('--top 20');
    });
  });

  describe('Output format', () => {
    it('should add json output format', () => {
      const query: TeslaQuery = {
        version: '1.0',
        type: 'cars',
        output: 'json',
      };
      const cmd = queryToCommand(query);
      expect(cmd).toContain('-o json');
    });

    it('should not add output flag for table format', () => {
      const query: TeslaQuery = {
        version: '1.0',
        type: 'cars',
        output: 'table',
      };
      const cmd = queryToCommand(query);
      expect(cmd).not.toContain('-o');
    });

    it('should add summary output format', () => {
      const query: TeslaQuery = {
        version: '1.0',
        type: 'drives',
        carId: 1,
        output: 'summary',
      };
      const cmd = queryToCommand(query);
      expect(cmd).toContain('-o summary');
    });
  });

  describe('Default carId', () => {
    it('should use default carId 1 when not specified', () => {
      const query: TeslaQuery = {
        version: '1.0',
        type: 'drives',
      };
      const cmd = queryToCommand(query);
      expect(cmd).toContain('tesla drives 1');
    });
  });
});
