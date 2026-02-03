export const SETTINGS_QUERIES = {
  /** 获取全局设置 */
  get: `
    SELECT
      unit_of_length,
      unit_of_temperature,
      preferred_range,
      base_url
    FROM settings
    LIMIT 1
  `,
} as const;
