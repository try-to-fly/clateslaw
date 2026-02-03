export const MILEAGE_QUERIES = {
  /** 获取里程统计 */
  stats: `
    SELECT
      COALESCE(MAX(end_km), 0) AS current_odometer,
      COALESCE(SUM(distance), 0) AS total_logged
    FROM drives
    WHERE car_id = $car_id
  `,

  /** 获取每日里程 */
  daily: `
    SELECT
      DATE(start_date) AS date,
      MAX(end_km) AS odometer,
      SUM(distance) AS daily_distance
    FROM drives
    WHERE car_id = $car_id
    GROUP BY DATE(start_date)
    ORDER BY date DESC
    LIMIT $limit
  `,

  /** 获取平均每日里程 */
  avgDaily: `
    WITH daily AS (
      SELECT
        DATE(start_date) AS date,
        SUM(distance) AS daily_distance
      FROM drives
      WHERE car_id = $car_id
      GROUP BY DATE(start_date)
    )
    SELECT
      COALESCE(AVG(daily_distance), 0) AS avg_daily,
      COALESCE(AVG(daily_distance) * 30, 0) AS avg_monthly
    FROM daily
  `,
} as const;
