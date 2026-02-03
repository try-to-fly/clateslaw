import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import type { ChargeCurvePoint } from '../../../types/charge';

interface ChargeCurveProps {
  data: ChargeCurvePoint[];
}

export function ChargeCurve({ data }: ChargeCurveProps) {
  const chartData = data.map((point, index) => ({
    time: index,
    power: point.charger_power || 0,
    soc: point.battery_level || 0,
    energy: point.charge_energy_added || 0,
  }));

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">充电功率曲线</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 10 }}
                  tickFormatter={(v) => `${Math.round(v * 5)}m`}
                />
                <YAxis
                  tick={{ fontSize: 10 }}
                  tickFormatter={(v) => `${v}kW`}
                />
                <Tooltip
                  formatter={(value: number) => [`${value.toFixed(1)} kW`, '功率']}
                  labelFormatter={(v) => `${Math.round(Number(v) * 5)} 分钟`}
                />
                <Line
                  type="monotone"
                  dataKey="power"
                  stroke="#22c55e"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">电量变化曲线</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 10 }}
                  tickFormatter={(v) => `${Math.round(v * 5)}m`}
                />
                <YAxis
                  tick={{ fontSize: 10 }}
                  domain={[0, 100]}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip
                  formatter={(value: number) => [`${value.toFixed(0)}%`, 'SOC']}
                  labelFormatter={(v) => `${Math.round(Number(v) * 5)} 分钟`}
                />
                <Line
                  type="monotone"
                  dataKey="soc"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}