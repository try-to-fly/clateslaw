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
      AND cp.start_date >= '$from'::timestamptz
      AND cp.start_date <= '$to'::timestamptz
    ORDER BY cp.start_date DESC
    LIMIT $limit
  `,

  /** 获取充电过程的详细曲线数据 */
  curve: `
    SELECT
      c.date,
      c.battery_level,
      c.usable_battery_level,
      c.charger_power,
      c.charger_voltage,
      c.charger_actual_current,
      c.charge_energy_added,
      c.rated_battery_range_km
    FROM charges c
    WHERE c.charging_process_id = $charging_process_id
    ORDER BY c.date ASC
  `,
} as const;
