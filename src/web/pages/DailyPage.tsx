import { useData, type DailyData } from '../hooks/useData';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { StatsCard } from '../components/cards/StatsCard';
import { EnergyBar } from '../components/charts/EnergyBar';
import {
  formatDistance,
  formatDuration,
  formatEnergy,
  formatTime,
} from '../lib/utils';

export default function DailyPage() {
  const data = useData<DailyData>();

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">加载中...</p>
      </div>
    );
  }

  const { date, drives, charges, stats } = data;

  return (
    <div className="min-h-screen bg-gray-50 p-4 space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">
            {new Date(date).toLocaleDateString('zh-CN', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              weekday: 'long',
            })}
          </CardTitle>
        </CardHeader>
      </Card>

      <StatsCard
        title="今日统计"
        items={[
          { label: '总里程', value: formatDistance(stats.totalDistance), highlight: true },
          { label: '总时长', value: formatDuration(stats.totalDuration) },
          { label: '消耗电量', value: formatEnergy(stats.totalEnergyUsed) },
          { label: '充入电量', value: formatEnergy(stats.totalEnergyAdded) },
        ]}
      />

      {drives.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">今日行程 ({drives.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {drives.map((drive) => (
                <div
                  key={drive.id}
                  className="flex justify-between items-center p-2 bg-gray-50 rounded"
                >
                  <div className="flex-1">
                    <div className="text-sm font-medium">
                      {drive.start_location} → {drive.end_location}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatTime(drive.start_date)} - {formatTime(drive.end_date)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-primary">
                      {formatDistance(drive.distance)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatDuration(drive.duration_min)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {charges.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">今日充电 ({charges.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {charges.map((charge) => (
                <div
                  key={charge.id}
                  className="flex justify-between items-center p-2 bg-gray-50 rounded"
                >
                  <div className="flex-1">
                    <div className="text-sm font-medium">{charge.location}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatTime(charge.start_date)} - {formatTime(charge.end_date)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-green-600">
                      +{formatEnergy(charge.charge_energy_added)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {charge.start_battery_level}% → {charge.end_battery_level}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {drives.length > 1 && <EnergyBar drives={drives} />}
    </div>
  );
}
