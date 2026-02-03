export const BATTERY_QUERIES = {
  /** 获取电池健康数据 - 当前容量 */
  currentCapacity: `
    WITH aux AS (
      SELECT
        car_id,
        COALESCE(derived_efficiency, car_efficiency) AS efficiency
      FROM (
        SELECT
          ROUND((charge_energy_added / NULLIF(end_rated_range_km - start_rated_range_km, 0))::numeric, 3) * 100 AS derived_efficiency,
          COUNT(*) as count,
          cars.id as car_id,
          cars.efficiency * 100 AS car_efficiency
        FROM cars
          LEFT JOIN charging_processes ON
            cars.id = charging_processes.car_id
            AND duration_min > 10
            AND end_battery_level <= 95
            AND start_rated_range_km IS NOT NULL
            AND end_rated_range_km IS NOT NULL
            AND charge_energy_added > 0
        WHERE cars.id = $car_id
        GROUP BY 1, 3, 4
        ORDER BY 2 DESC
        LIMIT 1
      ) AS Efficiency
    ),
    current_capacity AS (
      SELECT AVG(Capacity) AS capacity
      FROM (
        SELECT
          c.rated_battery_range_km * aux.efficiency / c.usable_battery_level AS Capacity
        FROM charging_processes cp
          INNER JOIN charges c ON c.charging_process_id = cp.id
          INNER JOIN aux ON cp.car_id = aux.car_id
        WHERE
          cp.car_id = $car_id
          AND cp.end_date IS NOT NULL
          AND cp.charge_energy_added >= aux.efficiency
          AND c.usable_battery_level > 0
        ORDER BY cp.end_date DESC, c.date DESC
        LIMIT 100
      ) AS lastCharges
    ),
    max_capacity AS (
      SELECT
        MAX(c.rated_battery_range_km * aux.efficiency / c.usable_battery_level) AS capacity
      FROM charging_processes cp
        INNER JOIN (
          SELECT charging_process_id, MAX(date) as date
          FROM charges WHERE usable_battery_level > 0
          GROUP BY charging_process_id
        ) AS gcharges ON cp.id = gcharges.charging_process_id
        INNER JOIN charges c ON c.charging_process_id = cp.id AND c.date = gcharges.date
        INNER JOIN aux ON cp.car_id = aux.car_id
      WHERE
        cp.car_id = $car_id
        AND cp.end_date IS NOT NULL
        AND cp.charge_energy_added >= aux.efficiency
    )
    SELECT
      COALESCE(max_capacity.capacity, 0) AS usable_capacity_new,
      COALESCE(current_capacity.capacity, 1) AS usable_capacity_now,
      COALESCE(max_capacity.capacity, 0) - COALESCE(current_capacity.capacity, 1) AS capacity_difference,
      aux.efficiency AS efficiency
    FROM aux
      LEFT JOIN max_capacity ON true
      LEFT JOIN current_capacity ON true
  `,

  /** 获取电池健康百分比 */
  healthPercent: `
    WITH aux AS (
      SELECT
        car_id,
        COALESCE(derived_efficiency, car_efficiency) AS efficiency
      FROM (
        SELECT
          ROUND((charge_energy_added / NULLIF(end_rated_range_km - start_rated_range_km, 0))::numeric, 3) * 100 AS derived_efficiency,
          COUNT(*) as count,
          cars.id as car_id,
          cars.efficiency * 100 AS car_efficiency
        FROM cars
          LEFT JOIN charging_processes ON
            cars.id = charging_processes.car_id
            AND duration_min > 10
            AND end_battery_level <= 95
        WHERE cars.id = $car_id
        GROUP BY 1, 3, 4
        ORDER BY 2 DESC
        LIMIT 1
      ) AS Efficiency
    ),
    current_capacity AS (
      SELECT AVG(Capacity) AS capacity
      FROM (
        SELECT
          c.rated_battery_range_km * aux.efficiency / c.usable_battery_level AS Capacity
        FROM charging_processes cp
          INNER JOIN charges c ON c.charging_process_id = cp.id
          INNER JOIN aux ON cp.car_id = aux.car_id
        WHERE cp.car_id = $car_id AND cp.end_date IS NOT NULL AND c.usable_battery_level > 0
        ORDER BY cp.end_date DESC
        LIMIT 100
      ) AS lastCharges
    ),
    max_capacity AS (
      SELECT MAX(c.rated_battery_range_km * aux.efficiency / c.usable_battery_level) AS capacity
      FROM charging_processes cp
        INNER JOIN charges c ON c.charging_process_id = cp.id
        INNER JOIN aux ON cp.car_id = aux.car_id
      WHERE cp.car_id = $car_id AND cp.end_date IS NOT NULL AND c.usable_battery_level > 0
    )
    SELECT
      GREATEST(0, 100.0 - (COALESCE(current_capacity.capacity, 1) * 100.0 / NULLIF(max_capacity.capacity, 0))) AS degradation_percent,
      LEAST(100, 100 - GREATEST(0, 100.0 - (COALESCE(current_capacity.capacity, 1) * 100.0 / NULLIF(max_capacity.capacity, 0)))) AS battery_health_percent
    FROM max_capacity, current_capacity
  `,

  /** 获取当前 SOC */
  currentSoc: `
    SELECT usable_battery_level, date
    FROM (
      (SELECT usable_battery_level, date
       FROM positions
       WHERE car_id = $car_id AND usable_battery_level IS NOT NULL
       ORDER BY date DESC LIMIT 1)
      UNION
      (SELECT usable_battery_level, date
       FROM charges c
       JOIN charging_processes p ON p.id = c.charging_process_id
       WHERE p.car_id = $car_id AND usable_battery_level IS NOT NULL
       ORDER BY date DESC LIMIT 1)
    ) AS last_usable_battery_level
    ORDER BY date DESC LIMIT 1
  `,

  /** 获取充电统计 */
  chargingStats: `
    SELECT
      COUNT(*) AS total_charges,
      SUM(charge_energy_added) AS total_energy_added,
      SUM(GREATEST(charge_energy_added, charge_energy_used)) AS total_energy_used,
      SUM(charge_energy_added) / NULLIF(SUM(GREATEST(charge_energy_added, charge_energy_used)), 0) AS charging_efficiency
    FROM charging_processes
    WHERE car_id = $car_id AND charge_energy_added > 0.01
  `,

  /** 获取 AC/DC 充电能量分布 */
  acDcEnergy: `
    WITH data AS (
      SELECT
        cp.id,
        cp.charge_energy_added,
        CASE WHEN NULLIF(mode() within group (order by charger_phases), 0) is null THEN 'DC' ELSE 'AC' END AS current_type,
        cp.charge_energy_used
      FROM charging_processes cp
      RIGHT JOIN charges ON cp.id = charges.charging_process_id
      WHERE cp.car_id = $car_id AND cp.charge_energy_added > 0.01
      GROUP BY 1, 2, 4
    )
    SELECT
      SUM(CASE WHEN current_type = 'AC' THEN GREATEST(charge_energy_added, charge_energy_used) ELSE 0 END) AS ac_energy,
      SUM(CASE WHEN current_type = 'DC' THEN GREATEST(charge_energy_added, charge_energy_used) ELSE 0 END) AS dc_energy
    FROM data
  `,

  /** 获取里程统计 */
  driveStats: `
    SELECT
      ROUND(SUM(distance)::numeric, 1) AS logged_distance,
      ROUND((MAX(end_km) - MIN(start_km))::numeric, 1) AS mileage,
      ROUND(MAX(end_km)::numeric, 1) AS odometer,
      ROUND((MAX(end_km) - MIN(start_km) - SUM(distance))::numeric, 1) AS data_lost
    FROM drives
    WHERE car_id = $car_id
  `,
} as const;
