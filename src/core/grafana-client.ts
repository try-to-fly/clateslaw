import got, { type Got, HTTPError } from 'got';
import type {
  GrafanaClientConfig,
  GrafanaDataSource,
  GrafanaQueryResponse,
  QueryOptions,
} from '../types/grafana.js';

/**
 * 解析 Grafana 相对时间格式为 ISO 时间戳
 * 支持: now, now-Nd, now-Nh, now-Nm, now-Ns
 * 支持边界: now/d, now/w, now/M, now/y, now-1d/d 等
 */
export function parseGrafanaTime(timeStr: string): string {
  const now = new Date();

  // 处理纯 now
  if (timeStr === 'now') {
    return now.toISOString();
  }

  // 解析时间偏移和边界
  // 格式: now[-Nunit][/boundary]
  const match = timeStr.match(/^now(?:-(\d+)([dhmsywM]))?(?:\/([dwMy]))?$/);
  if (!match) {
    return timeStr;
  }

  const [, amount, unit, boundary] = match;
  let date = new Date(now);

  // 应用时间偏移
  if (amount && unit) {
    const num = parseInt(amount, 10);
    switch (unit) {
      case 'd':
        date.setDate(date.getDate() - num);
        break;
      case 'h':
        date.setHours(date.getHours() - num);
        break;
      case 'm':
        date.setMinutes(date.getMinutes() - num);
        break;
      case 's':
        date.setSeconds(date.getSeconds() - num);
        break;
      case 'w':
        date.setDate(date.getDate() - num * 7);
        break;
      case 'M':
        date.setMonth(date.getMonth() - num);
        break;
      case 'y':
        date.setFullYear(date.getFullYear() - num);
        break;
    }
  }

  // 应用边界对齐
  if (boundary) {
    switch (boundary) {
      case 'd':
        // 对齐到当天开始
        date.setHours(0, 0, 0, 0);
        break;
      case 'w':
        // 对齐到本周开始（周一）
        const day = date.getDay();
        const diff = day === 0 ? 6 : day - 1;
        date.setDate(date.getDate() - diff);
        date.setHours(0, 0, 0, 0);
        break;
      case 'M':
        // 对齐到本月开始
        date.setDate(1);
        date.setHours(0, 0, 0, 0);
        break;
      case 'y':
        // 对齐到本年开始
        date.setMonth(0, 1);
        date.setHours(0, 0, 0, 0);
        break;
    }
  }

  return date.toISOString();
}

/** 默认数据源配置 */
const DEFAULT_DATASOURCE: GrafanaDataSource = {
  type: 'grafana-postgresql-datasource',
  uid: 'PC98BA2F4D77E1A42',
};

/** Grafana API 错误 */
export class GrafanaApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly responseBody: string
  ) {
    super(message);
    this.name = 'GrafanaApiError';
  }
}

/** Grafana 查询错误 */
export class GrafanaQueryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GrafanaQueryError';
  }
}

export class GrafanaClient {
  private readonly client: Got;
  private readonly datasource: GrafanaDataSource;
  private readonly cache: Map<string, { data: unknown[]; expiry: number }>;
  private readonly cacheTTL: number;

  constructor(config: GrafanaClientConfig) {
    const baseUrl = config.baseUrl.replace(/\/$/, '');
    this.datasource = config.datasource ?? DEFAULT_DATASOURCE;
    this.cache = new Map();
    this.cacheTTL = config.cacheTTL ?? 5 * 60 * 1000; // 默认 5 分钟

    this.client = got.extend({
      prefixUrl: baseUrl,
      headers: {
        Authorization: `Bearer ${config.token}`,
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * 生成缓存键
   */
  private generateCacheKey(sql: string, timeRange?: { from: string; to: string }): string {
    return JSON.stringify({ sql, from: timeRange?.from, to: timeRange?.to });
  }

  /**
   * 清理过期缓存
   */
  private cleanExpiredCache(): void {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (value.expiry < now) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * 清空所有缓存
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * 执行 SQL 查询并返回解析后的数据
   */
  async query<T>(
    rawSql: string,
    options: QueryOptions = {}
  ): Promise<T[]> {
    const sql = this.replaceVariables(rawSql, options.variables ?? {});
    const cacheKey = this.generateCacheKey(sql, options.timeRange);

    // 检查缓存
    const cached = this.cache.get(cacheKey);
    if (cached && cached.expiry > Date.now()) {
      return cached.data as T[];
    }

    // 执行查询
    const response = await this.executeQuery(sql, options.timeRange);
    const data = this.parseResponse<T>(response);

    // 存入缓存
    this.cache.set(cacheKey, {
      data,
      expiry: Date.now() + this.cacheTTL,
    });

    // 定期清理过期缓存
    if (this.cache.size > 100) {
      this.cleanExpiredCache();
    }

    return data;
  }

  /**
   * 替换 SQL 中的变量
   */
  private replaceVariables(
    sql: string,
    variables: Record<string, string | number>
  ): string {
    let result = sql;
    for (const [key, value] of Object.entries(variables)) {
      const escapedValue = this.escapeValue(value);
      result = result.replace(new RegExp(`\\$\\{${key}\\}`, 'g'), escapedValue);
      result = result.replace(new RegExp(`\\$${key}\\b`, 'g'), escapedValue);
    }
    return result;
  }

  /**
   * 转义 SQL 值
   */
  private escapeValue(value: string | number): string {
    if (typeof value === 'number') {
      return String(value);
    }
    return value.replace(/'/g, "''");
  }

  /**
   * 执行 Grafana API 查询
   */
  private async executeQuery(
    sql: string,
    timeRange?: { from: string; to: string }
  ): Promise<GrafanaQueryResponse> {
    const body = {
      queries: [
        {
          refId: 'A',
          datasource: this.datasource,
          rawSql: sql,
          format: 'table' as const,
        },
      ],
      from: timeRange?.from ?? 'now-24h',
      to: timeRange?.to ?? 'now',
    };

    try {
      const response = await this.client.post('api/ds/query', {
        json: body,
      }).json<GrafanaQueryResponse>();
      return response;
    } catch (error) {
      if (error instanceof HTTPError) {
        const bodyText = typeof error.response.body === 'string'
          ? error.response.body
          : JSON.stringify(error.response.body);
        throw new GrafanaApiError(
          `Grafana API error: ${error.response.statusCode} - ${bodyText}`,
          error.response.statusCode,
          bodyText
        );
      }
      throw error;
    }
  }

  /**
   * 解析 Grafana 响应为对象数组
   */
  private parseResponse<T>(
    data: GrafanaQueryResponse
  ): T[] {
    const result = data.results?.A;

    if (result?.error) {
      throw new GrafanaQueryError(result.error);
    }

    const frames = result?.frames ?? [];
    if (frames.length === 0) {
      return [];
    }

    const frame = frames[0];
    const fields = frame.schema?.fields ?? [];
    const values = frame.data?.values ?? [];

    const rows: T[] = [];
    const rowCount = values[0]?.length ?? 0;

    for (let i = 0; i < rowCount; i++) {
      const row = {} as Record<string, unknown>;
      fields.forEach((field, idx) => {
        row[field.name] = values[idx]?.[i];
      });
      rows.push(row as T);
    }

    return rows;
  }
}
