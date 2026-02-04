import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import type { ChargeCurvePoint } from '../../../types/charge';
import type { ThemeType } from '../../hooks/useTheme';

interface ChargeCurveProps {
  data: ChargeCurvePoint[];
  theme?: ThemeType;
}

export function ChargeCurve({ data, theme = 'tesla' }: ChargeCurveProps) {
  const chartData = data.map((point, index) => ({
    time: index,
    power: point.charger_power || 0,
    soc: point.battery_level || 0,
    energy: point.charge_energy_added || 0,
  }));

  const cardClass =
    theme === 'cyberpunk'
      ? 'theme-card cyber-border rounded-lg overflow-hidden'
      : theme === 'glass'
        ? 'theme-card glass-card rounded-xl overflow-hidden'
        : 'theme-card rounded-lg overflow-hidden';

  const gridColor =
    theme === 'cyberpunk'
      ? '#3d3d6b'
      : theme === 'glass'
        ? 'rgba(255,255,255,0.1)'
        : '#2a2a2a';

  const textColor =
    theme === 'cyberpunk'
      ? '#8888aa'
      : theme === 'glass'
        ? '#64748b'
        : '#666666';

  const powerColor = theme === 'cyberpunk' ? '#00ff88' : '#22c55e';
  const socColor =
    theme === 'cyberpunk' ? '#00f5ff' : theme === 'glass' ? '#3b82f6' : '#e82127';

  const gradientId = `power-gradient-${Math.random().toString(36).substr(2, 9)}`;
  const socGradientId = `soc-gradient-${Math.random().toString(36).substr(2, 9)}`;

  const maxSoc = Math.max(...chartData.map((d) => d.soc));
  const show80Line = maxSoc >= 80;
  const show90Line = maxSoc >= 90;

  return (
    <div className={cardClass}>
      <div className="px-3 py-2 border-b border-[var(--theme-card-border)]">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-medium theme-text">充电曲线</h3>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: powerColor }}
              />
              <span className="theme-text-muted">功率</span>
            </span>
            <span className="flex items-center gap-1">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: socColor }}
              />
              <span className="theme-text-muted">电量</span>
            </span>
          </div>
        </div>
      </div>
      <div className="p-2">
        <div className="h-32">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={powerColor} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={powerColor} stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id={socGradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={socColor} stopOpacity={0.2} />
                  <stop offset="95%" stopColor={socColor} stopOpacity={0.02} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />

              <XAxis
                dataKey="time"
                tick={{ fontSize: 10, fill: textColor }}
                tickFormatter={(v) => `${Math.round(v * 5)}m`}
                stroke={gridColor}
              />

              {/* 左 Y 轴 - 功率 */}
              <YAxis
                yAxisId="power"
                orientation="left"
                tick={{ fontSize: 10, fill: textColor }}
                tickFormatter={(v) => `${v}kW`}
                stroke={gridColor}
                width={45}
              />

              {/* 右 Y 轴 - 电量 */}
              <YAxis
                yAxisId="soc"
                orientation="right"
                domain={[0, 100]}
                tick={{ fontSize: 10, fill: textColor }}
                tickFormatter={(v) => `${v}%`}
                stroke={gridColor}
                width={40}
              />

              {/* 80% 里程碑线 */}
              {show80Line && (
                <ReferenceLine
                  yAxisId="soc"
                  y={80}
                  stroke={theme === 'cyberpunk' ? '#ff00ff' : '#f59e0b'}
                  strokeDasharray="5 5"
                  strokeOpacity={0.6}
                />
              )}

              {/* 90% 里程碑线 */}
              {show90Line && (
                <ReferenceLine
                  yAxisId="soc"
                  y={90}
                  stroke={theme === 'cyberpunk' ? '#ff00ff' : '#ef4444'}
                  strokeDasharray="5 5"
                  strokeOpacity={0.6}
                />
              )}

              <Tooltip
                formatter={(value: number, name: string) => {
                  if (name === 'power') return [`${value.toFixed(1)} kW`, '功率'];
                  if (name === 'soc') return [`${value.toFixed(0)}%`, '电量'];
                  return [value, name];
                }}
                labelFormatter={(v) => `${Math.round(Number(v) * 5)} 分钟`}
                contentStyle={{
                  backgroundColor: 'var(--theme-card)',
                  border: '1px solid var(--theme-card-border)',
                  borderRadius: '8px',
                  boxShadow: 'var(--theme-card-shadow)',
                }}
                labelStyle={{ color: 'var(--theme-text)' }}
              />

              {/* 功率面积图 */}
              <Area
                yAxisId="power"
                type="monotone"
                dataKey="power"
                stroke={powerColor}
                strokeWidth={2}
                fill={`url(#${gradientId})`}
                dot={false}
              />

              {/* 电量线图 */}
              <Line
                yAxisId="soc"
                type="monotone"
                dataKey="soc"
                stroke={socColor}
                strokeWidth={2}
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* 里程碑图例 */}
        {(show80Line || show90Line) && (
          <div className="flex justify-center gap-3 mt-2 text-xs theme-text-muted">
            {show80Line && (
              <span className="flex items-center gap-1">
                <span
                  className="w-3 h-0.5"
                  style={{
                    backgroundColor:
                      theme === 'cyberpunk' ? '#ff00ff' : '#f59e0b',
                    opacity: 0.6,
                  }}
                />
                <span>80%</span>
              </span>
            )}
            {show90Line && (
              <span className="flex items-center gap-1">
                <span
                  className="w-3 h-0.5"
                  style={{
                    backgroundColor:
                      theme === 'cyberpunk' ? '#ff00ff' : '#ef4444',
                    opacity: 0.6,
                  }}
                />
                <span>90%</span>
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
