import { useData, type ChargeData } from '../hooks/useData';
import { useTheme } from '../hooks/useTheme';
import { ChargeCard } from '../components/cards/ChargeCard';
import { StatsCard } from '../components/cards/StatsCard';
import { ChargeCurve } from '../components/charts/ChargeCurve';
import { BatteryGauge } from '../components/charts/BatteryGauge';
import { formatDate, formatEnergy } from '../lib/utils';

export default function ChargePage() {
  const data = useData<ChargeData>();
  const { theme } = useTheme();

  if (!data) {
    return (
      <div className="theme-bg flex items-center justify-center p-4">
        <p className="theme-text-muted">加载中...</p>
      </div>
    );
  }

  const { charge, curve } = data;

  const cardClass = theme === 'cyberpunk'
    ? 'theme-card cyber-border rounded-lg overflow-hidden'
    : theme === 'glass'
    ? 'theme-card glass-card rounded-xl overflow-hidden'
    : 'theme-card rounded-lg overflow-hidden';

  return (
    <div className="theme-bg p-4 space-y-4">
      <ChargeCard charge={charge} theme={theme} />

      <div className={cardClass}>
        <div className="px-4 py-3 border-b border-[var(--theme-card-border)]">
          <h3 className="text-sm font-medium theme-text">电量变化</h3>
        </div>
        <div className="p-4">
          <BatteryGauge
            startLevel={charge.start_battery_level}
            endLevel={charge.end_battery_level}
            theme={theme}
          />
        </div>
      </div>

      {curve.length > 0 && <ChargeCurve data={curve} theme={theme} />}

      <StatsCard
        title="详细信息"
        theme={theme}
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
