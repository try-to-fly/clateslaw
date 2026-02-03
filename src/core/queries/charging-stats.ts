export const CHARGING_STATS_QUERIES = {
  /** 获取充电统计汇总 */
  summary: `
    SELECT
      COUNT(*) AS total_charges,
      COALESCE(SUM(charge_energy_added), 0) AS total_energy_added,
      COALESCE(SUM(GREATEST(charge_energy_added, charge_energy_used)), 0) AS total_energy_used,
      COALESCE(SUM(cost), 0) AS total_cost,
      COALESCE(SUM(charge_energy_added) / NULLIF(SUM(GREATEST(charge_energy_added, charge_energy_used)), 0), 0) AS charging_efficiency
    FROM charging_processes
    WHERE car_id = $car_id
      AND duration_min >= $min_duration
      AND charge_energy_added > 0
  `,

  /** 获取超充费用 */
  sucCost: `
    SELECT COALESCE(SUM(cp.cost), 0) AS suc_cost
    FROM charging_processes cp
    LEFT JOIN addresses addr ON addr.id = address_id
    LEFT JOIN geofences geo ON geo.id = geofence_id
    JOIN charges char ON char.charging_process_id = cp.id AND char.date = end_date
    WHERE cp.car_id = $car_id
      AND duration_min >= $min_duration
      AND (addr.name ILIKE '%supercharger%' OR geo.name ILIKE '%supercharger%' OR char.fast_charger_brand = 'Tesla')
      AND NULLIF(char.charger_phases, 0) IS NULL
      AND char.fast_charger_type != 'ACSingleWireCAN'
      AND cp.cost IS NOT NULL
  `,

  /** 获取平均每度电费用 */
  avgCostPerKwh: `
    SELECT
      COALESCE(SUM(cost) / NULLIF(SUM(charge_energy_added), 0), 0) AS avg_cost_per_kwh
    FROM charging_processes
    WHERE car_id = $car_id
      AND duration_min >= $min_duration
      AND charge_energy_added > 0
  `,
} as const;
