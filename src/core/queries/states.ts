export const STATES_QUERIES = {
  /** 获取状态历史列表 */
  list: `
    SELECT
      id,
      state,
      start_date,
      end_date,
      COALESCE(EXTRACT(EPOCH FROM (end_date - start_date)) / 60, 0)::integer AS duration_min
    FROM states
    WHERE car_id = $car_id
    ORDER BY start_date DESC
    LIMIT $limit
  `,

  /** 获取当前状态 */
  current: `
    SELECT state, start_date
    FROM states
    WHERE car_id = $car_id
    ORDER BY start_date DESC
    LIMIT 1
  `,

  /** 获取状态统计 */
  stats: `
    WITH state_durations AS (
      SELECT
        state,
        COUNT(*) AS count,
        SUM(EXTRACT(EPOCH FROM (COALESCE(end_date, NOW()) - start_date)) / 60)::integer AS total_duration_min
      FROM states
      WHERE car_id = $car_id
      GROUP BY state
    ),
    total AS (
      SELECT SUM(total_duration_min) AS total FROM state_durations
    )
    SELECT
      sd.state,
      sd.count,
      sd.total_duration_min,
      ROUND((sd.total_duration_min::numeric / NULLIF(t.total, 0) * 100), 1) AS percentage
    FROM state_durations sd, total t
    ORDER BY sd.total_duration_min DESC
  `,
} as const;
