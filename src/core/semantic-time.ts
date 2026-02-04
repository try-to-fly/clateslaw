import type { SemanticTime, TimeRange, ResolvedTimeRange } from '../types/query-protocol.js';

/** 语义时间到 Grafana 相对时间的映射 */
const SEMANTIC_TIME_MAP: Record<SemanticTime, { from: string; to: string }> = {
  today: { from: 'now/d', to: 'now' },
  yesterday: { from: 'now-1d/d', to: 'now-1d/d' },
  this_week: { from: 'now/w', to: 'now' },
  last_week: { from: 'now-1w/w', to: 'now-1w/w' },
  this_month: { from: 'now/M', to: 'now' },
  last_month: { from: 'now-1M/M', to: 'now-1M/M' },
  this_year: { from: 'now/y', to: 'now' },
  last_year: { from: 'now-1y/y', to: 'now-1y/y' },
  last_3_days: { from: 'now-3d', to: 'now' },
  last_7_days: { from: 'now-7d', to: 'now' },
  last_30_days: { from: 'now-30d', to: 'now' },
  last_90_days: { from: 'now-90d', to: 'now' },
  all_time: { from: 'now-10y', to: 'now' },
};

/**
 * 解析语义时间为 Grafana 相对时间格式
 */
export function resolveSemanticTime(semantic: SemanticTime): { from: string; to: string } {
  return SEMANTIC_TIME_MAP[semantic];
}

/**
 * 解析 TimeRange 为具体的时间范围字符串
 */
export function resolveTimeRange(timeRange?: TimeRange): ResolvedTimeRange {
  if (!timeRange) {
    return { from: 'now-90d', to: 'now' };
  }

  if (timeRange.semantic) {
    return resolveSemanticTime(timeRange.semantic);
  }

  if (timeRange.relative) {
    return {
      from: timeRange.relative.from,
      to: timeRange.relative.to ?? 'now',
    };
  }

  if (timeRange.absolute) {
    return {
      from: timeRange.absolute.from,
      to: timeRange.absolute.to,
    };
  }

  return { from: 'now-90d', to: 'now' };
}
