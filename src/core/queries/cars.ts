export const CAR_QUERIES = {
  /** 获取车辆列表 */
  list: `
    SELECT
      id,
      name,
      vin,
      model,
      efficiency,
      display_priority
    FROM cars
    ORDER BY display_priority ASC, name ASC
  `,

  /** 获取电池电量 */
  batteryLevel: `
    SELECT battery_level, date
    FROM positions
    WHERE car_id = $car_id AND ideal_battery_range_km IS NOT NULL
    ORDER BY date DESC
    LIMIT 1
  `,

  /** 获取续航里程 */
  range: `
    SELECT ideal_battery_range_km as range
    FROM positions
    WHERE car_id = $car_id AND ideal_battery_range_km IS NOT NULL
    ORDER BY date DESC
    LIMIT 1
  `,

  /** 获取里程表 */
  odometer: `
    SELECT odometer
    FROM positions
    WHERE car_id = $car_id AND ideal_battery_range_km IS NOT NULL
    ORDER BY date DESC
    LIMIT 1
  `,

  /** 获取软件版本 */
  softwareVersion: `
    SELECT split_part(version, ' ', 1) as version
    FROM updates
    WHERE car_id = $car_id
    ORDER BY start_date DESC
    LIMIT 1
  `,

  /** 获取车辆状态 */
  state: `
    SELECT state
    FROM states
    WHERE car_id = $car_id
    ORDER BY start_date DESC
    LIMIT 1
  `,
} as const;
