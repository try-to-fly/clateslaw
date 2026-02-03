import type { DriveRecord, DrivePosition } from '../../types/drive';
import type { ChargeRecord, ChargeCurvePoint } from '../../types/charge';

declare global {
  interface Window {
    __TESLA_DATA__?: TeslaData;
  }
}

export interface DriveData {
  drive: DriveRecord;
  positions: DrivePosition[];
}

export interface ChargeData {
  charge: ChargeRecord;
  curve: ChargeCurvePoint[];
}

export interface DailyData {
  date: string;
  drives: DriveRecord[];
  charges: ChargeRecord[];
  stats: {
    totalDistance: number;
    totalDuration: number;
    totalEnergyUsed: number;
    totalEnergyAdded: number;
  };
}

export type TeslaData = DriveData | ChargeData | DailyData;

export function useData<T extends TeslaData>(): T | null {
  return (window.__TESLA_DATA__ as T) ?? null;
}

export function isDriveData(data: TeslaData): data is DriveData {
  return 'drive' in data && 'positions' in data;
}

export function isChargeData(data: TeslaData): data is ChargeData {
  return 'charge' in data && 'curve' in data;
}

export function isDailyData(data: TeslaData): data is DailyData {
  return 'date' in data && 'drives' in data && 'charges' in data;
}
