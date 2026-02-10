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
  updateAvailable: boolean;
  updateVersion: string | null;
  lastUpdateNotifyTime: number;
  lastParkStart: ParkingSnapshot | null;
  lastParkNotifyTime: number;
  lastChargeStart: ParkingSnapshot | null;

  // Location-aware "park recommendation" push control
  lastParkRecommendCenter: { latitude: number; longitude: number } | null;
  lastParkRecommendTime: number;
}

export interface PersistedMqttState {
  vehicleState: VehicleState | null;
  chargingState: ChargingState | null;
  lastDriveTrigger: number;
  lastChargeTrigger: number;
  updateAvailable: boolean;
  updateVersion: string | null;
  lastUpdateNotifyTime: number;
  lastParkStart: ParkingSnapshot | null;
  lastParkNotifyTime: number;
  lastChargeStart: ParkingSnapshot | null;

  lastParkRecommendCenter: { latitude: number; longitude: number } | null;
  lastParkRecommendTime: number;

  lastUpdated: number;
}