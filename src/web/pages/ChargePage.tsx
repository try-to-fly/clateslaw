import { useData, type ChargeData } from '../hooks/useData';
import { ChargeCard } from '../components/cards/ChargeCard';
import { StatsCard } from '../components/cards/StatsCard';
import { ChargeCurve } from '../components/charts/ChargeCurve';
import { BatteryGauge } from '../components/charts/BatteryGauge';
import { formatDate, formatEnergy } from '../lib/utils';

export default function ChargePage() {
  const data = useData<ChargeData>();

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">加载中...</p>
      </div>
    );
  }

  const { charge, curve } = data;

  return (
    <div className="min-h-screen bg-gray-50 p-4 space-y-4">
      <ChargeCard charge={charge} />

      <div className="bg-white rounded-lg p-4 shadow-sm">
        <h3 className="text-base font-semibold mb-3">电量变化</h3>
        <BatteryGauge
          startLevel={charge.start_battery_level}
          endLevel={charge.end_battery_level}
        />
      </div>

      {curve.length > 0 && <ChargeCurve data={curve} />}

      <StatsCard
        title="详细信息"
        items={[
          { label: '充电位置', value: charge.location || '未知' },
          { label: '开始时间', value: formatDate(charge.start_date) },
          { label: '结束时间', value: formatDate(charge.end_date) },
          { label: '消耗电量', value: formatEnergy(charge.charge_energy_used) },
          {
            label: '充电效率',
            value: charge.charge_energy_used > 0
              ? `${((charge.charge_energy_added / charge.charge_energy_used) * 100).toFixed(1)}%`
              : '-',
          },
        ]}
      />
    </div>
  );
}
