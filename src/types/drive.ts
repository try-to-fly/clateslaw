/** 行程记录 */
export interface DriveRecord {
  id: number;
  start_date: string;
  end_date: string;
  distance: number;
  duration_min: number;
  speed_max: number;
  power_max: number;
  outside_temp_avg: number;
  start_location: string;
  end_location: string;
}

/** 行程查询参数 */
export interface DriveQueryParams {
  from?: string;
  to?: string;
  limit?: number;
}

/** GPS 位置点 */
export interface DrivePosition {
  latitude: number;
  longitude: number;
  date: string;
  battery_level: number;
  speed: number;
  power: number;
  odometer: number;
}
