import type { TeslaQuery } from '../types/query-protocol.js';
import { resolveTimeRange } from './semantic-time.js';

/**
 * 将查询协议转换为 CLI 命令字符串
 */
export function queryToCommand(query: TeslaQuery): string {
  const parts: string[] = ['tesla'];
  const { from, to } = resolveTimeRange(query.timeRange);

  switch (query.type) {
    case 'cars':
      parts.push('cars');
      break;

    case 'car':
      parts.push('car', String(query.carId ?? 1));
      break;

    case 'drives':
      parts.push('drives', String(query.carId ?? 1));
      parts.push('-f', from, '-t', to);
      if (query.pagination?.limit) parts.push('-l', String(query.pagination.limit));
      break;

    case 'charges':
      parts.push('charges', String(query.carId ?? 1));
      parts.push('-f', from, '-t', to);
      if (query.pagination?.limit) parts.push('-l', String(query.pagination.limit));
      break;

    case 'battery':
      parts.push('battery', String(query.carId ?? 1));
      break;

    case 'efficiency':
      parts.push('efficiency', String(query.carId ?? 1));
      if (query.extra?.minDistance) parts.push('--min-distance', String(query.extra.minDistance));
      break;

    case 'states':
      parts.push('states', String(query.carId ?? 1));
      parts.push('-f', from, '-t', to);
      if (query.pagination?.limit) parts.push('-l', String(query.pagination.limit));
      break;

    case 'updates':
      parts.push('updates', String(query.carId ?? 1));
      parts.push('-f', from, '-t', to);
      if (query.pagination?.limit) parts.push('-l', String(query.pagination.limit));
      break;

    case 'mileage':
      parts.push('mileage', String(query.carId ?? 1));
      parts.push('-f', from, '-t', to);
      break;

    case 'vampire':
      parts.push('vampire', String(query.carId ?? 1));
      parts.push('-f', from, '-t', to);
      if (query.extra?.minDuration) parts.push('--min-duration', String(query.extra.minDuration));
      break;

    case 'locations':
      parts.push('locations', String(query.carId ?? 1));
      parts.push('-f', from, '-t', to);
      if (query.extra?.top) parts.push('--top', String(query.extra.top));
      break;

    case 'timeline':
      parts.push('timeline', String(query.carId ?? 1));
      parts.push('-f', from, '-t', to);
      if (query.pagination?.limit) parts.push('-l', String(query.pagination.limit));
      break;

    case 'visited':
      parts.push('visited', String(query.carId ?? 1));
      parts.push('-f', from, '-t', to);
      if (query.extra?.top) parts.push('--top', String(query.extra.top));
      break;

    case 'projected-range':
      parts.push('projected-range', String(query.carId ?? 1));
      parts.push('-f', from, '-t', to);
      if (query.pagination?.limit) parts.push('-l', String(query.pagination.limit));
      break;

    case 'stats.charging':
      parts.push('stats', 'charging', String(query.carId ?? 1));
      parts.push('-f', from, '-t', to);
      if (query.extra?.minDuration) parts.push('--min-duration', String(query.extra.minDuration));
      break;

    case 'stats.driving':
      parts.push('stats', 'driving', String(query.carId ?? 1));
      parts.push('-f', from, '-t', to);
      break;

    case 'stats.period':
      parts.push('stats', 'period', String(query.carId ?? 1));
      parts.push('-f', from, '-t', to);
      if (query.period) parts.push('-p', query.period);
      break;

    case 'detail.drive':
      parts.push('detail', 'drive', String(query.recordId ?? 0));
      break;

    case 'detail.charge':
      parts.push('detail', 'charge', String(query.recordId ?? 0));
      break;

    case 'screenshot':
      if (query.screenshot) {
        parts.push('screenshot', query.screenshot.type);
        if (query.screenshot.id) parts.push(String(query.screenshot.id));
        if (query.screenshot.date) parts.push(query.screenshot.date);
        if (query.carId) parts.push('-c', String(query.carId));
        if (query.screenshot.send) parts.push('-s');
      }
      break;
  }

  if (query.output && query.output !== 'table') {
    parts.push('-o', query.output);
  }

  return parts.join(' ');
}
