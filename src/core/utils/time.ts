/**
 * 时间工具函数
 * 用于计算周、月的时间范围
 */

export interface TimeRangeResult {
  from: string;
  to: string;
  label: string;
}

/**
 * 获取ISO周数
 */
export function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

/**
 * 获取指定日期所在周的起止日期（周一到周日）
 */
export function getWeekRange(dateStr?: string): TimeRangeResult {
  const date = dateStr ? new Date(dateStr) : new Date();
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;

  const monday = new Date(date);
  monday.setDate(date.getDate() + diff);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  const weekNum = getWeekNumber(monday);
  const label = `${monday.getFullYear()}年第${weekNum}周`;

  return {
    from: monday.toISOString(),
    to: sunday.toISOString(),
    label,
  };
}

/**
 * 获取指定日期所在月的起止日期
 */
export function getMonthRange(dateStr?: string): TimeRangeResult {
  const date = dateStr ? new Date(dateStr) : new Date();

  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
  firstDay.setHours(0, 0, 0, 0);

  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  lastDay.setHours(23, 59, 59, 999);

  const label = `${date.getFullYear()}年${date.getMonth() + 1}月`;

  return {
    from: firstDay.toISOString(),
    to: lastDay.toISOString(),
    label,
  };
}

/**
 * 获取上一周的时间范围
 */
export function getPreviousWeekRange(dateStr?: string): TimeRangeResult {
  const currentRange = getWeekRange(dateStr);
  const prevDate = new Date(currentRange.from);
  prevDate.setDate(prevDate.getDate() - 7);
  return getWeekRange(prevDate.toISOString());
}

/**
 * 获取上一月的时间范围
 */
export function getPreviousMonthRange(dateStr?: string): TimeRangeResult {
  const currentRange = getMonthRange(dateStr);
  const prevDate = new Date(currentRange.from);
  prevDate.setMonth(prevDate.getMonth() - 1);
  return getMonthRange(prevDate.toISOString());
}
