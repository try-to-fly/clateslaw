import type { DriveRecord, DrivePosition } from '../../types/drive';

export interface DemoDriveData {
  drive: DriveRecord;
  positions: DrivePosition[];
}

function generateDemoPositions(): DrivePosition[] {
  const positions: DrivePosition[] = [];
  const startTime = new Date('2026-02-03T08:23:09.013Z').getTime();
  const duration = 33 * 60 * 1000;
  const pointCount = 20;

  // 北京朝阳区到海淀区的模拟路线
  const route = [
    { lat: 39.9219, lng: 116.4435 }, // 朝阳区起点
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
    { lat: 39.9842, lng: 116.2980 }, // 海淀区终点
  ];

  // 预设速度序列，模拟真实驾驶场景：起步-加速-高速-减速-等红灯-再加速-到达
  const speedPattern = [
    10,   // 0: 起步
    25,   // 1: 加速中
    45,   // 2: 城市道路
    65,   // 3: 快速路入口
    90,   // 4: 快速路
    105,  // 5: 快速路高速
    95,   // 6: 快速路
    85,   // 7: 准备下匝道
    55,   // 8: 匝道
    35,   // 9: 等红灯前减速
    5,    // 10: 等红灯
    20,   // 11: 起步
    50,   // 12: 城市道路
    70,   // 13: 加速
    85,   // 14: 较快
    60,   // 15: 减速
    40,   // 16: 接近目的地
    25,   // 17: 减速
    15,   // 18: 找车位
    0,    // 19: 停车
  ];

  for (let i = 0; i < pointCount; i++) {
    const progress = i / (pointCount - 1);
    const time = startTime + duration * progress;
    const point = route[i];

    const speed = speedPattern[i];

    // 模拟功率变化
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

export const demoDriveData: DemoDriveData = {
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
  positions: generateDemoPositions(),
};
