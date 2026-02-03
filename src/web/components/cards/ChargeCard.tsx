import { formatDuration, formatEnergy } from '../../lib/utils';
import type { ChargeRecord } from '../../../types/charge';
import type { ThemeType } from '../../hooks/useTheme';

interface ChargeCardProps {
  charge: ChargeRecord;
  theme?: ThemeType;
}

export function ChargeCard({ charge, theme = 'tesla' }: ChargeCardProps) {
  const efficiency = charge.charge_energy_used > 0
    ? ((charge.charge_energy_added / charge.charge_energy_used) * 100).toFixed(0)
    : '100';

  const cardClass = theme === 'cyberpunk'
    ? 'theme-card cyber-border rounded-lg overflow-hidden'
    : theme === 'glass'
    ? 'theme-card glass-card rounded-xl overflow-hidden'
    : 'theme-card rounded-lg overflow-hidden';

  const valueClass = theme === 'cyberpunk'
    ? 'text-xl font-bold theme-accent cyber-glow'
    : 'text-xl font-bold theme-accent';

  return (
    <div className={cardClass}>
      <div className="px-4 py-3 border-b border-[var(--theme-card-border)]">
        <h3 className="text-sm font-medium theme-text">充电概要</h3>
      </div>
      <div className="p-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className={valueClass}>{formatEnergy(charge.charge_energy_added)}</div>
            <div className="text-xs theme-text-muted mt-1">充入电量</div>
          </div>
          <div className="text-center">
            <div className={valueClass}>{formatDuration(charge.duration_min)}</div>
            <div className="text-xs theme-text-muted mt-1">时长</div>
          </div>
          <div className="text-center">
            <div className={valueClass}>{efficiency}%</div>
            <div className="text-xs theme-text-muted mt-1">效率</div>
          </div>
          <div className="text-center">
            <div className={valueClass}>
              {charge.cost !== null ? `¥${charge.cost.toFixed(0)}` : '-'}
            </div>
            <div className="text-xs theme-text-muted mt-1">费用</div>
          </div>
        </div>
      </div>
    </div>
  );
}
