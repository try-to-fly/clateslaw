import { useData, type DriveData } from '../hooks/useData';
import { DriveCard } from '../components/cards/DriveCard';
import { StatsCard } from '../components/cards/StatsCard';
import { DriveRoute } from '../components/maps/DriveRoute';
import { formatDate, formatTime, formatSpeed, formatPower } from '../lib/utils';

export default function DrivePage() {
  const data = useData<DriveData>();

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">加载中...</p>
      </div>
    );
  }

  const { drive, positions } = data;

  return (
    <div className="min-h-screen bg-gray-50 p-4 space-y-4">
      <DriveCard drive={drive} />

      <DriveRoute
        positions={positions}
        startLocation={drive.start_location}
        endLocation={drive.end_location}
      />

      <StatsCard
        title="详细信息"
        items={[
          { label: '开始时间', value: formatDate(drive.start_date) },
          { label: '结束时间', value: formatDate(drive.end_date) },
          { label: '最高速度', value: formatSpeed(drive.speed_max) },
          { label: '最大功率', value: formatPower(drive.power_max) },
          {
            label: '平均温度',
            value: `${drive.outside_temp_avg?.toFixed(1) || '-'}`,
            unit: '°C',
          },
        ]}
      />
    </div>
  );
}
