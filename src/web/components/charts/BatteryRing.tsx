import { cn } from '../../lib/utils';
import type { ThemeType } from '../../hooks/useTheme';

interface BatteryRingProps {
  level: number;
  range?: number;
  startLevel?: number;
  startRange?: number;
  size?: 'sm' | 'md' | 'lg';
  showChange?: boolean;
  isCharging?: boolean;
  className?: string;
  theme?: ThemeType;
}

export function BatteryRing({
  level,
  range,
  startLevel,
  startRange,
  size = 'lg',
  showChange = true,
  isCharging = true,
  className,
  theme = 'tesla',
}: BatteryRingProps) {
  const levelChange = startLevel !== undefined ? level - startLevel : 0;
  const rangeChange = startRange !== undefined && range !== undefined ? range - startRange : 0;

  const sizeConfig = {
    sm: { width: 100, strokeWidth: 8, fontSize: 'text-lg', subSize: 'text-xs' },
    md: { width: 140, strokeWidth: 10, fontSize: 'text-2xl', subSize: 'text-sm' },
    lg: { width: 200, strokeWidth: 12, fontSize: 'text-3xl', subSize: 'text-base' },
  };

  const config = sizeConfig[size];
  const radius = (config.width - config.strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (level / 100) * circumference;

  const getColors = () => {
    if (theme === 'cyberpunk') {
      return {
        track: 'rgba(0, 245, 255, 0.1)',
        gradient: isCharging ? ['#00ff88', '#00cc6a'] : ['#00f5ff', '#00d4ff'],
        glow: isCharging ? 'rgba(0, 255, 136, 0.4)' : 'rgba(0, 245, 255, 0.4)',
        text: isCharging ? '#00ff88' : '#00f5ff',
      };
    }
    if (theme === 'glass') {
      return {
        track: 'rgba(255, 255, 255, 0.08)',
        gradient: isCharging ? ['#22c55e', '#16a34a'] : ['#60a5fa', '#3b82f6'],
        glow: isCharging ? 'rgba(34, 197, 94, 0.3)' : 'rgba(59, 130, 246, 0.3)',
        text: isCharging ? '#22c55e' : '#3b82f6',
      };
    }
    return {
      track: 'rgba(255, 255, 255, 0.08)',
      gradient: isCharging ? ['#22c55e', '#16a34a'] : ['#ff4d52', '#e82127'],
      glow: isCharging ? 'rgba(34, 197, 94, 0.3)' : 'rgba(232, 33, 39, 0.3)',
      text: isCharging ? '#22c55e' : '#e82127',
    };
  };

  const colors = getColors();
  const gradientId = `ring-gradient-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className={cn('flex flex-col items-center', className)}>
      <div className="relative" style={{ width: config.width, height: config.width }}>
        <svg
          width={config.width}
          height={config.width}
          viewBox={`0 0 ${config.width} ${config.width}`}
          className="transform -rotate-90"
        >
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={colors.gradient[0]} />
              <stop offset="100%" stopColor={colors.gradient[1]} />
            </linearGradient>
            <filter id={`glow-${gradientId}`}>
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* 背景轨道 */}
          <circle
            cx={config.width / 2}
            cy={config.width / 2}
            r={radius}
            fill="none"
            stroke={colors.track}
            strokeWidth={config.strokeWidth}
          />

          {/* 进度圆环 */}
          <circle
            cx={config.width / 2}
            cy={config.width / 2}
            r={radius}
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth={config.strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            filter={`url(#glow-${gradientId})`}
            style={{
              transition: 'stroke-dashoffset 1s ease-out',
            }}
          />
        </svg>

        {/* 中心内容 */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className={cn(config.fontSize, 'font-bold')} style={{ color: colors.text }}>
            {level}
            <span className={cn(config.subSize, 'font-medium opacity-80')}>%</span>
          </div>
          {range !== undefined && (
            <div className={cn(config.subSize, 'font-medium theme-text-secondary mt-1')}>
              {range.toFixed(0)} km
            </div>
          )}
        </div>
      </div>

      {/* 变化量显示 */}
      {showChange && (levelChange !== 0 || rangeChange !== 0) && (
        <div className="flex items-center gap-4 mt-3">
          {levelChange !== 0 && (
            <span
              className="text-sm font-semibold"
              style={{ color: levelChange > 0 ? 'var(--theme-success)' : 'var(--theme-error)' }}
            >
              {levelChange > 0 ? '+' : ''}
              {levelChange}%
            </span>
          )}
          {rangeChange !== 0 && (
            <span
              className="text-sm font-semibold"
              style={{ color: rangeChange > 0 ? 'var(--theme-success)' : 'var(--theme-error)' }}
            >
              {rangeChange > 0 ? '+' : ''}
              {rangeChange.toFixed(0)} km
            </span>
          )}
        </div>
      )}
    </div>
  );
}
