import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { formatDistance, formatDuration, formatSpeed, formatEnergy } from '../../lib/utils';
import type { DriveRecord } from '../../../types/drive';

interface DriveCardProps {
  drive: DriveRecord;
}

export function DriveCard({ drive }: DriveCardProps) {
  const efficiency = drive.distance > 0
    ? ((drive.power_max * drive.duration_min / 60) / drive.distance * 100).toFixed(0)
    : '0';

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">行程概要</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 gap-2 text-center">
          <div>
            <div className="text-2xl font-bold text-primary">
              {formatDistance(drive.distance)}
            </div>
            <div className="text-xs text-muted-foreground">距离</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-primary">
              {formatDuration(drive.duration_min)}
            </div>
            <div className="text-xs text-muted-foreground">时长</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-primary">
              {formatSpeed(drive.distance / (drive.duration_min / 60))}
            </div>
            <div className="text-xs text-muted-foreground">均速</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-primary">
              {efficiency}
            </div>
            <div className="text-xs text-muted-foreground">Wh/km</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
