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

export interface ParkingSnapshot {
  timestamp: number;
  rated_range_km: number | null;
  usable_battery_level: number | null;
}

export interface StateTracker {
  vehicleState: VehicleState | null;
  chargingState: ChargingState | null;
  lastDriveTrigger: number;
  lastChargeTrigger: number;
  lastOfflineRange: RangeSnapshot | null;
  lastOnlineTrigger: number;
  // New fields
  sleepStartTime: number | null;
  updateAvailable: boolean;
  updateVersion: string | null;
  lastUpdateNotifyTime: number;
  lastParkStart: ParkingSnapshot | null;
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
  lastParkStart: ParkingSnapshot | null;
  lastUpdated: number;
}

export const SLEEP_STATES: VehicleState[] = ['asleep', 'offline', 'suspended'];
