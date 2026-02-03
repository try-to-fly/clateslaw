/** 吸血鬼耗电记录 */
export interface VampireRecord {
  start_date: string;
  end_date: string;
  duration_sec: number;
  standby_percent: number;
  soc_diff: number;
  range_loss: number;
  range_loss_per_hour: number;
  energy_drained: number;
  avg_power: number;
}

/** 吸血鬼耗电统计 */
export interface VampireStats {
  total_records: number;
  total_energy_drained: number;
  avg_range_loss_per_hour: number;
  avg_standby_percent: number;
}

/** 吸血鬼耗电查询参数 */
export interface VampireQueryParams {
  carId: number;
  from?: string;
  to?: string;
  minDuration?: number;
}
