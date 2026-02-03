import type { DriveRecord } from '../../types/drive';
import type { ChargeRecord } from '../../types/charge';

export interface HomeData {
  car: {
    name: string;
    model: string;
    vin: string;
  };
  overview: {
    battery_level: number;
    range_km: number;
    odometer_km: number;
    software_version: string;
    state: string;
  };
  recentDrive: DriveRecord | null;
  recentCharge: ChargeRecord | null;
}

export const demoHomeData: HomeData = {
  car: {
    name: 'Tesla Model 3',
    model: 'Model 3',
    vin: 'LRW3E7FA5MC******',
  },
  overview: {
    battery_level: 92,
    range_km: 358,
    odometer_km: 115520,
    software_version: '2025.44.25',
    state: 'online',
  },
  recentDrive: {
    id: 4275,
    start_date: '2026-02-03T08:23:09.013Z',
    end_date: '2026-02-03T08:55:39.342Z',
    distance: 23.64,
    duration_min: 33,
    speed_max: 100,
    power_max: 158,
    outside_temp_avg: 7.2,
    start_location: '北京市朝阳区',
    end_location: '北京市海淀区',
  },
  recentCharge: {
    id: 785,
    start_date: '2026-02-02T21:20:10.931Z',
    end_date: '2026-02-03T02:06:05.392Z',
    charge_energy_added: 31.72,
    charge_energy_used: 33,
    start_battery_level: 37,
    end_battery_level: 100,
    duration_min: 286,
    cost: null,
    location: '家用充电桩',
  },
};
