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

export interface StateTracker {
  vehicleState: VehicleState | null;
  chargingState: ChargingState | null;
  lastDriveTrigger: number;
  lastChargeTrigger: number;
}
