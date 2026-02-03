export const PROJECTED_RANGE_QUERIES = {
  /** 获取预计续航统计 */
  stats: `
    SELECT
      (SUM(rated_battery_range_km) / NULLIF(SUM(COALESCE(usable_battery_level, battery_level)), 0) * 100) AS projected_range,
      AVG(battery_level) AS avg_battery_level,
      AVG(COALESCE(usable_battery_level, battery_level)) AS avg_usable_battery_level,
      MAX(odometer) AS current_odometer
    FROM (
      SELECT battery_level, usable_battery_level, date, rated_battery_range_km, odometer
      FROM positions
      WHERE car_id = $car_id AND ideal_battery_range_km IS NOT NULL
      ORDER BY date DESC
      LIMIT 100
    ) AS data
  `,

  /** 获取预计续航历史 */
  history: `
    SELECT
      DATE(date) AS date,
      (SUM(rated_battery_range_km) / NULLIF(SUM(COALESCE(usable_battery_level, battery_level)), 0) * 100) AS projected_range,
      AVG(odometer) AS odometer
    FROM positions
    WHERE car_id = $car_id AND ideal_battery_range_km IS NOT NULL
    GROUP BY DATE(date)
    ORDER BY date DESC
    LIMIT $limit
  `,
} as const;
