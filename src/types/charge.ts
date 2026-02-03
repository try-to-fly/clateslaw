/** 充电记录 */
export interface ChargeRecord {
  id: number;
  start_date: string;
  end_date: string;
  charge_energy_added: number;
  charge_energy_used: number;
  start_battery_level: number;
  end_battery_level: number;
  duration_min: number;
  cost: number | null;
  location: string;
}

/** 充电查询参数 */
export interface ChargeQueryParams {
  from?: string;
  to?: string;
  limit?: number;
}

/** 充电曲线数据点 */
export interface ChargeCurvePoint {
  date: string;
  battery_level: number;
  usable_battery_level: number;
  charger_power: number;
  charger_voltage: number;
  charger_actual_current: number;
  charge_energy_added: number;
  rated_battery_range_km: number;
}
