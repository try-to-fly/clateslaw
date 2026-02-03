/** Grafana 数据源配置 */
export interface GrafanaDataSource {
  type: string;
  uid: string;
}

/** Grafana 查询请求 */
export interface GrafanaQueryRequest {
  queries: Array<{
    refId: string;
    datasource: GrafanaDataSource;
    rawSql: string;
    format: 'table' | 'time_series';
  }>;
  from: string;
  to: string;
}

/** Grafana 响应字段 schema */
export interface GrafanaFieldSchema {
  name: string;
  type: 'number' | 'string' | 'time' | 'boolean';
}

/** Grafana 数据帧 */
export interface GrafanaFrame {
  schema: {
    fields: GrafanaFieldSchema[];
  };
  data: {
    values: unknown[][];
  };
}

/** Grafana 查询响应 */
export interface GrafanaQueryResponse {
  results: {
    [refId: string]: {
      frames: GrafanaFrame[];
      error?: string;
    };
  };
}

/** 查询选项 */
export interface QueryOptions {
  variables?: Record<string, string | number>;
  timeRange?: {
    from: string;
    to: string;
  };
}

/** 客户端配置 */
export interface GrafanaClientConfig {
  baseUrl: string;
  token: string;
  datasource?: GrafanaDataSource;
}
