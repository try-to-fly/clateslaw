export const CHARGE_QUERIES = {
  /** 获取充电记录列表 */
  list: `
    SELECT
      cp.id,
      cp.start_date,
      cp.end_date,
      cp.charge_energy_added,
      cp.charge_energy_used,
      cp.start_battery_level,
      cp.end_battery_level,
      cp.duration_min,
      cp.cost,
      COALESCE(g.name, a.city) as location
    FROM charging_processes cp
    LEFT JOIN addresses a ON cp.address_id = a.id
    LEFT JOIN geofences g ON cp.geofence_id = g.id
    WHERE cp.car_id = $car_id
      AND cp.charge_energy_added > 0
    ORDER BY cp.start_date DESC
    LIMIT $limit
  `,
} as const;
