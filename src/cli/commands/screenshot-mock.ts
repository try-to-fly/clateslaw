import type { DriveRecord, DrivePosition } from '../../types/drive.js';
import type { ChargeRecord, ChargeCurvePoint } from '../../types/charge.js';

export interface MockDriveData {
  drive: DriveRecord;
  positions: DrivePosition[];
}

export interface MockChargeData {
  charge: ChargeRecord;
  curve: ChargeCurvePoint[];
}

export interface MockDailyData {
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

function generateMockPositions(): DrivePosition[] {
  const positions: DrivePosition[] = [];
  const startTime = new Date('2026-02-03T08:23:09.013Z').getTime();
  const duration = 33 * 60 * 1000;
  const pointCount = 20;

  // 北京朝阳区到海淀区的模拟路线
  const route = [
    { lat: 39.9219, lng: 116.4435 },
    { lat: 39.9235, lng: 116.4380 },
    { lat: 39.9260, lng: 116.4320 },
    { lat: 39.9290, lng: 116.4250 },
    { lat: 39.9320, lng: 116.4180 },
    { lat: 39.9355, lng: 116.4100 },
    { lat: 39.9390, lng: 116.4020 },
    { lat: 39.9420, lng: 116.3940 },
    { lat: 39.9455, lng: 116.3860 },
    { lat: 39.9490, lng: 116.3780 },
    { lat: 39.9520, lng: 116.3700 },
    { lat: 39.9555, lng: 116.3620 },
    { lat: 39.9590, lng: 116.3540 },
    { lat: 39.9620, lng: 116.3460 },
    { lat: 39.9655, lng: 116.3380 },
    { lat: 39.9690, lng: 116.3300 },
    { lat: 39.9720, lng: 116.3220 },
    { lat: 39.9755, lng: 116.3140 },
    { lat: 39.9790, lng: 116.3060 },
    { lat: 39.9842, lng: 116.2980 },
  ];

  for (let i = 0; i < pointCount; i++) {
    const progress = i / (pointCount - 1);
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
}

function generateMockChargeCurve(): ChargeCurvePoint[] {
  const curve: ChargeCurvePoint[] = [];
  const startTime = new Date('2026-02-02T21:20:10.931Z').getTime();
  const duration = 286 * 60 * 1000;
  const pointCount = 30;

  const startBattery = 37;
  const endBattery = 100;
  const totalEnergy = 31.72;

  for (let i = 0; i < pointCount; i++) {
    const progress = i / (pointCount - 1);
    const time = startTime + duration * progress;

    const batteryProgress = 1 - Math.pow(1 - progress, 1.5);
    const batteryLevel = Math.round(startBattery + (endBattery - startBattery) * batteryProgress);

    let chargerPower: number;
    if (batteryLevel < 80) {
      chargerPower = 7.2 + Math.random() * 0.3;
    } else if (batteryLevel < 90) {
      chargerPower = 5.5 + Math.random() * 0.5;
    } else {
      chargerPower = 3.0 + Math.random() * 0.5;
    }

    const chargerVoltage = 220 + Math.random() * 5;
    const chargerActualCurrent = (chargerPower * 1000) / chargerVoltage;
    const chargeEnergyAdded = totalEnergy * progress;
    const ratedBatteryRangeKm = Math.round(batteryLevel * 3.9);

    curve.push({
      date: new Date(time).toISOString(),
      battery_level: batteryLevel,
      usable_battery_level: batteryLevel - 1,
      charger_power: Math.round(chargerPower * 100) / 100,
      charger_voltage: Math.round(chargerVoltage),
      charger_actual_current: Math.round(chargerActualCurrent * 10) / 10,
      charge_energy_added: Math.round(chargeEnergyAdded * 100) / 100,
      rated_battery_range_km: ratedBatteryRangeKm,
    });
  }

  return curve;
}

export function getMockDriveData(): MockDriveData {
  return {
    drive: {
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
      ascent: 45,
      descent: 32,
    },
    positions: generateMockPositions(),
  };
}

export function getMockChargeData(): MockChargeData {
  return {
    charge: {
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
    curve: generateMockChargeCurve(),
  };
}

function generateMockDrives(): DriveRecord[] {
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

  const drives: DriveRecord[] = [];
  const baseDate = new Date('2026-02-03T06:00:00.000Z');

  for (let i = 0; i < 20; i++) {
    const locationPair = locations[i % locations.length];
    const duration = 20 + Math.floor(Math.random() * 40);
    const startTime = new Date(baseDate.getTime() + i * 45 * 60 * 1000);
    const endTime = new Date(startTime.getTime() + duration * 60 * 1000);

    drives.push({
      id: 4275 - i,
      start_date: startTime.toISOString(),
      end_date: endTime.toISOString(),
      distance: Math.round((10 + Math.random() * 30) * 100) / 100,
      duration_min: duration,
      speed_max: 70 + Math.floor(Math.random() * 50),
      power_max: 100 + Math.floor(Math.random() * 80),
      outside_temp_avg: Math.round((5 + Math.random() * 10) * 10) / 10,
      start_location: locationPair.start,
      end_location: locationPair.end,
      ascent: Math.round(20 + Math.random() * 60),
      descent: Math.round(15 + Math.random() * 50),
    });
  }

  return drives;
}

// 生成多条轨迹数据用于日报地图
function generateMockAllPositions(): DrivePosition[][] {
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

export function getMockDailyData(): MockDailyData {
  const drives = generateMockDrives();
  const totalDistance = drives.reduce((sum, d) => sum + d.distance, 0);
  const totalDuration = drives.reduce((sum, d) => sum + d.duration_min, 0);
  const allPositions = generateMockAllPositions();

  return {
    date: '2026-02-03',
    drives,
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
    allPositions,
    stats: {
      totalDistance: Math.round(totalDistance * 100) / 100,
      totalDuration,
      totalEnergyUsed: 33,
      totalEnergyAdded: 31.72,
    },
  };
}
