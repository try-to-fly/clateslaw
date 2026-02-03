import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m`;
}

export function formatDistance(km: number): string {
  return `${km.toFixed(1)} km`;
}

export function formatEnergy(kwh: number): string {
  return `${kwh.toFixed(2)} kWh`;
}

export function formatSpeed(kmh: number): string {
  return `${kmh.toFixed(0)} km/h`;
}

export function formatPower(kw: number): string {
  return `${kw.toFixed(1)} kW`;
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * RGB 颜色插值
 * @param color1 起始颜色 (hex)
 * @param color2 结束颜色 (hex)
 * @param factor 插值因子 (0-1)
 */
export function interpolateColor(color1: string, color2: string, factor: number): string {
  const hex1 = color1.replace('#', '');
  const hex2 = color2.replace('#', '');

  const r1 = parseInt(hex1.substring(0, 2), 16);
  const g1 = parseInt(hex1.substring(2, 4), 16);
  const b1 = parseInt(hex1.substring(4, 6), 16);

  const r2 = parseInt(hex2.substring(0, 2), 16);
  const g2 = parseInt(hex2.substring(2, 4), 16);
  const b2 = parseInt(hex2.substring(4, 6), 16);

  const r = Math.round(r1 + (r2 - r1) * factor);
  const g = Math.round(g1 + (g2 - g1) * factor);
  const b = Math.round(b1 + (b2 - b1) * factor);

  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

/**
 * 根据速度和主题返回对应颜色
 * 绿色 = 低速 (< 30 km/h)
 * 黄色 = 中速 (30-80 km/h)
 * 红色 = 高速 (> 80 km/h)
 */
export function getSpeedColor(speed: number, theme: 'tesla' | 'cyberpunk' | 'glass' = 'tesla'): string {
  const colorSchemes = {
    tesla: {
      low: '#22c55e',    // 绿色
      mid: '#eab308',    // 黄色
      high: '#e82127',   // 红色
    },
    cyberpunk: {
      low: '#00ff88',    // 霓虹绿
      mid: '#ffff00',    // 霓虹黄
      high: '#ff0055',   // 霓虹红
    },
    glass: {
      low: '#22c55e',    // 绿色
      mid: '#f59e0b',    // 琥珀色
      high: '#ef4444',   // 红色
    },
  };

  const colors = colorSchemes[theme] || colorSchemes.tesla;

  if (speed < 30) {
    // 0-30: 纯绿到绿黄过渡
    const factor = speed / 30;
    return interpolateColor(colors.low, colors.mid, factor);
  } else if (speed < 80) {
    // 30-80: 黄到红过渡
    const factor = (speed - 30) / 50;
    return interpolateColor(colors.mid, colors.high, factor);
  } else {
    // 80+: 纯红色
    return colors.high;
  }
}
