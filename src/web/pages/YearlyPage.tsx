import { useData, type YearlyData } from '../hooks/useData';
import { useTheme } from '../hooks/useTheme';
import { getCardClass, getAccentColor } from '../hooks/useStyles';
import { formatDuration, formatEnergy } from '../lib/utils';

const MONTH_NAMES = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

export default function YearlyPage() {
  const data = useData<YearlyData>();
  const { theme } = useTheme();

  if (!data) {
    return (
      <div className="theme-bg flex items-center justify-center p-4">
        <p className="theme-text-muted">Loading...</p>
      </div>
    );
  }

  const { year, periodLabel, stats, monthlyBreakdown, comparison } = data;

  const cardClass = getCardClass(theme);
  const accentColor = getAccentColor(theme);

  // 计算月度最大值用于图表缩放
  const maxDistance = Math.max(...monthlyBreakdown.map(m => m.distance), 1);

  return (
    <div className="theme-bg p-2 space-y-2 screenshot-container">
      {/* Year Title */}
      <div className={cardClass}>
        <div className="px-2.5 py-1.5">
          <span className="text-sm font-medium theme-text flex items-center gap-1">
            <span>📅</span>
            {periodLabel} 年报
          </span>
        </div>
      </div>

      {/* Hero Stats */}
      <div className={cardClass}>
        <div className="px-2.5 py-2">
          {/* Main Stats */}
          <div className="flex items-center justify-center gap-8 mb-1.5">
            <div className="text-center">
              <span className="text-2xl font-bold" style={{ color: accentColor }}>
                {stats.totalDistance.toFixed(0)}
              </span>
              <span className="text-sm font-normal theme-text-muted ml-1">km</span>
            </div>
            <div className="text-center">
              <span className="text-lg font-semibold theme-text">
                {formatDuration(stats.totalDuration)}
              </span>
            </div>
          </div>
          {/* Secondary Stats */}
          <div className="flex items-center justify-center gap-4 text-xs theme-text-muted">
            <span>{stats.totalDrives} 次行程</span>
            <span>{stats.totalCharges} 次充电</span>
            <span>{stats.avgEfficiency.toFixed(0)} Wh/km</span>
          </div>
          {/* Comparison with previous year */}
          {comparison && (
            <div className="flex items-center justify-center gap-4 text-xs mt-1">
              <span style={{ color: comparison.distanceChange >= 0 ? 'var(--theme-success)' : 'var(--theme-error)' }}>
                {comparison.distanceChange >= 0 ? '+' : ''}{comparison.distanceChange.toFixed(0)} km
                ({comparison.distanceChangePercent >= 0 ? '+' : ''}{comparison.distanceChangePercent.toFixed(0)}%)
              </span>
              <span className="theme-text-muted">vs 去年</span>
            </div>
          )}
        </div>
      </div>

      {/* Monthly Distance Chart */}
      <div className={cardClass}>
        <div className="px-2.5 py-1 border-b border-[var(--theme-card-border)]">
          <span className="text-xs font-medium theme-text">📊 月度里程</span>
        </div>
        <div className="px-2.5 py-2">
          <div className="flex items-end justify-between gap-1" style={{ height: '80px' }}>
            {monthlyBreakdown.map((month, index) => {
              const height = (month.distance / maxDistance) * 100;
              return (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div
                    className="w-full rounded-t"
                    style={{
                      height: `${height}%`,
                      backgroundColor: accentColor,
                      minHeight: month.distance > 0 ? '4px' : '0',
                      opacity: month.distance > 0 ? 1 : 0.3,
                    }}
                  />
                  <span className="text-[10px] theme-text-muted mt-1">
                    {MONTH_NAMES[index].replace('月', '')}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Energy Summary */}
      <div className={cardClass}>
        <div className="px-2.5 py-1 border-b border-[var(--theme-card-border)]">
          <span className="text-xs font-medium theme-text">⚡ 能量统计</span>
        </div>
        <div className="px-2.5 py-1.5 grid grid-cols-3 gap-2 text-xs">
          <div className="text-center">
            <div className="theme-text-muted">总消耗</div>
            <div className="theme-text font-medium">{formatEnergy(stats.totalEnergyUsed)}</div>
          </div>
          <div className="text-center">
            <div className="theme-text-muted">总充电</div>
            <div className="theme-text font-medium" style={{ color: 'var(--theme-success)' }}>
              +{formatEnergy(stats.totalEnergyAdded)}
            </div>
          </div>
          <div className="text-center">
            <div className="theme-text-muted">充电费用</div>
            <div className="theme-text font-medium">¥{stats.totalCost.toFixed(0)}</div>
          </div>
        </div>
      </div>

      {/* Monthly Breakdown Table */}
      <div className={cardClass}>
        <div className="px-2.5 py-1 border-b border-[var(--theme-card-border)]">
          <span className="text-xs font-medium theme-text">📋 月度明细</span>
        </div>
        <div className="px-2 py-1">
          <table className="w-full text-[10px]">
            <thead>
              <tr className="theme-text-muted">
                <th className="text-left py-0.5">月份</th>
                <th className="text-right py-0.5">里程</th>
                <th className="text-right py-0.5">行程</th>
                <th className="text-right py-0.5">充电</th>
                <th className="text-right py-0.5">费用</th>
              </tr>
            </thead>
            <tbody>
              {monthlyBreakdown.filter(m => m.distance > 0 || m.charges > 0).map((month, index) => (
                <tr key={index} className="theme-text border-t border-[var(--theme-card-border)]">
                  <td className="py-0.5">{MONTH_NAMES[month.month - 1]}</td>
                  <td className="text-right py-0.5">{month.distance.toFixed(0)} km</td>
                  <td className="text-right py-0.5">{month.drives}</td>
                  <td className="text-right py-0.5">{month.charges}</td>
                  <td className="text-right py-0.5">¥{month.cost.toFixed(0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Year Summary Footer */}
      <div className={cardClass}>
        <div className="px-2.5 py-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="theme-text-muted">{year} 年总费用</span>
            <span className="theme-text font-medium">¥{stats.totalCost.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
