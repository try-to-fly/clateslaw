import { useData, type WeeklyData } from '../hooks/useData';
import { useTheme } from '../hooks/useTheme';
import { getCardClass, getAccentColor } from '../hooks/useStyles';
import { DailyRouteMap } from '../components/maps/DailyRouteMap';
import {
  formatDuration,
  formatEnergy,
} from '../lib/utils';

export default function WeeklyPage() {
  const data = useData<WeeklyData>();
  const { theme } = useTheme();

  if (!data) {
    return (
      <div className="theme-bg flex items-center justify-center p-4">
        <p className="theme-text-muted">Loading...</p>
      </div>
    );
  }

  const { periodLabel, drives, charges, allPositions, stats, comparison } = data;

  const cardClass = getCardClass(theme);
  const accentColor = getAccentColor(theme);

  return (
    <div className="theme-bg p-2 space-y-2 screenshot-container">
      {/* Period Title */}
      <div className={cardClass}>
        <div className="px-2.5 py-1.5">
          <span className="text-sm font-medium theme-text flex items-center gap-1">
            <span>📊</span>
            {periodLabel} 周报
          </span>
        </div>
      </div>

      {/* Hero Stats */}
      <div className={cardClass}>
        <div className="px-2.5 py-2">
          {/* Main Stats: Total Distance + Duration */}
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
          {/* Secondary Stats */}
          <div className="flex items-center justify-center gap-4 text-xs theme-text-muted">
            <span>{stats.totalDrives} 次行程</span>
            <span>{stats.avgEfficiency.toFixed(0)} Wh/km</span>
          </div>
          {/* Comparison with previous week */}
          {comparison && (
            <div className="flex items-center justify-center gap-4 text-xs mt-1">
              <span style={{ color: comparison.distanceChange >= 0 ? 'var(--theme-success)' : 'var(--theme-error)' }}>
                {comparison.distanceChange >= 0 ? '+' : ''}{comparison.distanceChange.toFixed(1)} km
                ({comparison.distanceChangePercent >= 0 ? '+' : ''}{comparison.distanceChangePercent.toFixed(0)}%)
              </span>
              <span className="theme-text-muted">vs 上周</span>
            </div>
          )}
        </div>
      </div>

      {/* Route Map */}
      {allPositions && allPositions.length > 0 && (
        <DailyRouteMap allPositions={allPositions} theme={theme} />
      )}

      {/* Drive Summary */}
      {drives.length > 0 && (
        <div className={cardClass}>
          <div className="px-2.5 py-1 border-b border-[var(--theme-card-border)] flex items-center justify-between">
            <span className="text-xs font-medium theme-text">🛣️ 行程 ({drives.length})</span>
            <span className="text-xs" style={{ color: accentColor }}>
              {stats.totalDistance.toFixed(1)} km
            </span>
          </div>
          <div className="px-2.5 py-1.5 grid grid-cols-3 gap-2 text-xs">
            <div className="text-center">
              <div className="theme-text-muted">总时长</div>
              <div className="theme-text font-medium">{formatDuration(stats.totalDuration)}</div>
            </div>
            <div className="text-center">
              <div className="theme-text-muted">总能耗</div>
              <div className="theme-text font-medium">{formatEnergy(stats.totalEnergyUsed)}</div>
            </div>
            <div className="text-center">
              <div className="theme-text-muted">效率</div>
              <div className="theme-text font-medium">{stats.avgEfficiency.toFixed(0)} Wh/km</div>
            </div>
          </div>
        </div>
      )}

      {/* Charge Summary */}
      {charges.length > 0 && (
        <div className={cardClass}>
          <div className="px-2.5 py-1 border-b border-[var(--theme-card-border)] flex items-center justify-between">
            <span className="text-xs font-medium theme-text">⚡ 充电 ({charges.length})</span>
            <span className="text-xs" style={{ color: 'var(--theme-success)' }}>
              +{formatEnergy(stats.totalEnergyAdded)}
            </span>
          </div>
          <div className="px-2.5 py-1.5 grid grid-cols-2 gap-2 text-xs">
            <div className="text-center">
              <div className="theme-text-muted">充电次数</div>
              <div className="theme-text font-medium">{stats.totalCharges}</div>
            </div>
            <div className="text-center">
              <div className="theme-text-muted">充电费用</div>
              <div className="theme-text font-medium">¥{stats.totalCost.toFixed(2)}</div>
            </div>
          </div>
        </div>
      )}

      {/* Energy Balance */}
      <div className={cardClass}>
        <div className="px-2.5 py-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="theme-text-muted">能量收支</span>
            <span style={{
              color: (stats.totalEnergyAdded - stats.totalEnergyUsed) >= 0
                ? 'var(--theme-success)'
                : 'var(--theme-error)'
            }}>
              {(stats.totalEnergyAdded - stats.totalEnergyUsed) >= 0 ? '+' : ''}
              {(stats.totalEnergyAdded - stats.totalEnergyUsed).toFixed(2)} kWh
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
