import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { cn } from '../../lib/utils';

interface StatsCardProps {
  title: string;
  items: Array<{
    label: string;
    value: string | number;
    unit?: string;
    highlight?: boolean;
  }>;
  className?: string;
}

export function StatsCard({ title, items, className }: StatsCardProps) {
  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {items.map((item, index) => (
            <div key={index} className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">{item.label}</span>
              <span className={cn(
                'font-medium',
                item.highlight && 'text-primary'
              )}>
                {item.value}
                {item.unit && <span className="text-xs text-muted-foreground ml-1">{item.unit}</span>}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
