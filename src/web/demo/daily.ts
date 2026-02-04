import type { DriveRecord, DrivePosition } from '../../types/drive';
import type { ChargeRecord } from '../../types/charge';

export interface DemoDailyData {
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

function generateDemoDrives(): DriveRecord[] {
  const locations = [
    { start: '北京市朝阳区', end: '北京市海淀区' },
    { start: '北京市海淀区', end: '北京市朝阳区' },
    { start: '北京市朝阳区', end: '北京市东城区' },
    { start: '北京市东城区', end: '北京市西城区' },
    { start: '北京市西城区', end: '北京市丰台区' },
    { start: '北京市丰台区', end: '北京市通州区' },
    { start: '北京市通州区', end: '北京市大兴区' },
    { start: '北京市大兴区', end: '北京市顺义区' },
    { start: '北京市顺义区', end: '北京市昌平区' },
    { start: '北京市昌平区', end: '北京市朝阳区' },
  ];

  const distances = [23.64, 37.36, 18.5, 42.1, 15.8, 28.9, 33.2, 19.7, 45.3, 12.4,
                     26.8, 31.5, 22.1, 38.7, 16.9, 29.4, 35.6, 21.3, 40.2, 14.7];
  const durations = [33, 49, 30, 55, 25, 40, 45, 28, 58, 20,
                     35, 42, 32, 50, 26, 38, 48, 30, 52, 22];
  const speedMaxes = [100, 113, 85, 120, 78, 95, 108, 82, 118, 72,
                      102, 110, 88, 115, 80, 98, 112, 86, 117, 75];
  const powerMaxes = [158, 176, 120, 185, 105, 145, 165, 115, 180, 95,
                      160, 172, 125, 178, 110, 150, 168, 122, 182, 100];
  const temps = [7.2, 9.8, 12.3, 8.5, 11.0, 6.8, 10.2, 13.5, 7.9, 14.1,
                 8.8, 10.5, 11.8, 7.5, 12.8, 9.2, 6.5, 13.0, 8.0, 11.5];

  const drives: DriveRecord[] = [];
  const baseDate = new Date('2026-02-03T06:00:00.000Z');

  for (let i = 0; i < 20; i++) {
    const locationPair = locations[i % locations.length];
    const duration = durations[i];
    const startTime = new Date(baseDate.getTime() + i * 45 * 60 * 1000);
    const endTime = new Date(startTime.getTime() + duration * 60 * 1000);

    drives.push({
      id: 4275 - i,
      start_date: startTime.toISOString(),
      end_date: endTime.toISOString(),
      distance: distances[i],
      duration_min: duration,
      speed_max: speedMaxes[i],
      power_max: powerMaxes[i],
      outside_temp_avg: temps[i],
      start_location: locationPair.start,
      end_location: locationPair.end,
      ascent: Math.round(20 + Math.random() * 60),
      descent: Math.round(15 + Math.random() * 50),
    });
  }

  return drives;
}

const demoDrives = generateDemoDrives();

// 生成两条模拟轨迹数据（海淀↔朝阳）
function generateDemoAllPositions(): DrivePosition[][] {
  // 第一条轨迹：海淀区 → 朝阳区
  const route1 = [
    { lat: 39.9842, lng: 116.2980 },
    { lat: 39.9790, lng: 116.3060 },
    { lat: 39.9755, lng: 116.3140 },
    { lat: 39.9720, lng: 116.3220 },
    { lat: 39.9690, lng: 116.3300 },
    { lat: 39.9655, lng: 116.3380 },
    { lat: 39.9620, lng: 116.3460 },
    { lat: 39.9590, lng: 116.3540 },
    { lat: 39.9555, lng: 116.3620 },
    { lat: 39.9520, lng: 116.3700 },
    { lat: 39.9490, lng: 116.3780 },
    { lat: 39.9455, lng: 116.3860 },
    { lat: 39.9420, lng: 116.3940 },
    { lat: 39.9390, lng: 116.4020 },
    { lat: 39.9355, lng: 116.4100 },
    { lat: 39.9320, lng: 116.4180 },
    { lat: 39.9290, lng: 116.4250 },
    { lat: 39.9260, lng: 116.4320 },
    { lat: 39.9235, lng: 116.4380 },
    { lat: 39.9219, lng: 116.4435 },
  ];

  // 第二条轨迹：朝阳区 → 海淀区（原路返回）
  const route2 = [...route1].reverse();

  const generatePositionsFromRoute = (
    route: { lat: number; lng: number }[],
    startTimeStr: string,
    durationMin: number
  ): DrivePosition[] => {
    const positions: DrivePosition[] = [];
    const startTime = new Date(startTimeStr).getTime();
    const duration = durationMin * 60 * 1000;

    for (let i = 0; i < route.length; i++) {
      const progress = i / (route.length - 1);
      const time = startTime + duration * progress;
      const point = route[i];

      let speed: number;
      if (progress < 0.1) {
        speed = Math.round(20 + progress * 400);
      } else if (progress > 0.9) {
        speed = Math.round(60 - (progress - 0.9) * 400);
      } else {
        speed = Math.round(50 + Math.sin(progress * Math.PI) * 50);
      }

      const power = Math.round(speed * 1.2 + Math.random() * 20);

      positions.push({
        latitude: point.lat,
        longitude: point.lng,
        date: new Date(time).toISOString(),
        battery_level: Math.round(95 - progress * 3),
        speed,
        power,
        odometer: 115496 + progress * 23.64,
      });
    }

    return positions;
  };

  return [
    generatePositionsFromRoute(route1, '2026-02-03T07:30:12.358Z', 49),
    generatePositionsFromRoute(route2, '2026-02-03T08:23:09.013Z', 33),
  ];
}

const demoAllPositions = generateDemoAllPositions();

export const demoDailyData: DemoDailyData = {
  date: '2026-02-03',
  drives: demoDrives,
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
  allPositions: demoAllPositions,
  stats: {
    totalDistance: demoDrives.reduce((sum, d) => sum + d.distance, 0),
    totalDuration: demoDrives.reduce((sum, d) => sum + d.duration_min, 0),
    totalEnergyUsed: 33,
    totalEnergyAdded: 31.72,
  },
};
