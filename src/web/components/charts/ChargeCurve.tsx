import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
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

  const cardClass = theme === 'cyberpunk'
    ? 'theme-card cyber-border rounded-lg overflow-hidden'
    : theme === 'glass'
    ? 'theme-card glass-card rounded-xl overflow-hidden'
    : 'theme-card rounded-lg overflow-hidden';

  const gridColor = theme === 'cyberpunk' ? '#3d3d6b' : theme === 'glass' ? 'rgba(255,255,255,0.1)' : '#2a2a2a';
  const textColor = theme === 'cyberpunk' ? '#8888aa' : theme === 'glass' ? '#64748b' : '#666666';
  const powerColor = theme === 'cyberpunk' ? '#00ff88' : '#22c55e';
  const socColor = theme === 'cyberpunk' ? '#00f5ff' : theme === 'glass' ? '#3b82f6' : '#e82127';

  return (
    <div className="space-y-4">
      <div className={cardClass}>
        <div className="px-4 py-3 border-b border-[var(--theme-card-border)]">
          <h3 className="text-sm font-medium theme-text">充电功率曲线</h3>
        </div>
        <div className="p-4">
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 10, fill: textColor }}
                  tickFormatter={(v) => `${Math.round(v * 5)}m`}
                  stroke={gridColor}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: textColor }}
                  tickFormatter={(v) => `${v}kW`}
                  stroke={gridColor}
                />
                <Tooltip
                  formatter={(value: number) => [`${value.toFixed(1)} kW`, '功率']}
                  labelFormatter={(v) => `${Math.round(Number(v) * 5)} 分钟`}
                  contentStyle={{ backgroundColor: 'var(--theme-card)', border: '1px solid var(--theme-card-border)' }}
                  labelStyle={{ color: 'var(--theme-text)' }}
                />
                <Line
                  type="monotone"
                  dataKey="power"
                  stroke={powerColor}
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className={cardClass}>
        <div className="px-4 py-3 border-b border-[var(--theme-card-border)]">
          <h3 className="text-sm font-medium theme-text">电量变化曲线</h3>
        </div>
        <div className="p-4">
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 10, fill: textColor }}
                  tickFormatter={(v) => `${Math.round(v * 5)}m`}
                  stroke={gridColor}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: textColor }}
                  domain={[0, 100]}
                  tickFormatter={(v) => `${v}%`}
                  stroke={gridColor}
                />
                <Tooltip
                  formatter={(value: number) => [`${value.toFixed(0)}%`, 'SOC']}
                  labelFormatter={(v) => `${Math.round(Number(v) * 5)} 分钟`}
                  contentStyle={{ backgroundColor: 'var(--theme-card)', border: '1px solid var(--theme-card-border)' }}
                  labelStyle={{ color: 'var(--theme-text)' }}
                />
                <Line
                  type="monotone"
                  dataKey="soc"
                  stroke={socColor}
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
