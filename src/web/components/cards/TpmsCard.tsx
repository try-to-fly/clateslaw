import type { ThemeType } from '../../hooks/useTheme';

interface TpmsData {
  fl: number | null;
  fr: number | null;
  rl: number | null;
  rr: number | null;
  outside_temp?: number | null;
}

interface TpmsCardProps {
  data: TpmsData;
  theme?: ThemeType;
  className?: string;
}

function getPressureStatus(value: number | null): {
  color: string;
  status: 'low' | 'normal' | 'high' | 'unknown';
} {
  if (value === null) return { color: 'var(--theme-text-muted)', status: 'unknown' };
  if (value < 2.2) return { color: 'var(--theme-error)', status: 'low' };
  if (value > 3.2) return { color: 'var(--theme-warning)', status: 'high' };
  return { color: 'var(--theme-success)', status: 'normal' };
}

function formatPressure(value: number | null): string {
  if (value === null) return '-';
  return value.toFixed(1);
}

export function TpmsCard({ data, theme = 'tesla', className }: TpmsCardProps) {
  const cardClass =
    theme === 'cyberpunk'
      ? 'theme-card cyber-border rounded-lg overflow-hidden'
      : theme === 'glass'
        ? 'theme-card glass-card rounded-xl overflow-hidden'
        : 'theme-card rounded-lg overflow-hidden';

  const flStatus = getPressureStatus(data.fl);
  const frStatus = getPressureStatus(data.fr);
  const rlStatus = getPressureStatus(data.rl);
  const rrStatus = getPressureStatus(data.rr);

  const hasAlert = [flStatus, frStatus, rlStatus, rrStatus].some(
    (s) => s.status === 'low' || s.status === 'high'
  );

  return (
    <div className={`${cardClass} ${className || ''}`}>
      <div className="px-2.5 py-1 border-b border-[var(--theme-card-border)] flex items-center justify-between">
        <span className="text-xs font-medium theme-text flex items-center gap-1">
          <span>🛞</span> 胎压
        </span>
        {data.outside_temp !== null && data.outside_temp !== undefined && (
          <span className="text-xs theme-text-muted">{data.outside_temp}°C</span>
        )}
      </div>
      <div className="px-2.5 py-2">
        {/* 车辆俯视图示意 */}
        <div className="flex justify-center">
          <div className="relative w-24">
            {/* 车身轮廓 */}
            <div className="absolute inset-x-4 inset-y-0 border border-current/20 rounded-lg" />
            {/* 四个轮胎 */}
            <div className="grid grid-cols-2 gap-x-12 gap-y-4 py-2">
              {/* 左前 */}
              <div className="text-center">
                <div
                  className="text-sm font-bold"
                  style={{ color: flStatus.color }}
                >
                  {formatPressure(data.fl)}
                </div>
                <div className="text-[10px] theme-text-muted">FL</div>
              </div>
              {/* 右前 */}
              <div className="text-center">
                <div
                  className="text-sm font-bold"
                  style={{ color: frStatus.color }}
                >
                  {formatPressure(data.fr)}
                </div>
                <div className="text-[10px] theme-text-muted">FR</div>
              </div>
              {/* 左后 */}
              <div className="text-center">
                <div
                  className="text-sm font-bold"
                  style={{ color: rlStatus.color }}
                >
                  {formatPressure(data.rl)}
                </div>
                <div className="text-[10px] theme-text-muted">RL</div>
              </div>
              {/* 右后 */}
              <div className="text-center">
                <div
                  className="text-sm font-bold"
                  style={{ color: rrStatus.color }}
                >
                  {formatPressure(data.rr)}
                </div>
                <div className="text-[10px] theme-text-muted">RR</div>
              </div>
            </div>
          </div>
        </div>
        {/* 状态提示 */}
        {hasAlert && (
          <div
            className="text-center text-xs mt-1"
            style={{ color: 'var(--theme-warning)' }}
          >
            ⚠️ 胎压异常
          </div>
        )}
      </div>
    </div>
  );
}
