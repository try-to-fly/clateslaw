/**
 * Web 端常量配置
 */

/**
 * 电池相关常量
 */
export const BATTERY = {
  /** 电池容量 (kWh) - Model 3 LR */
  CAPACITY_KWH: 75,
  /** 每百分比电量对应的 kWh */
  KWH_PER_PERCENT: 0.75,
} as const;

/**
 * 地图相关常量
 */
export const MAP = {
  /** 地图默认高度 class */
  DEFAULT_HEIGHT_CLASS: 'h-36',
  /** 单行程地图高度 class */
  DRIVE_HEIGHT_CLASS: 'h-56',
  /** 轨迹线宽度 */
  POLYLINE_WIDTH: 4,
  /** 轨迹线透明度 */
  POLYLINE_OPACITY: 0.8,
} as const;

/**
 * 主题颜色配置
 */
export const THEME_COLORS = {
  tesla: {
    accent: '#e82127',
    success: '#22c55e',
    error: '#ef4444',
  },
  cyberpunk: {
    accent: '#00f5ff',
    success: '#00ff88',
    error: '#ff0055',
  },
  glass: {
    accent: '#3b82f6',
    success: '#22c55e',
    error: '#ef4444',
  },
} as const;

/**
 * 速度阈值 (km/h)
 */
export const SPEED_THRESHOLDS = {
  /** 低速上限 */
  LOW: 30,
  /** 中速上限 */
  MEDIUM: 80,
} as const;
