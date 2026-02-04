export const TPMS_QUERIES = {
  /** 获取最新轮胎压力数据 */
  latest: `
    SELECT
      p.date,
      p.tpms_pressure_fl as fl,
      p.tpms_pressure_fr as fr,
      p.tpms_pressure_rl as rl,
      p.tpms_pressure_rr as rr,
      p.outside_temp
    FROM positions p
    WHERE p.car_id = $car_id
      AND p.tpms_pressure_fl IS NOT NULL
    ORDER BY p.date DESC
    LIMIT 1
  `,

  /** 获取时间范围内的轮胎压力历史 */
  history: `
    SELECT
      p.date,
      p.tpms_pressure_fl as fl,
      p.tpms_pressure_fr as fr,
      p.tpms_pressure_rl as rl,
      p.tpms_pressure_rr as rr,
      p.outside_temp
    FROM positions p
    WHERE p.car_id = $car_id
      AND p.tpms_pressure_fl IS NOT NULL
      AND p.date >= '$from'::timestamptz
      AND p.date <= '$to'::timestamptz
    ORDER BY p.date DESC
    LIMIT $limit
  `,

  /** 获取轮胎压力统计 */
  stats: `
    SELECT
      AVG(p.tpms_pressure_fl) as avg_fl,
      AVG(p.tpms_pressure_fr) as avg_fr,
      AVG(p.tpms_pressure_rl) as avg_rl,
      AVG(p.tpms_pressure_rr) as avg_rr,
      MIN(p.tpms_pressure_fl) as min_fl,
      MIN(p.tpms_pressure_fr) as min_fr,
      MIN(p.tpms_pressure_rl) as min_rl,
      MIN(p.tpms_pressure_rr) as min_rr,
      MAX(p.tpms_pressure_fl) as max_fl,
      MAX(p.tpms_pressure_fr) as max_fr,
      MAX(p.tpms_pressure_rl) as max_rl,
      MAX(p.tpms_pressure_rr) as max_rr
    FROM positions p
    WHERE p.car_id = $car_id
      AND p.tpms_pressure_fl IS NOT NULL
      AND p.date >= '$from'::timestamptz
      AND p.date <= '$to'::timestamptz
  `,
} as const;
