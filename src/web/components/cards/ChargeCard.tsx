import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { formatDuration, formatEnergy } from '../../lib/utils';
import type { ChargeRecord } from '../../../types/charge';

interface ChargeCardProps {
  charge: ChargeRecord;
}

export function ChargeCard({ charge }: ChargeCardProps) {
  const efficiency = charge.charge_energy_used > 0
    ? ((charge.charge_energy_added / charge.charge_energy_used) * 100).toFixed(0)
    : '100';

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">充电概要</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 gap-2 text-center">
          <div>
            <div className="text-2xl font-bold text-green-600">
              {formatEnergy(charge.charge_energy_added)}
            </div>
            <div className="text-xs text-muted-foreground">充入电量</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">
              {formatDuration(charge.duration_min)}
            </div>
            <div className="text-xs text-muted-foreground">时长</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">
              {efficiency}%
            </div>
            <div className="text-xs text-muted-foreground">效率</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">
              {charge.cost !== null ? `¥${charge.cost.toFixed(0)}` : '-'}
            </div>
            <div className="text-xs text-muted-foreground">费用</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
