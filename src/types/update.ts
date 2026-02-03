/** 软件更新记录 */
export interface UpdateRecord {
  id: number;
  version: string;
  start_date: string;
  end_date: string | null;
  duration_min: number;
}

/** 更新统计 */
export interface UpdateStats {
  total_updates: number;
  median_interval_days: number;
  current_version: string;
}

/** 更新查询参数 */
export interface UpdateQueryParams {
  carId: number;
  from?: string;
  to?: string;
  limit?: number;
}
