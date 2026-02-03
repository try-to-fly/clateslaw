import type { DriveRecord } from '../../types/drive';
import type { ChargeRecord } from '../../types/charge';

export interface DemoDailyData {
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

export const demoDailyData: DemoDailyData = {
  date: '2026-02-03',
  drives: [
    {
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
    {
      id: 4273,
      start_date: '2026-02-03T07:30:12.358Z',
      end_date: '2026-02-03T08:19:22.480Z',
      distance: 37.36,
      duration_min: 49,
      speed_max: 113,
      power_max: 176,
      outside_temp_avg: 9.8,
      start_location: '北京市海淀区',
      end_location: '北京市朝阳区',
    },
  ],
  charges: [
    {
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
  ],
  stats: {
    totalDistance: 61.0,
    totalDuration: 82,
    totalEnergyUsed: 33,
    totalEnergyAdded: 31.72,
  },
};
