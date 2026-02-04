import { useData, type DailyData } from '../hooks/useData';
import { useTheme } from '../hooks/useTheme';
import { getCardClass, getAccentColor } from '../hooks/useStyles';
import { DailyRouteMap } from '../components/maps/DailyRouteMap';
import {
  formatDuration,
  formatEnergy,
  formatTime,
} from '../lib/utils';

export default function DailyPage() {
  const data = useData<DailyData>();
  const { theme } = useTheme();

  if (!data) {
    return (
      <div className="theme-bg flex items-center justify-center p-4">
        <p className="theme-text-muted">加载中...</p>
      </div>
    );
  }

  const { date, drives, charges, allPositions, stats } = data;

  const cardClass = getCardClass(theme);
  const accentColor = getAccentColor(theme);

  const avgEfficiency =
    stats.totalDistance > 0
      ? (stats.totalEnergyUsed / stats.totalDistance) * 1000
      : 0;

  const batteryChange = stats.totalEnergyAdded - stats.totalEnergyUsed;
  const batteryChangePercent = Math.round(batteryChange / 0.75);

  return (
    <div className="theme-bg p-2 space-y-2 screenshot-container">
      {/* 日期标题 */}
      <div className={cardClass}>
        <div className="px-2.5 py-1.5">
          <span className="text-sm font-medium theme-text flex items-center gap-1">
            <span>📅</span>
            {new Date(date).toLocaleDateString('zh-CN', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              weekday: 'short',
            })}
          </span>
        </div>
      </div>

      {/* Hero 数据区 */}
      <div className={cardClass}>
        <div className="px-2.5 py-2">
          {/* 主数据：总里程 + 总时长 */}
          <div className="flex items-center justify-center gap-8 mb-1.5">
            <div className="text-center">
              <span className="text-2xl font-bold" style={{ color: accentColor }}>
                {stats.totalDistance.toFixed(1)}
              </span>
              <span className="text-sm font-normal theme-text-muted ml-1">km</span>
            </div>
            <div className="text-center">
              <span className="text-lg font-semibold theme-text">
                {formatDuration(stats.totalDuration)}
              </span>
            </div>
          </div>
          {/* 次要数据：能耗 + 电量变化 */}
          <div className="flex items-center justify-center gap-6 text-xs theme-text-muted">
            <span>{avgEfficiency.toFixed(0)} Wh/km</span>
            <span style={{ color: batteryChangePercent >= 0 ? 'var(--theme-success)' : 'var(--theme-error)' }}>
              {batteryChangePercent >= 0 ? '+' : ''}{batteryChangePercent}% 电量
            </span>
          </div>
        </div>
      </div>

      {/* 轨迹地图 h-36 (144px) */}
      {allPositions && allPositions.length > 0 && (
        <DailyRouteMap allPositions={allPositions} theme={theme} />
      )}

      {/* 充电列表 - 紧凑 */}
      {charges.length > 0 && (
        <div className={cardClass}>
          <div className="px-2.5 py-1 border-b border-[var(--theme-card-border)] flex items-center justify-between">
            <span className="text-xs font-medium theme-text">⚡ 充电 ({charges.length})</span>
            <span className="text-xs" style={{ color: 'var(--theme-success)' }}>
              +{formatEnergy(stats.totalEnergyAdded)}
            </span>
          </div>
          <div className="divide-y divide-[var(--theme-card-border)]">
            {charges.map((charge) => (
              <div key={charge.id} className="px-2.5 py-1 flex items-center justify-between text-xs">
                <div className="flex-1 min-w-0 flex items-center gap-1.5">
                  <span className="theme-text-muted w-10 shrink-0">{formatTime(charge.start_date)}</span>
                  <span className="theme-text truncate">{charge.location}</span>
                </div>
                <span className="font-medium ml-2" style={{ color: 'var(--theme-success)' }}>
                  {charge.start_battery_level}→{charge.end_battery_level}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
