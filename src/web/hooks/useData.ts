import type { DriveRecord, DrivePosition } from '../../types/drive';
import type { ChargeRecord, ChargeCurvePoint } from '../../types/charge';
import type { HomeData } from '../demo/home';
import {
  demoHomeData,
  demoDriveData,
  demoChargeData,
  demoDailyData,
} from '../demo';

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
  allPositions: DrivePosition[][];
  stats: {
    totalDistance: number;
    totalDuration: number;
    totalEnergyUsed: number;
    totalEnergyAdded: number;
  };
}

export interface WeeklyData {
  period: string;
  periodLabel: string;
  drives: DriveRecord[];
  charges: ChargeRecord[];
  allPositions: DrivePosition[][];
  stats: {
    totalDistance: number;
    totalDuration: number;
    totalDrives: number;
    totalCharges: number;
    totalEnergyUsed: number;
    totalEnergyAdded: number;
    totalCost: number;
    avgEfficiency: number;
  };
  comparison?: {
    distanceChange: number;
    distanceChangePercent: number;
    energyChange: number;
    energyChangePercent: number;
  };
}

export interface MonthlyData {
  period: string;
  periodLabel: string;
  drives: DriveRecord[];
  charges: ChargeRecord[];
  allPositions: DrivePosition[][];
  stats: {
    totalDistance: number;
    totalDuration: number;
    totalDrives: number;
    totalCharges: number;
    totalEnergyUsed: number;
    totalEnergyAdded: number;
    totalCost: number;
    avgEfficiency: number;
  };
  comparison?: {
    distanceChange: number;
    distanceChangePercent: number;
    energyChange: number;
    energyChangePercent: number;
  };
}

export interface YearlyData {
  year: number;
  periodLabel: string;
  stats: {
    totalDistance: number;
    totalDuration: number;
    totalDrives: number;
    totalCharges: number;
    totalEnergyUsed: number;
    totalEnergyAdded: number;
    totalCost: number;
    avgEfficiency: number;
  };
  monthlyBreakdown: Array<{
    month: number;
    distance: number;
    duration: number;
    drives: number;
    charges: number;
    energyUsed: number;
    energyAdded: number;
    cost: number;
  }>;
  comparison?: {
    distanceChange: number;
    distanceChangePercent: number;
    energyChange: number;
    energyChangePercent: number;
  };
}

export type TeslaData = DriveData | ChargeData | DailyData | HomeData | WeeklyData | MonthlyData | YearlyData;

function getDemoData(): TeslaData | null {
  if (!import.meta.env.DEV) {
    return null;
  }

  const path = window.location.pathname;

  if (path === '/') return demoHomeData;
  if (path.startsWith('/drive')) return demoDriveData;
  if (path.startsWith('/charge')) return demoChargeData;
  if (path.startsWith('/daily')) return demoDailyData;

  return null;
}

export function useData<T extends TeslaData>(): T | null {
  // Puppeteer 注入的数据优先
  if (window.__TESLA_DATA__) {
    return window.__TESLA_DATA__ as T;
  }

  // 开发模式下使用 demo 数据
  return getDemoData() as T | null;
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
