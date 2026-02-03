export const TIMELINE_QUERIES = {
  /** 获取时间线事件 */
  list: `
    WITH events AS (
      SELECT
        'Drive' AS action,
        d.start_date,
        d.end_date,
        sa.name AS start_address,
        ea.name AS end_address,
        EXTRACT(EPOCH FROM (d.end_date - d.start_date)) / 60 AS duration_min,
        sp.battery_level AS soc_start,
        ep.battery_level AS soc_end,
        ep.battery_level - sp.battery_level AS soc_diff,
        (d.start_rated_range_km - d.end_rated_range_km) * c.efficiency AS energy_kwh,
        d.distance,
        d.end_km AS odometer
      FROM drives d
      JOIN cars c ON c.id = d.car_id
      JOIN positions sp ON sp.id = d.start_position_id
      JOIN positions ep ON ep.id = d.end_position_id
      LEFT JOIN addresses sa ON sa.id = d.start_address_id
      LEFT JOIN addresses ea ON ea.id = d.end_address_id
      WHERE d.car_id = $car_id AND d.end_date IS NOT NULL

      UNION ALL

      SELECT
        'Charge' AS action,
        cp.start_date,
        cp.end_date,
        a.name AS start_address,
        a.name AS end_address,
        cp.duration_min,
        cp.start_battery_level AS soc_start,
        cp.end_battery_level AS soc_end,
        cp.end_battery_level - cp.start_battery_level AS soc_diff,
        cp.charge_energy_added AS energy_kwh,
        0 AS distance,
        p.odometer
      FROM charging_processes cp
      JOIN positions p ON p.id = cp.position_id
      LEFT JOIN addresses a ON a.id = cp.address_id
      WHERE cp.car_id = $car_id AND cp.end_date IS NOT NULL
    )
    SELECT *
    FROM events
    ORDER BY start_date DESC
    LIMIT $limit
  `,
} as const;
