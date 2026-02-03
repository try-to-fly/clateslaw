/** 车辆基本信息 */
export interface Car {
  id: number;
  name: string;
  vin: string;
  model: string;
  efficiency: number;
  display_priority: number;
}

/** 车辆状态 */
export type CarState =
  | 'online'
  | 'offline'
  | 'asleep'
  | 'charging'
  | 'driving'
  | 'updating';

/** 车辆概览信息 */
export interface CarOverview {
  battery_level: number;
  range_km: number;
  odometer_km: number;
  software_version: string;
  last_update: string;
  state: CarState;
}
