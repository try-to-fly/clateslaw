export const POSITION_QUERIES = {
  /** 获取最新一个有效定位点 */
  latest: `
    SELECT
      latitude,
      longitude,
      date
    FROM positions
    WHERE car_id = $car_id
      AND latitude IS NOT NULL
      AND longitude IS NOT NULL
    ORDER BY date DESC
    LIMIT 1
  `,
} as const;
