import { resolveTimeRange } from '../../core/semantic-time.js';
import type { TeslaQuery, TimeRange } from '../../types/query-protocol.js';

export interface ExplicitRange {
  from: string;
  to: string;
}

export function formatLocalDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseUserDateTime(input: string): Date {
  const trimmed = input.trim();
  const normalized = trimmed.replace('T', ' ');

  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    const [y, m, d] = normalized.split('-').map((v) => parseInt(v, 10));
    return new Date(y, m - 1, d, 0, 0, 0, 0);
  }

  const match = normalized.match(/^(\d{4}-\d{2}-\d{2})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (match) {
    const [, datePart, hh, mm, ss] = match;
    const [y, m, d] = datePart.split('-').map((v) => parseInt(v, 10));
    return new Date(y, m - 1, d, parseInt(hh, 10), parseInt(mm, 10), parseInt(ss ?? '0', 10), 0);
  }

  const parsed = new Date(trimmed);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed;
  }

  throw new Error(`Invalid date/time: ${input}`);
}

export function resolveExplicitTimeRange(fromInput: string, toInput: string): ExplicitRange {
  const fromDate = parseUserDateTime(fromInput);
  const toDate = parseUserDateTime(toInput);

  if (fromDate.getTime() > toDate.getTime()) {
    throw new Error(`Invalid range: from (${fromInput}) must be earlier than to (${toInput})`);
  }

  return {
    from: fromDate.toISOString(),
    to: toDate.toISOString(),
  };
}

export function buildRangeScreenshotQuery(
  params:
    | { from: string; to: string; carId?: number; send?: boolean }
    | { timeRange: TimeRange; carId?: number; send?: boolean }
): TeslaQuery {
  const resolvedRange = 'timeRange' in params
    ? resolveTimeRange(params.timeRange)
    : resolveExplicitTimeRange(params.from, params.to);

  const baseDate = new Date(resolvedRange.from);

  return {
    version: '1.0',
    type: 'screenshot',
    carId: params.carId ?? 1,
    timeRange: {
      absolute: {
        from: resolvedRange.from,
        to: resolvedRange.to,
      },
    },
    screenshot: {
      type: 'daily',
      date: formatLocalDate(baseDate),
      send: params.send,
    },
  };
}
