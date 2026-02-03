export function isValidTimestamp(value: unknown): boolean {
  if (typeof value !== 'number') return false;
  // Unix 毫秒时间戳范围: 2000-01-01 到 2100-01-01
  const minTimestamp = 946684800000;
  const maxTimestamp = 4102444800000;
  return value >= minTimestamp && value <= maxTimestamp;
}

export function isNonNegative(value: unknown): boolean {
  return typeof value === 'number' && value >= 0;
}

export function isPositive(value: unknown): boolean {
  return typeof value === 'number' && value > 0;
}

export function isPercentage(value: unknown): boolean {
  return typeof value === 'number' && value >= 0 && value <= 100;
}

export function isInRange(value: unknown, min: number, max: number): boolean {
  return typeof value === 'number' && value >= min && value <= max;
}

export function hasRequiredFields<T extends object>(
  obj: T,
  fields: (keyof T)[]
): boolean {
  return fields.every((field) => field in obj);
}

export function isValidISODate(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  const date = new Date(value);
  return !isNaN(date.getTime());
}

export function hasUniqueIds<T extends { id: number | string }>(
  items: T[]
): boolean {
  const ids = items.map((item) => item.id);
  return new Set(ids).size === ids.length;
}

export function countNullValues<T extends object>(
  items: T[],
  field: keyof T
): number {
  return items.filter((item) => item[field] === null).length;
}
