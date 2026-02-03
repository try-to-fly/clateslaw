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
