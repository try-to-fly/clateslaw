import { useData, type DriveData } from '../hooks/useData';
import { useTheme } from '../hooks/useTheme';
import { DriveRoute } from '../components/maps/DriveRoute';
import { formatDuration } from '../lib/utils';

export default function DrivePage() {
  const data = useData<DriveData>();
  const { theme } = useTheme();

  if (!data) {
    return (
      <div className="theme-bg flex items-center justify-center p-4">
        <p className="theme-text-muted">加载中...</p>
      </div>
    );
  }

  const { drive, positions } = data;

  const avgSpeed = drive.duration_min > 0 ? drive.distance / (drive.duration_min / 60) : 0;
  const efficiency =
    drive.distance > 0
      ? ((drive.power_max * drive.duration_min) / 60 / drive.distance) * 100
      : 0;

  const startBattery = positions.length > 0 ? positions[0].battery_level : 0;
  const endBattery = positions.length > 0 ? positions[positions.length - 1].battery_level : 0;

  const cardClass =
    theme === 'cyberpunk'
      ? 'theme-card cyber-border rounded-lg overflow-hidden'
      : theme === 'glass'
        ? 'theme-card glass-card rounded-xl overflow-hidden'
        : 'theme-card rounded-lg overflow-hidden';

  const accentColor =
    theme === 'cyberpunk' ? '#00f5ff' : theme === 'glass' ? '#3b82f6' : '#e82127';

  return (
    <div className="theme-bg p-1.5 screenshot-container">
      {/* 单一卡片包裹所有内容 */}
      <div className={cardClass}>
        {/* 标题行：起终点 + 时长 */}
        <div className="px-2.5 py-1.5 border-b border-current/10">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium theme-text truncate">
                {drive.start_location} → {drive.end_location}
              </div>
            </div>
            <span className="text-sm theme-text-secondary ml-2">
              {formatDuration(drive.duration_min)}
            </span>
          </div>
        </div>

        {/* 核心：地图轨迹 - 裸地图模式 */}
        <DriveRoute
          positions={positions}
          startLocation={drive.start_location}
          endLocation={drive.end_location}
          theme={theme}
          bare={true}
          height="h-56"
        />

        {/* Hero 数据 + 辅助数据 */}
        <div className="px-2.5 py-2 border-t border-current/10">
          {/* Hero 数据：距离 + 能耗 */}
          <div className="flex items-center justify-center gap-10 mb-1">
            <div className="text-center">
              <span className="text-3xl font-bold" style={{ color: accentColor }}>
                {drive.distance.toFixed(1)}
              </span>
              <span className="text-sm font-normal theme-text-muted ml-1">km</span>
            </div>
            <div className="text-center">
              <span className="text-3xl font-bold theme-text">
                {efficiency.toFixed(0)}
              </span>
              <span className="text-sm font-normal theme-text-muted ml-1">Wh/km</span>
            </div>
          </div>
          {/* 辅助数据：电量变化 + 均速 + 峰值 */}
          <div className="flex items-center justify-center gap-4 text-xs theme-text-muted">
            <span>
              {startBattery}%→
              <span style={{ color: 'var(--theme-error)' }}>{endBattery}%</span>
            </span>
            <span>均速 {avgSpeed.toFixed(0)}</span>
            <span>峰值 {drive.speed_max.toFixed(0)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
