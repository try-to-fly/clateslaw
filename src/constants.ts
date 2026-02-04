/**
 * 截图相关常量
 */
export const SCREENSHOT = {
  /** 默认截图宽度 (px) */
  DEFAULT_WIDTH: 402,
  /** 默认设备像素比 */
  DEFAULT_SCALE: 3,
  /** 地图加载超时时间 (ms) */
  MAP_LOAD_TIMEOUT: 8000,
  /** 内容渲染超时时间 (ms) */
  CONTENT_RENDER_TIMEOUT: 10000,
  /** 渲染后等待时间 (ms) */
  RENDER_DELAY: 500,
} as const;

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
 * 查询相关常量
 */
export const QUERY = {
  /** 默认查询限制数量 */
  DEFAULT_LIMIT: 50,
  /** 最大查询限制数量 */
  MAX_LIMIT: 200,
  /** 缓存 TTL (ms) - 5 分钟 */
  CACHE_TTL: 5 * 60 * 1000,
} as const;

/**
 * 浏览器池相关常量
 */
export const BROWSER_POOL = {
  /** 每个浏览器实例最大使用次数 */
  MAX_USE_COUNT: 50,
} as const;

/**
 * 时间范围默认值
 */
export const TIME_RANGE = {
  /** 默认查询天数 */
  DEFAULT_DAYS: 90,
  /** 周报/月报环比比较 */
  COMPARISON_ENABLED: true,
} as const;
