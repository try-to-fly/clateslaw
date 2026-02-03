export const EFFICIENCY_QUERIES = {
  /** 获取净能耗 (行驶中的能耗) */
  netConsumption: `
    SELECT
      COALESCE(
        SUM((start_rated_range_km - end_rated_range_km) * cars.efficiency) / NULLIF(SUM(distance), 0) * 1000,
        0
      ) AS consumption_wh_per_km
    FROM drives
    INNER JOIN cars ON cars.id = car_id
    WHERE
      distance IS NOT NULL
      AND start_rated_range_km - end_rated_range_km >= 0.1
      AND car_id = $car_id
  `,

  /** 获取毛能耗 (充电间隔的能耗) */
  grossConsumption: `
    WITH d1 AS (
      SELECT
        c.car_id,
        lag(end_rated_range_km) OVER (ORDER BY start_date) - start_rated_range_km AS range_loss,
        p.odometer - lag(p.odometer) OVER (ORDER BY start_date) AS distance
      FROM charging_processes c
      LEFT JOIN positions p ON p.id = c.position_id
      WHERE end_date IS NOT NULL AND c.car_id = $car_id
      ORDER BY start_date
    ),
    d2 AS (
      SELECT
        car_id,
        SUM(range_loss) AS range_loss,
        SUM(distance) AS distance
      FROM d1
      WHERE distance >= 0 AND range_loss >= 0
      GROUP BY car_id
    )
    SELECT
      COALESCE(range_loss * c.efficiency / NULLIF(distance, 0) * 1000, 0) AS consumption_wh_per_km
    FROM d2
    LEFT JOIN cars c ON c.id = car_id
  `,

  /** 获取总行驶距离 */
  totalDistance: `
    SELECT COALESCE(SUM(distance), 0) AS total_distance
    FROM drives
    WHERE car_id = $car_id
  `,

  /** 获取按温度分组的效率 */
  efficiencyByTemperature: `
    SELECT
      ROUND(AVG(outside_temp)::numeric, 0) AS temperature,
      ROUND(AVG(distance)::numeric, 1) AS avg_distance,
      ROUND(
        AVG(
          CASE WHEN distance > 0 THEN
            (start_rated_range_km - end_rated_range_km) * cars.efficiency / distance
          ELSE NULL END
        )::numeric,
        3
      ) AS efficiency_ratio
    FROM drives
    INNER JOIN cars ON cars.id = car_id
    WHERE
      car_id = $car_id
      AND distance >= $min_distance
      AND outside_temp IS NOT NULL
      AND start_rated_range_km IS NOT NULL
      AND end_rated_range_km IS NOT NULL
    GROUP BY ROUND(outside_temp::numeric, 0)
    ORDER BY temperature
  `,
} as const;
