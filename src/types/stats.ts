/** 充电统计数据 */
export interface ChargingStats {
  total_charges: number;
  total_energy_added: number;
  total_energy_used: number;
  total_cost: number;
  suc_cost: number;
  avg_cost_per_kwh: number;
  charging_efficiency: number;
}

/** 充电统计查询参数 */
export interface ChargingStatsQueryParams {
  carId: number;
  from?: string;
  to?: string;
  minDuration?: number;
}

/** 行驶统计数据 */
export interface DrivingStats {
  total_drives: number;
  total_distance: number;
  total_energy_consumed: number;
  median_distance: number;
  avg_speed: number;
  max_speed: number;
  total_duration_min: number;
}

/** 行驶统计查询参数 */
export interface DrivingStatsQueryParams {
  carId: number;
  from?: string;
  to?: string;
}

/** 周期统计数据 */
export interface PeriodStats {
  period: string;
  drives: number;
  distance: number;
  energy_consumed: number;
  charges: number;
  energy_added: number;
  cost: number;
}

/** 周期统计查询参数 */
export interface PeriodStatsQueryParams {
  carId: number;
  from?: string;
  to?: string;
  period?: 'day' | 'week' | 'month' | 'year';
}
