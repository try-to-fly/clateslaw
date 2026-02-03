export const VAMPIRE_QUERIES = {
  /** 获取吸血鬼耗电记录 */
  list: `
    WITH merge AS (
      SELECT
        c.start_date AS start_date,
        c.end_date AS end_date,
        c.start_rated_range_km AS start_rated_range_km,
        c.end_rated_range_km AS end_rated_range_km,
        start_battery_level,
        end_battery_level,
        p.odometer AS start_km,
        p.odometer AS end_km
      FROM charging_processes c
      JOIN positions p ON c.position_id = p.id
      WHERE c.car_id = $car_id
      UNION
      SELECT
        d.start_date AS start_date,
        d.end_date AS end_date,
        d.start_rated_range_km AS start_rated_range_km,
        d.end_rated_range_km AS end_rated_range_km,
        start_position.battery_level AS start_battery_level,
        end_position.battery_level AS end_battery_level,
        d.start_km AS start_km,
        d.end_km AS end_km
      FROM drives d
      JOIN positions start_position ON d.start_position_id = start_position.id
      JOIN positions end_position ON d.end_position_id = end_position.id
      WHERE d.car_id = $car_id
    ),
    v AS (
      SELECT
        lag(t.end_date) OVER w AS start_date,
        t.start_date AS end_date,
        lag(t.end_rated_range_km) OVER w AS start_range,
        t.start_rated_range_km AS end_range,
        lag(t.end_km) OVER w AS start_km,
        t.start_km AS end_km,
        EXTRACT(EPOCH FROM age(t.start_date, lag(t.end_date) OVER w)) AS duration,
        lag(t.end_battery_level) OVER w AS start_battery_level,
        start_battery_level AS end_battery_level
      FROM merge t
      WINDOW w AS (ORDER BY t.start_date ASC)
      ORDER BY start_date DESC
    )
    SELECT
      v.start_date,
      v.end_date,
      v.duration AS duration_sec,
      -GREATEST(v.start_battery_level - v.end_battery_level, 0) AS soc_diff,
      (v.start_range - v.end_range) AS range_loss,
      (v.start_range - v.end_range) * c.efficiency AS energy_drained,
      ((v.start_range - v.end_range) * c.efficiency) / (v.duration / 3600) * 1000 AS avg_power,
      (v.start_range - v.end_range) / (v.duration / 3600) AS range_loss_per_hour
    FROM v
    JOIN cars c ON c.id = $car_id
    WHERE
      v.duration > ($min_duration * 60)
      AND v.start_range - v.end_range >= 0
      AND v.end_km - v.start_km < 1
    ORDER BY v.start_date DESC
    LIMIT 50
  `,

  /** 获取吸血鬼耗电统计 */
  stats: `
    WITH merge AS (
      SELECT
        c.start_date, c.end_date,
        c.start_rated_range_km, c.end_rated_range_km,
        p.odometer AS start_km, p.odometer AS end_km
      FROM charging_processes c
      JOIN positions p ON c.position_id = p.id
      WHERE c.car_id = $car_id
      UNION
      SELECT
        d.start_date, d.end_date,
        d.start_rated_range_km, d.end_rated_range_km,
        d.start_km, d.end_km
      FROM drives d
      WHERE d.car_id = $car_id
    ),
    v AS (
      SELECT
        lag(t.end_date) OVER w AS start_date,
        t.start_date AS end_date,
        lag(t.end_rated_range_km) OVER w AS start_range,
        t.start_rated_range_km AS end_range,
        lag(t.end_km) OVER w AS start_km,
        t.start_km AS end_km,
        EXTRACT(EPOCH FROM age(t.start_date, lag(t.end_date) OVER w)) AS duration
      FROM merge t
      WINDOW w AS (ORDER BY t.start_date ASC)
    )
    SELECT
      COUNT(*) AS total_records,
      COALESCE(SUM((v.start_range - v.end_range) * c.efficiency), 0) AS total_energy_drained,
      COALESCE(AVG((v.start_range - v.end_range) / (v.duration / 3600)), 0) AS avg_range_loss_per_hour
    FROM v
    JOIN cars c ON c.id = $car_id
    WHERE
      v.duration > ($min_duration * 60)
      AND v.start_range - v.end_range >= 0
      AND v.end_km - v.start_km < 1
  `,
} as const;
