import got, { type Got, HTTPError } from 'got';
import type {
  GrafanaClientConfig,
  GrafanaDataSource,
  GrafanaQueryResponse,
  QueryOptions,
} from '../types/grafana.js';

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

  constructor(config: GrafanaClientConfig) {
    const baseUrl = config.baseUrl.replace(/\/$/, '');
    this.datasource = config.datasource ?? DEFAULT_DATASOURCE;

    this.client = got.extend({
      prefixUrl: baseUrl,
      headers: {
        Authorization: `Bearer ${config.token}`,
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * 执行 SQL 查询并返回解析后的数据
   */
  async query<T>(
    rawSql: string,
    options: QueryOptions = {}
  ): Promise<T[]> {
    const sql = this.replaceVariables(rawSql, options.variables ?? {});
    const response = await this.executeQuery(sql, options.timeRange);
    return this.parseResponse<T>(response);
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
