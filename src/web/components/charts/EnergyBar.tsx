import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { DriveRecord } from '../../../types/drive';
import type { ThemeType } from '../../hooks/useTheme';

interface EnergyBarProps {
  drives: DriveRecord[];
  theme?: ThemeType;
}

export function EnergyBar({ drives, theme = 'tesla' }: EnergyBarProps) {
  const chartData = drives.slice(0, 10).reverse().map((drive, index) => ({
    name: `#${index + 1}`,
    distance: drive.distance,
    efficiency: drive.distance > 0
      ? (drive.power_max * drive.duration_min / 60) / drive.distance * 100
      : 0,
  }));

  const cardClass = theme === 'cyberpunk'
    ? 'theme-card cyber-border rounded-lg overflow-hidden'
    : theme === 'glass'
    ? 'theme-card glass-card rounded-xl overflow-hidden'
    : 'theme-card rounded-lg overflow-hidden';

  const gridColor = theme === 'cyberpunk' ? '#3d3d6b' : theme === 'glass' ? 'rgba(255,255,255,0.1)' : '#2a2a2a';
  const textColor = theme === 'cyberpunk' ? '#8888aa' : theme === 'glass' ? '#64748b' : '#666666';
  const barColor = theme === 'cyberpunk' ? '#00f5ff' : theme === 'glass' ? '#3b82f6' : '#e82127';

  return (
    <div className={cardClass}>
      <div className="px-4 py-3 border-b border-[var(--theme-card-border)]">
        <h3 className="text-sm font-medium theme-text">行程能耗对比</h3>
      </div>
      <div className="p-4">
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: textColor }} stroke={gridColor} />
              <YAxis tick={{ fontSize: 10, fill: textColor }} tickFormatter={(v) => `${v}`} stroke={gridColor} />
              <Tooltip
                formatter={(value: number, name: string) => [
                  name === 'distance' ? `${value.toFixed(1)} km` : `${value.toFixed(0)} Wh/km`,
                  name === 'distance' ? '距离' : '能耗',
                ]}
                contentStyle={{ backgroundColor: 'var(--theme-card)', border: '1px solid var(--theme-card-border)' }}
                labelStyle={{ color: 'var(--theme-text)' }}
              />
              <Bar dataKey="distance" fill={barColor} name="distance" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
