import type { ChargeRecord, ChargeCurvePoint } from '../../types/charge';

export interface DemoChargeData {
  charge: ChargeRecord;
  curve: ChargeCurvePoint[];
}

function generateDemoChargeCurve(): ChargeCurvePoint[] {
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

    // 电池电量：非线性增长（开始快，接近满电时变慢）
    const batteryProgress = 1 - Math.pow(1 - progress, 1.5);
    const batteryLevel = Math.round(startBattery + (endBattery - startBattery) * batteryProgress);

    // 充电功率：开始高，接近满电时降低
    let chargerPower: number;
    if (batteryLevel < 80) {
      chargerPower = 7.2 + Math.random() * 0.3;
    } else if (batteryLevel < 90) {
      chargerPower = 5.5 + Math.random() * 0.5;
    } else {
      chargerPower = 3.0 + Math.random() * 0.5;
    }

    // 电压和电流
    const chargerVoltage = 220 + Math.random() * 5;
    const chargerActualCurrent = (chargerPower * 1000) / chargerVoltage;

    // 累计充入电量
    const chargeEnergyAdded = totalEnergy * progress;

    // 续航里程
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

export const demoChargeData: DemoChargeData = {
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
  curve: generateDemoChargeCurve(),
};
