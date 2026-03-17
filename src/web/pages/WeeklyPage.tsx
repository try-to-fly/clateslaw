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
        <DailyRouteMap
          allPositions={allPositions}
          theme={theme}
          heightClass="h-[30rem]"
          fitPadding={[32, 18, 128, 18]}
        />
      )}

      {/* Drive / Charge Summary */}
      {(drives.length > 0 || charges.length > 0) && (
        <div className={cardClass}>
          <div className="px-2.5 py-1 border-b border-[var(--theme-card-border)] flex items-center justify-between text-xs">
            <span className="font-medium theme-text">🧾 本周摘要</span>
            <span className="theme-text-muted">更紧凑，给地图让位</span>
          </div>
          <div className="divide-y divide-[var(--theme-card-border)] text-[11px] leading-tight">
            <div className="px-2 py-1.5 grid grid-cols-4 gap-2">
              <div>
                <div className="theme-text-muted text-[10px]">行程</div>
                <div className="theme-text font-medium tabular-nums">{stats.totalDrives}</div>
              </div>
              <div>
                <div className="theme-text-muted text-[10px]">里程</div>
                <div className="font-medium tabular-nums" style={{ color: accentColor }}>{stats.totalDistance.toFixed(1)} km</div>
              </div>
              <div>
                <div className="theme-text-muted text-[10px]">时长</div>
                <div className="theme-text font-medium">{formatDuration(stats.totalDuration)}</div>
              </div>
              <div>
                <div className="theme-text-muted text-[10px]">效率</div>
                <div className="theme-text font-medium tabular-nums">{stats.avgEfficiency.toFixed(0)} Wh/km</div>
              </div>
            </div>
            <div className="px-2 py-1.5 grid grid-cols-4 gap-2">
              <div>
                <div className="theme-text-muted text-[10px]">充电</div>
                <div className="theme-text font-medium tabular-nums">{stats.totalCharges}</div>
              </div>
              <div>
                <div className="theme-text-muted text-[10px]">补能</div>
                <div className="font-medium tabular-nums" style={{ color: 'var(--theme-success)' }}>+{formatEnergy(stats.totalEnergyAdded)}</div>
              </div>
              <div>
                <div className="theme-text-muted text-[10px]">驾驶耗能</div>
                <div className="theme-text font-medium tabular-nums">{formatEnergy(stats.totalEnergyUsed)}</div>
              </div>
              <div>
                <div className="theme-text-muted text-[10px]">费用</div>
                <div className="theme-text font-medium tabular-nums">¥{stats.totalCost.toFixed(0)}</div>
              </div>
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
