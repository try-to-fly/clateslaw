/** 位置统计 */
export interface LocationStats {
  total_addresses: number;
  total_cities: number;
  total_states: number;
  total_countries: number;
}

/** 位置记录 */
export interface LocationRecord {
  name: string;
  city: string;
  state: string;
  country: string;
  visit_count: number;
  total_charges: number;
  total_energy_added: number;
}

/** 位置查询参数 */
export interface LocationQueryParams {
  carId: number;
  from?: string;
  to?: string;
  top?: number;
}

/** 充电站统计记录 */
export interface ChargingStationRecord {
  name: string;
  city: string;
  state: string;
  total_charges: number;
  total_energy_added: number;
  avg_power_kw: number;
  avg_duration_min: number;
  total_cost: number;
  is_supercharger: boolean;
}

/** 充电站汇总统计 */
export interface ChargingStationSummary {
  total_stations: number;
  supercharger_count: number;
  home_charging_count: number;
  other_charging_count: number;
  supercharger_ratio: number;
  stations: ChargingStationRecord[];
}
