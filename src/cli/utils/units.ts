/** 距离单位转换 (km -> mi) */
export function convertKm(value: number, unit: 'km' | 'mi'): number {
  return unit === 'mi' ? value * 0.621371 : value;
}

/** 温度单位转换 (C -> F) */
export function convertCelsius(value: number, unit: 'C' | 'F'): number {
  return unit === 'F' ? value * 9 / 5 + 32 : value;
}

/** 格式化距离显示 */
export function formatDistance(value: number, unit: 'km' | 'mi'): string {
  const converted = convertKm(value, unit);
  return `${converted.toFixed(1)} ${unit}`;
}

/** 格式化温度显示 */
export function formatTemperature(value: number, unit: 'C' | 'F'): string {
  const converted = convertCelsius(value, unit);
  return `${converted.toFixed(1)}°${unit}`;
}

/** 格式化能耗效率 (Wh/km or Wh/mi) */
export function formatEfficiency(whPerKm: number, unit: 'km' | 'mi'): string {
  const value = unit === 'mi' ? whPerKm / 0.621371 : whPerKm;
  return `${value.toFixed(0)} Wh/${unit}`;
}

/** 格式化持续时间 (分钟 -> 可读格式) */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

/** 格式化百分比 */
export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/** 格式化能量 (kWh) */
export function formatEnergy(kwh: number, decimals = 2): string {
  return `${kwh.toFixed(decimals)} kWh`;
}
