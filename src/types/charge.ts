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
