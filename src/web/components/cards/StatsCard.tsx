import type { ThemeType } from '../../hooks/useTheme';

interface StatsCardProps {
  title: string;
  items: Array<{
    label: string;
    value: string | number;
    unit?: string;
    highlight?: boolean;
  }>;
  className?: string;
  theme?: ThemeType;
}

export function StatsCard({ title, items, className, theme = 'tesla' }: StatsCardProps) {
  const cardClass = theme === 'cyberpunk'
    ? 'theme-card cyber-border rounded-lg overflow-hidden'
    : theme === 'glass'
    ? 'theme-card glass-card rounded-xl overflow-hidden'
    : 'theme-card rounded-lg overflow-hidden';

  return (
    <div className={`${cardClass} ${className || ''}`}>
      <div className="px-4 py-3 border-b border-[var(--theme-card-border)]">
        <h3 className="text-sm font-medium theme-text">{title}</h3>
      </div>
      <div className="p-4 space-y-2">
        {items.map((item, index) => (
          <div key={index} className="flex justify-between items-center">
            <span className="text-sm theme-text-muted">{item.label}</span>
            <span className={item.highlight ? 'font-medium theme-accent' : 'font-medium theme-text'}>
              {item.value}
              {item.unit && <span className="text-xs theme-text-muted ml-1">{item.unit}</span>}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
