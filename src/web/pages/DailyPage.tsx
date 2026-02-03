import { useData, type DailyData } from '../hooks/useData';
import { useTheme } from '../hooks/useTheme';
import { StatsCard } from '../components/cards/StatsCard';
import { EnergyBar } from '../components/charts/EnergyBar';
import {
  formatDistance,
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

  const { date, drives, charges, stats } = data;

  const cardClass = theme === 'cyberpunk'
    ? 'theme-card cyber-border rounded-lg overflow-hidden'
    : theme === 'glass'
    ? 'theme-card glass-card rounded-xl overflow-hidden'
    : 'theme-card rounded-lg overflow-hidden';

  const itemBgClass = theme === 'cyberpunk'
    ? 'bg-[rgba(0,245,255,0.1)]'
    : theme === 'glass'
    ? 'bg-[rgba(255,255,255,0.05)]'
    : 'bg-[rgba(255,255,255,0.05)]';

  return (
    <div className="theme-bg p-4 space-y-4">
      <div className={cardClass}>
        <div className="px-4 py-3">
          <h3 className="text-base font-medium theme-text">
            {new Date(date).toLocaleDateString('zh-CN', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              weekday: 'long',
            })}
          </h3>
        </div>
      </div>

      <StatsCard
        title="今日统计"
        theme={theme}
        items={[
          { label: '总里程', value: formatDistance(stats.totalDistance), highlight: true },
          { label: '总时长', value: formatDuration(stats.totalDuration) },
          { label: '消耗电量', value: formatEnergy(stats.totalEnergyUsed) },
          { label: '充入电量', value: formatEnergy(stats.totalEnergyAdded) },
        ]}
      />

      {drives.length > 0 && (
        <div className={cardClass}>
          <div className="px-4 py-3 border-b border-[var(--theme-card-border)]">
            <h3 className="text-sm font-medium theme-text">今日行程 ({drives.length})</h3>
          </div>
          <div className="p-4 space-y-2">
            {drives.map((drive) => (
              <div
                key={drive.id}
                className={`flex justify-between items-center p-2 rounded ${itemBgClass}`}
              >
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium theme-text truncate">
                    {drive.start_location} → {drive.end_location}
                  </div>
                  <div className="text-xs theme-text-muted">
                    {formatTime(drive.start_date)} - {formatTime(drive.end_date)}
                  </div>
                </div>
                <div className="text-right ml-2">
                  <div className="text-sm font-medium theme-accent">
                    {formatDistance(drive.distance)}
                  </div>
                  <div className="text-xs theme-text-muted">
                    {formatDuration(drive.duration_min)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {charges.length > 0 && (
        <div className={cardClass}>
          <div className="px-4 py-3 border-b border-[var(--theme-card-border)]">
            <h3 className="text-sm font-medium theme-text">今日充电 ({charges.length})</h3>
          </div>
          <div className="p-4 space-y-2">
            {charges.map((charge) => (
              <div
                key={charge.id}
                className={`flex justify-between items-center p-2 rounded ${itemBgClass}`}
              >
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium theme-text truncate">{charge.location}</div>
                  <div className="text-xs theme-text-muted">
                    {formatTime(charge.start_date)} - {formatTime(charge.end_date)}
                  </div>
                </div>
                <div className="text-right ml-2">
                  <div className="text-sm font-medium" style={{ color: 'var(--theme-success)' }}>
                    +{formatEnergy(charge.charge_energy_added)}
                  </div>
                  <div className="text-xs theme-text-muted">
                    {charge.start_battery_level}% → {charge.end_battery_level}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {drives.length > 1 && <EnergyBar drives={drives} theme={theme} />}
    </div>
  );
}
