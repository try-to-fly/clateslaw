/** 时间线事件 */
export interface TimelineEvent {
  start_date: string;
  end_date: string;
  action: string;
  start_address: string;
  end_address: string;
  duration_min: number;
  soc_start: number;
  soc_end: number;
  soc_diff: number;
  energy_kwh: number;
  distance: number;
  odometer: number;
}

/** 时间线查询参数 */
export interface TimelineQueryParams {
  carId: number;
  from?: string;
  to?: string;
  limit?: number;
}
