import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import type { DriveRecord } from '../../../types/drive';

interface EnergyBarProps {
  drives: DriveRecord[];
}

export function EnergyBar({ drives }: EnergyBarProps) {
  const chartData = drives.slice(0, 10).reverse().map((drive, index) => ({
    name: `#${index + 1}`,
    distance: drive.distance,
    efficiency: drive.distance > 0
      ? (drive.power_max * drive.duration_min / 60) / drive.distance * 100
      : 0,
  }));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">行程能耗对比</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${v}`} />
              <Tooltip
                formatter={(value: number, name: string) => [
                  name === 'distance' ? `${value.toFixed(1)} km` : `${value.toFixed(0)} Wh/km`,
                  name === 'distance' ? '距离' : '能耗',
                ]}
              />
              <Bar dataKey="distance" fill="#3b82f6" name="distance" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
