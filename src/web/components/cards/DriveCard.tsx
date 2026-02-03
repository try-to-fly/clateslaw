import { formatDistance, formatDuration, formatSpeed } from '../../lib/utils';
import type { DriveRecord } from '../../../types/drive';
import type { ThemeType } from '../../hooks/useTheme';

interface DriveCardProps {
  drive: DriveRecord;
  theme?: ThemeType;
}

export function DriveCard({ drive, theme = 'tesla' }: DriveCardProps) {
  const efficiency = drive.distance > 0
    ? ((drive.power_max * drive.duration_min / 60) / drive.distance * 100).toFixed(0)
    : '0';

  const avgSpeed = formatSpeed(drive.distance / (drive.duration_min / 60));

  const cardClass = theme === 'cyberpunk'
    ? 'theme-card cyber-border rounded-lg overflow-hidden'
    : theme === 'glass'
    ? 'theme-card glass-card rounded-xl overflow-hidden'
    : 'theme-card rounded-lg overflow-hidden';

  const valueClass = theme === 'cyberpunk'
    ? 'text-xl font-bold theme-accent cyber-glow'
    : theme === 'glass'
    ? 'text-xl font-bold theme-accent'
    : 'text-xl font-bold theme-accent';

  return (
    <div className={cardClass}>
      <div className="px-4 py-3 border-b border-[var(--theme-card-border)]">
        <h3 className="text-sm font-medium theme-text">行程概要</h3>
      </div>
      <div className="p-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className={valueClass}>{formatDistance(drive.distance)}</div>
            <div className="text-xs theme-text-muted mt-1">距离</div>
          </div>
          <div className="text-center">
            <div className={valueClass}>{formatDuration(drive.duration_min)}</div>
            <div className="text-xs theme-text-muted mt-1">时长</div>
          </div>
          <div className="text-center">
            <div className={valueClass}>{avgSpeed}</div>
            <div className="text-xs theme-text-muted mt-1">均速</div>
          </div>
          <div className="text-center">
            <div className={valueClass}>{efficiency}</div>
            <div className="text-xs theme-text-muted mt-1">Wh/km</div>
          </div>
        </div>
      </div>
    </div>
  );
}
