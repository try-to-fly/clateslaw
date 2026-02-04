export const LOCATIONS_QUERIES = {
  /** 获取位置统计 */
  stats: `
    SELECT
      COUNT(*) AS total_addresses,
      COUNT(DISTINCT city) AS total_cities,
      COUNT(DISTINCT state) AS total_states,
      COUNT(DISTINCT country) AS total_countries
    FROM addresses
    WHERE id IN (
      SELECT start_address_id FROM drives WHERE car_id = $car_id
      UNION
      SELECT end_address_id FROM drives WHERE car_id = $car_id
      UNION
      SELECT address_id FROM charging_processes WHERE car_id = $car_id
    )
  `,

  /** 获取热门位置 */
  topLocations: `
    WITH all_locations AS (
      SELECT address_id FROM charging_processes WHERE car_id = $car_id
      UNION ALL
      SELECT start_address_id FROM drives WHERE car_id = $car_id
      UNION ALL
      SELECT end_address_id FROM drives WHERE car_id = $car_id
    ),
    location_visits AS (
      SELECT
        a.id,
        a.name,
        a.city,
        a.state,
        a.country,
        COUNT(*) AS visit_count
      FROM all_locations al
      JOIN addresses a ON a.id = al.address_id
      GROUP BY a.id, a.name, a.city, a.state, a.country
    ),
    charge_stats AS (
      SELECT
        address_id,
        COUNT(*) AS total_charges,
        COALESCE(SUM(charge_energy_added), 0) AS total_energy_added
      FROM charging_processes
      WHERE car_id = $car_id
      GROUP BY address_id
    )
    SELECT
      lv.name,
      lv.city,
      lv.state,
      lv.country,
      lv.visit_count,
      COALESCE(cs.total_charges, 0) AS total_charges,
      COALESCE(cs.total_energy_added, 0) AS total_energy_added
    FROM location_visits lv
    LEFT JOIN charge_stats cs ON cs.address_id = lv.id
    ORDER BY lv.visit_count DESC
    LIMIT $top
  `,

  /** 获取充电站统计 */
  chargingStations: `
    WITH charge_power AS (
      SELECT
        c.charging_process_id,
        MAX(c.charger_power) AS max_power,
        AVG(c.charger_power) AS avg_power
      FROM charges c
      GROUP BY c.charging_process_id
    ),
    station_stats AS (
      SELECT
        a.id,
        a.name,
        a.city,
        a.state,
        COUNT(*) AS total_charges,
        COALESCE(SUM(cp.charge_energy_added), 0) AS total_energy_added,
        COALESCE(AVG(chp.avg_power), 0) AS avg_power_kw,
        COALESCE(AVG(EXTRACT(EPOCH FROM (cp.end_date - cp.start_date)) / 60), 0) AS avg_duration_min,
        COALESCE(SUM(cp.cost), 0) AS total_cost,
        COALESCE(MAX(chp.max_power), 0) > 50 AS is_supercharger
      FROM charging_processes cp
      JOIN addresses a ON a.id = cp.address_id
      LEFT JOIN charge_power chp ON chp.charging_process_id = cp.id
      WHERE cp.car_id = $car_id
        AND cp.charge_energy_added > 0
      GROUP BY a.id, a.name, a.city, a.state
    )
    SELECT
      name,
      city,
      state,
      total_charges,
      total_energy_added,
      avg_power_kw,
      avg_duration_min,
      total_cost,
      is_supercharger
    FROM station_stats
    ORDER BY total_charges DESC
    LIMIT $top
  `,
} as const;
