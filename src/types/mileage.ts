/** 里程记录 */
export interface MileageRecord {
  date: string;
  odometer: number;
  daily_distance: number;
}

/** 里程统计 */
export interface MileageStats {
  current_odometer: number;
  total_logged: number;
  avg_daily: number;
  avg_monthly: number;
}

/** 里程查询参数 */
export interface MileageQueryParams {
  carId: number;
  from?: string;
  to?: string;
}
