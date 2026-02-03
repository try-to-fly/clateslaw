export const UPDATES_QUERIES = {
  /** 获取更新历史列表 */
  list: `
    SELECT
      id,
      version,
      start_date,
      end_date,
      COALESCE(EXTRACT(EPOCH FROM (end_date - start_date)) / 60, 0)::integer AS duration_min
    FROM updates
    WHERE car_id = $car_id
    ORDER BY start_date DESC
    LIMIT $limit
  `,

  /** 获取更新统计 */
  stats: `
    SELECT
      COUNT(*) AS total_updates
    FROM updates
    WHERE car_id = $car_id
  `,

  /** 获取更新间隔中位数 */
  medianInterval: `
    SELECT COALESCE(
      percentile_disc(0.5) WITHIN GROUP (ORDER BY since_last_update) / 86400,
      0
    ) AS median_interval_days
    FROM (
      SELECT EXTRACT(EPOCH FROM start_date - lag(start_date) OVER (ORDER BY start_date)) AS since_last_update
      FROM updates
      WHERE car_id = $car_id
    ) d
    WHERE since_last_update IS NOT NULL
  `,

  /** 获取当前版本 */
  currentVersion: `
    SELECT version
    FROM updates
    WHERE car_id = $car_id
    ORDER BY start_date DESC
    LIMIT 1
  `,
} as const;
