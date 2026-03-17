import { useData, type DailyData } from '../hooks/useData';
import { useTheme } from '../hooks/useTheme';
import { getCardClass, getAccentColor } from '../hooks/useStyles';
import { DailyRouteMap } from '../components/maps/DailyRouteMap';
import { TpmsCard } from '../components/cards/TpmsCard';
import {
  formatDuration,
  formatDurationCompact,
  formatEnergy,
  formatEnergyCompact,
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

  const { date, drives, charges, allPositions, stats, rangeMeta } = data;

  const cardClass = getCardClass(theme);
  const accentColor = getAccentColor(theme);

  const avgEfficiency =
    stats.totalDistance > 0
      ? (stats.totalEnergyUsed / stats.totalDistance) * 1000
      : 0;

  const batteryChange = stats.totalEnergyAdded - stats.totalEnergyUsed;
  const batteryChangePercent = Math.round(batteryChange / 0.75);
  const isRangeMapFirst = Boolean(rangeMeta?.mapFirst);

  const displayedDrives = isRangeMapFirst ? drives.slice(0, 10) : drives;
  const displayedCharges = isRangeMapFirst ? charges.slice(0, 6) : charges;

  return (
    <div className="theme-bg p-2 space-y-2 screenshot-container">
      {/* 日期标题 */}
      <div className={cardClass}>
        <div className="px-2.5 py-1.5 flex items-center justify-between gap-2">
          <span className="text-sm font-medium theme-text flex items-center gap-1 min-w-0">
            <span>📅</span>
            <span className="truncate">
              {new Date(date).toLocaleDateString('zh-CN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'short',
              })}
            </span>
          </span>
          {isRangeMapFirst && rangeMeta?.days ? (
            <span className="text-[11px] theme-text-muted shrink-0">范围截图 · {rangeMeta.days} 天</span>
          ) : null}
        </div>
      </div>

      {/* Hero 数据区 */}
      <div className={cardClass}>
        <div className="px-2.5 py-2">
          {isRangeMapFirst ? (
            <div className="grid grid-cols-4 gap-2 text-center">
              <div>
                <div className="text-[10px] theme-text-muted">里程</div>
                <div className="text-lg font-bold tabular-nums" style={{ color: accentColor }}>
                  {stats.totalDistance.toFixed(1)}
                </div>
              </div>
              <div>
                <div className="text-[10px] theme-text-muted">时长</div>
                <div className="text-sm font-semibold theme-text">{formatDuration(stats.totalDuration)}</div>
              </div>
              <div>
                <div className="text-[10px] theme-text-muted">效率</div>
                <div className="text-sm font-semibold theme-text tabular-nums">{avgEfficiency.toFixed(0)} Wh/km</div>
              </div>
              <div>
                <div className="text-[10px] theme-text-muted">净电量</div>
                <div className="text-sm font-semibold tabular-nums" style={{ color: batteryChangePercent >= 0 ? 'var(--theme-success)' : 'var(--theme-error)' }}>
                  {batteryChangePercent >= 0 ? '+' : ''}{batteryChangePercent}%
                </div>
              </div>
            </div>
          ) : (
            <>
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
              <div className="flex items-center justify-center gap-6 text-xs theme-text-muted">
                <span>{avgEfficiency.toFixed(0)} Wh/km</span>
                <span style={{ color: batteryChangePercent >= 0 ? 'var(--theme-success)' : 'var(--theme-error)' }}>
                  {batteryChangePercent >= 0 ? '+' : ''}{batteryChangePercent}% 电量
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 轨迹地图 h-36 (144px) */}
      {allPositions && allPositions.length > 0 && (
        <DailyRouteMap
          allPositions={allPositions}
          theme={theme}
          heightClass={isRangeMapFirst ? 'h-[34rem]' : 'h-[28rem]'}
          fitPadding={isRangeMapFirst ? [20, 14, 88, 14] : [36, 20, 120, 20]}
        />
      )}

      {/* 行程列表 - 紧凑（时间 / 时长 / 距离） */}
      {drives.length > 0 && (
        <div className={cardClass}>
          <div className="px-2.5 py-1 border-b border-[var(--theme-card-border)] flex items-center justify-between">
            <span className="text-xs font-medium theme-text">🚗 行程 ({drives.length})</span>
            <span className="text-xs theme-text-muted">
              {isRangeMapFirst ? `展示 ${displayedDrives.length} 条` : `${stats.totalDistance.toFixed(1)} km · ${formatDuration(stats.totalDuration)}`}
            </span>
          </div>
          <div className="divide-y divide-[var(--theme-card-border)]">
            {displayedDrives.map((d) => {
              const efficiency = d.distance > 0
                ? (((d.power_max * d.duration_min) / 60 / d.distance) * 100).toFixed(0)
                : '-';

              return (
                <div key={d.id} className="px-2 py-1 grid grid-cols-[2.6rem_minmax(0,1fr)_4.4rem] gap-2 items-center text-[11px] leading-tight">
                  <div className="theme-text-muted tabular-nums">{formatTime(d.start_date)}</div>
                  <div className="min-w-0">
                    <div className="theme-text truncate">
                      {d.start_location || '出发'} → {d.end_location || '到达'}
                    </div>
                    <div className="theme-text-muted text-[10px] truncate">
                      {formatDurationCompact(d.duration_min)} · {efficiency} Wh/km
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium theme-text tabular-nums">{d.distance.toFixed(1)} km</div>
                    <div className="theme-text-muted text-[10px] tabular-nums">#{d.id}</div>
                  </div>
                </div>
              );
            })}
            {isRangeMapFirst && drives.length > displayedDrives.length ? (
              <div className="px-2 py-1 text-[10px] theme-text-muted text-center">
                其余 {drives.length - displayedDrives.length} 条已折叠，避免列表把地图挤没
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* 充电列表 - 紧凑 */}
      {charges.length > 0 && (
        <div className={cardClass}>
          <div className="px-2.5 py-1 border-b border-[var(--theme-card-border)] flex items-center justify-between">
            <span className="text-xs font-medium theme-text">⚡ 充电 ({charges.length})</span>
            <span className="text-xs" style={{ color: 'var(--theme-success)' }}>
              {isRangeMapFirst ? `展示 ${displayedCharges.length} 条` : `+${formatEnergy(stats.totalEnergyAdded)}`}
            </span>
          </div>
          <div className="divide-y divide-[var(--theme-card-border)]">
            {displayedCharges.map((charge) => (
              <div key={charge.id} className="px-2 py-1 grid grid-cols-[2.6rem_minmax(0,1fr)_4.8rem] gap-2 items-center text-[11px] leading-tight">
                <div className="theme-text-muted tabular-nums">{formatTime(charge.start_date)}</div>
                <div className="min-w-0">
                  <div className="theme-text truncate">{charge.location || '充电'}</div>
                  <div className="theme-text-muted text-[10px] truncate">
                    {formatDurationCompact(charge.duration_min)} · {formatEnergyCompact(charge.charge_energy_added)}
                  </div>
                </div>
                <div className="text-right" style={{ color: 'var(--theme-success)' }}>
                  <div className="font-medium tabular-nums">
                    {charge.start_battery_level}→{charge.end_battery_level}%
                  </div>
                  <div className="theme-text-muted text-[10px] tabular-nums">#{charge.id}</div>
                </div>
              </div>
            ))}
            {isRangeMapFirst && charges.length > displayedCharges.length ? (
              <div className="px-2 py-1 text-[10px] theme-text-muted text-center">
                其余 {charges.length - displayedCharges.length} 条已折叠，避免充电列表过长
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* 胎压数据（Daily 截图不展示，避免干扰版面） */}
      {/* {data.tpms && <TpmsCard data={data.tpms} theme={theme} />} */}
    </div>
  );
}
