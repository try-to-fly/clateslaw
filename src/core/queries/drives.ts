export const DRIVE_QUERIES = {
  /** 获取行程记录列表 */
  list: `
    SELECT
      d.id,
      d.start_date,
      d.end_date,
      d.distance,
      d.duration_min,
      d.speed_max,
      d.power_max,
      d.outside_temp_avg,
      COALESCE(sg.name, sa.city) as start_location,
      COALESCE(eg.name, ea.city) as end_location
    FROM drives d
    LEFT JOIN addresses sa ON d.start_address_id = sa.id
    LEFT JOIN addresses ea ON d.end_address_id = ea.id
    LEFT JOIN geofences sg ON d.start_geofence_id = sg.id
    LEFT JOIN geofences eg ON d.end_geofence_id = eg.id
    WHERE d.car_id = $car_id
      AND d.distance > 0
      AND d.start_date >= '$from'::timestamptz
      AND d.start_date <= '$to'::timestamptz
    ORDER BY d.start_date DESC
    LIMIT $limit
  `,

  /** 获取行程的 GPS 轨迹数据 */
  positions: `
    SELECT
      p.latitude,
      p.longitude,
      p.date,
      p.battery_level,
      p.speed,
      p.power,
      p.odometer
    FROM positions p
    WHERE p.car_id = $car_id
      AND p.date >= (SELECT start_date FROM drives WHERE id = $drive_id)
      AND p.date <= (SELECT end_date FROM drives WHERE id = $drive_id)
    ORDER BY p.date ASC
  `,
} as const;
