import { cn } from '../../lib/utils';

interface BatteryGaugeProps {
  startLevel: number;
  endLevel: number;
  className?: string;
}

export function BatteryGauge({ startLevel, endLevel, className }: BatteryGaugeProps) {
  const change = endLevel - startLevel;
  const isCharging = change > 0;

  return (
    <div className={cn('flex items-center gap-4', className)}>
      <div className="flex-1">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-muted-foreground">开始</span>
          <span className="font-medium">{startLevel}%</span>
        </div>
        <div className="h-6 bg-gray-200 rounded-full overflow-hidden relative">
          <div
            className="h-full bg-blue-500 transition-all duration-500"
            style={{ width: `${startLevel}%` }}
          />
        </div>
      </div>

      <div className="flex flex-col items-center">
        <span className={cn(
          'text-lg font-bold',
          isCharging ? 'text-green-600' : 'text-red-600'
        )}>
          {isCharging ? '+' : ''}{change}%
        </span>
        <svg
          className={cn(
            'w-6 h-6',
            isCharging ? 'text-green-600' : 'text-red-600'
          )}
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
          <span className="text-muted-foreground">结束</span>
          <span className="font-medium">{endLevel}%</span>
        </div>
        <div className="h-6 bg-gray-200 rounded-full overflow-hidden relative">
          <div
            className={cn(
              'h-full transition-all duration-500',
              isCharging ? 'bg-green-500' : 'bg-blue-500'
            )}
            style={{ width: `${endLevel}%` }}
          />
        </div>
      </div>
    </div>
  );
}
