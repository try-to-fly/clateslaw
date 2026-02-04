/** 查询类型 */
export type QueryType =
  | 'drives'
  | 'charges'
  | 'battery'
  | 'efficiency'
  | 'states'
  | 'updates'
  | 'mileage'
  | 'vampire'
  | 'locations'
  | 'locations.charging'
  | 'timeline'
  | 'visited'
  | 'projected-range'
  | 'stats.charging'
  | 'stats.driving'
  | 'stats.period'
  | 'detail.drive'
  | 'detail.charge'
  | 'screenshot'
  | 'car'
  | 'cars';

/** 语义时间 */
export type SemanticTime =
  | 'today'
  | 'yesterday'
  | 'this_week'
  | 'last_week'
  | 'this_month'
  | 'last_month'
  | 'this_year'
  | 'last_year'
  | 'last_3_days'
  | 'last_7_days'
  | 'last_30_days'
  | 'last_90_days'
  | 'all_time';

/** 时间范围 */
export interface TimeRange {
  semantic?: SemanticTime;
  relative?: { from: string; to?: string };
  absolute?: { from: string; to: string };
}

/** 过滤条件操作符 */
export type FilterOperator =
  | 'eq'
  | 'ne'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'in'
  | 'contains'
  | 'between';

/** 过滤条件 */
export interface FilterCondition {
  field: string;
  operator: FilterOperator;
  value: string | number | boolean | (string | number)[];
}

/** 排序配置 */
export interface SortConfig {
  field: string;
  direction: 'asc' | 'desc';
}

/** 分页配置 */
export interface PaginationConfig {
  limit?: number;
  offset?: number;
}

/** 截图配置 */
export interface ScreenshotConfig {
  type: 'drive' | 'charge' | 'daily' | 'weekly' | 'monthly';
  id?: number;
  date?: string;
  send?: boolean;
}

/** 额外参数 */
export interface ExtraParams {
  minDuration?: number;
  minDistance?: number;
  top?: number;
}

/** 查询协议主体 */
export interface TeslaQuery {
  version: '1.0';
  type: QueryType;
  carId?: number;
  recordId?: number;
  timeRange?: TimeRange;
  filters?: FilterCondition[];
  sort?: SortConfig;
  pagination?: PaginationConfig;
  output?: 'table' | 'json' | 'summary';
  period?: 'day' | 'week' | 'month' | 'year';
  screenshot?: ScreenshotConfig;
  extra?: ExtraParams;
  rawQuery?: string;
}

/** 解析后的时间范围 */
export interface ResolvedTimeRange {
  from: string;
  to: string;
}
