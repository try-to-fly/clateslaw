export type VehicleState =
  | 'online'
  | 'asleep'
  | 'charging'
  | 'driving'
  | 'suspended'
  | 'offline'
  | 'updating';

export type ChargingState =
  | 'Charging'
  | 'Complete'
  | 'Disconnected'
  | 'NoPower'
  | 'Stopped'
  | 'Starting';

export interface RangeSnapshot {
  range_km: number;
  battery_level: number;
  timestamp: number;
}

export interface StateTracker {
  vehicleState: VehicleState | null;
  chargingState: ChargingState | null;
  lastDriveTrigger: number;
  lastChargeTrigger: number;
  lastOfflineRange: RangeSnapshot | null;
  lastOnlineTrigger: number;
  // 新增字段
  sleepStartTime: number | null;
  updateAvailable: boolean;
  updateVersion: string | null;
  lastUpdateNotifyTime: number;
}

export interface PersistedMqttState {
  vehicleState: VehicleState | null;
  chargingState: ChargingState | null;
  lastDriveTrigger: number;
  lastChargeTrigger: number;
  lastOfflineRange: RangeSnapshot | null;
  lastOnlineTrigger: number;
  sleepStartTime: number | null;
  updateAvailable: boolean;
  updateVersion: string | null;
  lastUpdateNotifyTime: number;
  lastUpdated: number;
}

export const SLEEP_STATES: VehicleState[] = ['asleep', 'offline', 'suspended'];
