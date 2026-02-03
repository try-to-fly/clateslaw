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
        COALESCE(g.name, a.name) AS name,
        a.city,
        a.state,
        a.country,
        COUNT(*) AS visit_count
      FROM all_locations al
      JOIN addresses a ON a.id = al.address_id
      LEFT JOIN geofences g ON ST_Contains(g.geofence, a.position)
      GROUP BY a.id, g.name, a.name, a.city, a.state, a.country
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
} as const;
