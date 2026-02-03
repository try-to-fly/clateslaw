/** 电池健康数据 */
export interface BatteryHealth {
  usable_capacity_now: number;
  usable_capacity_new: number;
  capacity_difference: number;
  max_range_new: number;
  max_range_now: number;
  range_lost: number;
  degradation_percent: number;
  battery_health_percent: number;
  current_soc: number;
  current_stored_energy: number;
  efficiency: number;
}

/** 电池充电统计 */
export interface BatteryChargingStats {
  total_charges: number;
  charging_cycles: number;
  total_energy_added: number;
  total_energy_used: number;
  charging_efficiency: number;
  ac_energy: number;
  dc_energy: number;
}

/** 电池里程统计 */
export interface BatteryDriveStats {
  logged_distance: number;
  mileage: number;
  odometer: number;
  data_lost: number;
}

/** 电池查询参数 */
export interface BatteryQueryParams {
  carId: number;
  lengthUnit?: 'km' | 'mi';
  preferredRange?: 'ideal' | 'rated';
}
