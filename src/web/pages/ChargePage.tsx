import { useData, type ChargeData } from '../hooks/useData';
import { useTheme } from '../hooks/useTheme';
import { getCardClass } from '../hooks/useStyles';
import { BatteryRing } from '../components/charts/BatteryRing';
import { ChargeCurve } from '../components/charts/ChargeCurve';
import { formatDuration } from '../lib/utils';

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

  const efficiency =
    charge.charge_energy_used > 0
      ? ((charge.charge_energy_added / charge.charge_energy_used) * 100).toFixed(0)
      : '100';

  const cardClass = getCardClass(theme);
  const levelChange = charge.end_battery_level - charge.start_battery_level;

  return (
    <div className="theme-bg p-2 space-y-2 screenshot-container">
      {/* 标题行：位置 + 时长 */}
      <div className={cardClass}>
        <div className="px-2.5 py-1.5 flex items-center justify-between">
          <span className="text-sm font-medium theme-text flex items-center gap-1">
            <span>⚡</span>
            {charge.location || '充电'}
          </span>
          <span className="text-sm theme-text-secondary">{formatDuration(charge.duration_min)}</span>
        </div>
      </div>

      {/* 主内容：圆环 + 右侧数据 */}
      <div className={cardClass}>
        <div className="px-2.5 py-2 flex items-center gap-3">
          {/* 左侧圆环 100px */}
          <BatteryRing
            level={charge.end_battery_level}
            startLevel={charge.start_battery_level}
            size="sm"
            showChange={false}
            isCharging={true}
            theme={theme}
          />
          {/* 右侧数据 */}
          <div className="flex-1">
            {/* 电量变化大字 */}
            <div className="text-center mb-2">
              <span className="text-lg font-bold" style={{ color: 'var(--theme-success)' }}>
                +{levelChange}%
              </span>
            </div>
            {/* 数据网格 */}
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
              <div>
                <span className="theme-text-muted">充入 </span>
                <span className="font-semibold" style={{ color: 'var(--theme-success)' }}>
                  {charge.charge_energy_added.toFixed(1)}
                </span>
                <span className="theme-text-muted"> kWh</span>
              </div>
              <div>
                <span className="theme-text-muted">消耗 </span>
                <span className="font-semibold theme-text">
                  {charge.charge_energy_used.toFixed(1)}
                </span>
                <span className="theme-text-muted"> kWh</span>
              </div>
              <div>
                <span className="theme-text-muted">效率 </span>
                <span className="font-semibold theme-text">{efficiency}%</span>
              </div>
              <div>
                <span className="theme-text-muted">费用 </span>
                <span className="font-semibold theme-text">
                  {charge.cost !== null ? `¥${charge.cost.toFixed(0)}` : '-'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 充电曲线 h-32 (128px) */}
      {curve.length > 0 && <ChargeCurve data={curve} theme={theme} />}
    </div>
  );
}
