/** 车辆状态记录 */
export interface StateRecord {
  id: number;
  state: string;
  start_date: string;
  end_date: string | null;
  duration_min: number;
}

/** 状态统计 */
export interface StateStats {
  state: string;
  count: number;
  total_duration_min: number;
  percentage: number;
}

/** 状态查询参数 */
export interface StateQueryParams {
  carId: number;
  from?: string;
  to?: string;
  limit?: number;
}
