import { cn } from '../../lib/utils';
import type { ThemeType } from '../../hooks/useTheme';

interface BatteryGaugeProps {
  startLevel: number;
  endLevel: number;
  className?: string;
  theme?: ThemeType;
}

export function BatteryGauge({ startLevel, endLevel, className, theme = 'tesla' }: BatteryGaugeProps) {
  const change = endLevel - startLevel;
  const isCharging = change > 0;

  const barBgClass = theme === 'cyberpunk'
    ? 'bg-[rgba(0,245,255,0.2)]'
    : theme === 'glass'
    ? 'bg-[rgba(255,255,255,0.1)]'
    : 'bg-[rgba(255,255,255,0.1)]';

  const startBarColor = theme === 'cyberpunk' ? '#00f5ff' : theme === 'glass' ? '#3b82f6' : '#e82127';
  const endBarColor = isCharging ? '#22c55e' : startBarColor;

  return (
    <div className={cn('flex items-center gap-4', className)}>
      <div className="flex-1">
        <div className="flex justify-between text-sm mb-1">
          <span className="theme-text-muted">开始</span>
          <span className="font-medium theme-text">{startLevel}%</span>
        </div>
        <div className={`h-6 rounded-full overflow-hidden relative ${barBgClass}`}>
          <div
            className="h-full transition-all duration-500"
            style={{ width: `${startLevel}%`, backgroundColor: startBarColor }}
          />
        </div>
      </div>

      <div className="flex flex-col items-center">
        <span style={{ color: isCharging ? 'var(--theme-success)' : 'var(--theme-error)' }} className="text-lg font-bold">
          {isCharging ? '+' : ''}{change}%
        </span>
        <svg
          className="w-6 h-6"
          style={{ color: isCharging ? 'var(--theme-success)' : 'var(--theme-error)' }}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 7l5 5m0 0l-5 5m5-5H6"
          />
        </svg>
      </div>

      <div className="flex-1">
        <div className="flex justify-between text-sm mb-1">
          <span className="theme-text-muted">结束</span>
          <span className="font-medium theme-text">{endLevel}%</span>
        </div>
        <div className={`h-6 rounded-full overflow-hidden relative ${barBgClass}`}>
          <div
            className="h-full transition-all duration-500"
            style={{ width: `${endLevel}%`, backgroundColor: endBarColor }}
          />
        </div>
      </div>
    </div>
  );
}
