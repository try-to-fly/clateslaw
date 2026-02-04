import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import type { DriveRecord } from '../../../types/drive';
import type { ThemeType } from '../../hooks/useTheme';

interface EnergyBarProps {
  drives: DriveRecord[];
  theme?: ThemeType;
}

export function EnergyBar({ drives, theme = 'tesla' }: EnergyBarProps) {
  const chartData = drives
    .slice(0, 10)
    .reverse()
    .map((drive, index) => ({
      name: `#${index + 1}`,
      distance: drive.distance,
      efficiency:
        drive.distance > 0
          ? ((drive.power_max * drive.duration_min) / 60 / drive.distance) * 100
          : 0,
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

  const getBarColors = () => {
    if (theme === 'cyberpunk') {
      return ['#00f5ff', '#00d4ff', '#00b8ff', '#0099ff', '#007aff'];
    }
    if (theme === 'glass') {
      return ['#3b82f6', '#4f8ffc', '#60a5fa', '#7ab8ff', '#93c5fd'];
    }
    return ['#e82127', '#f03a3f', '#f85157', '#ff6b6f', '#ff8589'];
  };

  const barColors = getBarColors();
  const gradientId = `bar-gradient-${Math.random().toString(36).substr(2, 9)}`;

  const maxDistance = Math.max(...chartData.map((d) => d.distance));

  return (
    <div className={cardClass}>
      <div className="px-4 py-3 border-b border-[var(--theme-card-border)]">
        <h3 className="text-sm font-medium theme-text">行程里程对比</h3>
      </div>
      <div className="p-4">
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} barCategoryGap="20%">
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={barColors[0]} stopOpacity={1} />
                  <stop offset="100%" stopColor={barColors[0]} stopOpacity={0.6} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 10, fill: textColor }}
                stroke={gridColor}
              />
              <YAxis
                tick={{ fontSize: 10, fill: textColor }}
                tickFormatter={(v) => `${v}`}
                stroke={gridColor}
              />
              <Tooltip
                formatter={(value: number, name: string) => [
                  name === 'distance'
                    ? `${value.toFixed(1)} km`
                    : `${value.toFixed(0)} Wh/km`,
                  name === 'distance' ? '距离' : '能耗',
                ]}
                contentStyle={{
                  backgroundColor: 'var(--theme-card)',
                  border: '1px solid var(--theme-card-border)',
                  borderRadius: '8px',
                  boxShadow: 'var(--theme-card-shadow)',
                }}
                labelStyle={{ color: 'var(--theme-text)' }}
                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
              />
              <Bar dataKey="distance" name="distance" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => {
                  const intensity = entry.distance / maxDistance;
                  const colorIndex = Math.min(
                    Math.floor((1 - intensity) * (barColors.length - 1)),
                    barColors.length - 1
                  );
                  return (
                    <Cell
                      key={`cell-${index}`}
                      fill={barColors[colorIndex]}
                      fillOpacity={0.8 + intensity * 0.2}
                    />
                  );
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
