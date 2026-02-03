export const DRIVING_STATS_QUERIES = {
  /** 获取行驶统计汇总 */
  summary: `
    SELECT
      COUNT(*) AS total_drives,
      COALESCE(SUM(distance), 0) AS total_distance,
      COALESCE(SUM(duration_min), 0) AS total_duration_min,
      COALESCE(SUM(distance) / NULLIF(SUM(duration_min), 0) * 60, 0) AS avg_speed,
      0 AS max_speed
    FROM drives
    WHERE car_id = $car_id
      AND end_date IS NOT NULL
  `,

  /** 获取中位行驶距离 */
  medianDistance: `
    SELECT
      COALESCE(percentile_cont(0.5) WITHIN GROUP (ORDER BY distance), 0) AS median_distance
    FROM drives
    WHERE car_id = $car_id
      AND end_date IS NOT NULL
  `,

  /** 获取总能耗 */
  totalEnergy: `
    SELECT
      COALESCE(SUM((start_rated_range_km - end_rated_range_km) * cars.efficiency), 0) AS total_energy_consumed
    FROM drives
    INNER JOIN cars ON drives.car_id = cars.id
    WHERE drives.car_id = $car_id
      AND end_date IS NOT NULL
      AND start_rated_range_km IS NOT NULL
      AND end_rated_range_km IS NOT NULL
  `,
} as const;
