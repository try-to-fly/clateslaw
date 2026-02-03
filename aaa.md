# TeslaMate Grafana API 调用文档

## 1. 概述

TeslaMate 使用 PostgreSQL 作为数据源，通过 Grafana 展示各种 Tesla 车辆数据看板。本文档整理了所有预设看板的数据查询接口，方便封装 Node.js API。

### 数据源配置

- **类型**: PostgreSQL
- **数据源名称**: `TeslaMate`
- **数据源 UID**: `TeslaMate`

### 核心数据表

| 表名                 | 说明         |
| -------------------- | ------------ |
| `cars`               | 车辆基本信息 |
| `car_settings`       | 车辆设置     |
| `positions`          | 位置记录     |
| `drives`             | 行程记录     |
| `charges`            | 充电详情记录 |
| `charging_processes` | 充电过程记录 |
| `addresses`          | 地址信息     |
| `geofences`          | 地理围栏     |
| `states`             | 车辆状态     |
| `updates`            | 固件更新记录 |
| `settings`           | 系统设置     |

---

## 2. Dashboard 列表

| Dashboard      | UID             | 说明            |
| -------------- | --------------- | --------------- |
| Overview       | `kOuP_Fggz`     | 车辆概览        |
| Charges        | `TSmNYvRRk`     | 充电记录        |
| Drives         | `Y8upc6ZRk`     | 行程记录        |
| Battery Health | `jchmRiqUfXgTM` | 电池健康        |
| Charge Level   | `WopVO_mgz`     | 电量水平        |
| Charging Stats | `-pkIkhmRz`     | 充电统计        |
| Drive Stats    | `_7WkNSyWk`     | 行程统计        |
| Efficiency     | -               | 能效分析        |
| Locations      | -               | 位置统计        |
| Mileage        | `NjtMTFggz`     | 里程统计        |
| States         | `xo4BNRkZz`     | 状态时间线      |
| Updates        | `IiC07mgWz`     | 固件更新        |
| Charge Details | `BHhxFeZRz`     | 充电详情 (内部) |
| Drive Details  | `zm7wN6Zgz`     | 行程详情 (内部) |

---

## 3. 通用变量查询

### 3.1 获取车辆列表

```sql
SELECT
    id as __value,
    CASE WHEN COUNT(id) OVER (PARTITION BY name) > 1 AND name IS NOT NULL
         THEN CONCAT(name, ' - ', RIGHT(vin, 6))
         ELSE COALESCE(name, CONCAT('VIN ', vin))
    END as __text
FROM cars
ORDER BY display_priority ASC, name ASC, vin ASC;
```

### 3.2 获取系统设置

```sql
-- 长度单位 (km/mi)
SELECT unit_of_length FROM settings LIMIT 1;

-- 温度单位 (C/F)
SELECT unit_of_temperature FROM settings LIMIT 1;

-- 首选续航类型 (ideal/rated)
SELECT preferred_range FROM settings LIMIT 1;

-- 基础 URL
SELECT base_url FROM settings LIMIT 1;
```

### 3.3 获取地理围栏列表

```sql
SELECT name AS __text, id AS __value
FROM geofences
ORDER BY name COLLATE "C" ASC;
```

---

## 4. Overview (概览) 查询

### 4.1 电池电量

```sql
(SELECT battery_level, date
FROM positions
WHERE car_id = $car_id AND ideal_battery_range_km IS NOT NULL
ORDER BY date DESC
LIMIT 1)
UNION
SELECT battery_level, date
FROM charges c
JOIN charging_processes p ON p.id = c.charging_process_id
WHERE p.car_id = $car_id
ORDER BY date DESC
LIMIT 1
```

### 4.2 充电电压

```sql
WITH charging_process AS (
  SELECT id, end_date
  FROM charging_processes
  WHERE car_id = $car_id
  ORDER BY start_date DESC
  LIMIT 1
)
SELECT
  date,
  CASE WHEN charging_process.end_date IS NULL THEN charger_voltage
       ELSE 0
  END AS "Charging Voltage [V]"
FROM charges, charging_process
WHERE charging_process.id = charging_process_id
ORDER BY date DESC
LIMIT 1;
```

### 4.3 充电功率

```sql
WITH charging_process AS (
  SELECT id, end_date
  FROM charging_processes
  WHERE car_id = $car_id
  ORDER BY start_date DESC
  LIMIT 1
)
SELECT
  date,
  CASE WHEN charging_process.end_date IS NULL THEN charger_power
       ELSE 0
  END AS "Power [kW]"
FROM charges, charging_process
WHERE charging_process.id = charging_process_id
ORDER BY date DESC
LIMIT 1;
```

### 4.4 平均能耗 (净值)

```sql
SELECT
  sum((start_${preferred_range}_range_km - end_${preferred_range}_range_km) * car.efficiency * 1000) /
  convert_km(sum(distance)::numeric, '$length_unit') as "consumption_$length_unit"
FROM drives
JOIN cars car ON car.id = car_id
WHERE car_id = $car_id
-- 可添加时间过滤: AND $__timeFilter(start_date)
```

### 4.5 总行驶距离

```sql
SELECT
  convert_km(sum(distance)::numeric, '$length_unit') AS distance
FROM drives
WHERE car_id = $car_id
-- 可添加时间过滤: AND $__timeFilter(start_date)
```

### 4.6 当前续航里程

```sql
SELECT date, convert_km(${preferred_range}_battery_range_km, '$length_unit') AS range
FROM (
    (SELECT date, ${preferred_range}_battery_range_km
    FROM positions
    WHERE car_id = $car_id AND ideal_battery_range_km IS NOT NULL
    ORDER BY date DESC
    LIMIT 1)
    UNION ALL
    (SELECT date, ${preferred_range}_battery_range_km
    FROM charges c
    JOIN charging_processes p ON p.id = c.charging_process_id
    WHERE p.car_id = $car_id
    ORDER BY date DESC
    LIMIT 1)
) AS data
ORDER BY date DESC
LIMIT 1;
```

### 4.7 固件版本

```sql
SELECT split_part(version, ' ', 1) as version
FROM updates
WHERE car_id = $car_id
ORDER BY start_date DESC
LIMIT 1
```

### 4.8 里程表

```sql
SELECT date, convert_km(odometer::numeric, '$length_unit') as odometer
FROM positions
WHERE car_id = $car_id AND ideal_battery_range_km IS NOT NULL
ORDER BY date DESC
LIMIT 1;
```

### 4.9 温度信息

```sql
-- 驾驶员温度设置和车内温度
SELECT
    date,
    convert_celsius(driver_temp_setting, '$temp_unit') as "Driver Temperature",
    convert_celsius(inside_temp, '$temp_unit') AS "Inside Temperature"
FROM positions
WHERE driver_temp_setting IS NOT NULL
  AND inside_temp IS NOT NULL
  AND car_id = $car_id
  AND date >= (TIMEZONE('UTC', NOW()) - INTERVAL '60m')
ORDER BY date DESC
LIMIT 1;

-- 室外温度
WITH last_position AS (
    SELECT date, convert_celsius(outside_temp, '$temp_unit') AS outside_temp
    FROM positions
    WHERE car_id = $car_id AND outside_temp IS NOT NULL
      AND date >= (TIMEZONE('UTC', NOW()) - INTERVAL '60m')
    ORDER BY date DESC
    LIMIT 1
),
last_charge AS (
    SELECT date, convert_celsius(outside_temp, '$temp_unit') AS outside_temp
    FROM charges
    JOIN charging_processes ON charges.charging_process_id = charging_processes.id
    WHERE car_id = $car_id AND outside_temp IS NOT NULL
      AND date >= (TIMEZONE('UTC', NOW()) - INTERVAL '60m')
    ORDER BY date DESC
    LIMIT 1
)
SELECT * FROM last_position
UNION ALL
SELECT * FROM last_charge
ORDER BY date DESC
LIMIT 1;
```

### 4.10 车辆状态时间线

```sql
WITH states AS (
  SELECT
    unnest(ARRAY [start_date + interval '1 second', end_date]) AS date,
    unnest(ARRAY [2, 0]) AS state
  FROM charging_processes
  WHERE car_id = $car_id AND start_date > $__timeFrom()
  UNION
  SELECT
    unnest(ARRAY [start_date + interval '1 second', end_date]) AS date,
    unnest(ARRAY [1, 0]) AS state
  FROM drives
  WHERE car_id = $car_id AND start_date > $__timeFrom()
  UNION
  SELECT
    start_date AS date,
    CASE
      WHEN state = 'offline' THEN 3
      WHEN state = 'asleep' THEN 4
      WHEN state = 'online' THEN 5
    END AS state
  FROM states
  WHERE car_id = $car_id AND start_date > $__timeFrom()
  UNION
  SELECT
    unnest(ARRAY [start_date + interval '1 second', end_date]) AS date,
    unnest(ARRAY [6, 0]) AS state
  FROM updates
  WHERE car_id = $car_id AND start_date > $__timeFrom()
)
SELECT date AS "time", state
FROM states
WHERE date IS NOT NULL
ORDER BY date ASC, state ASC;
```

**状态映射:**

- 0: online
- 1: driving
- 2: charging
- 3: offline
- 4: asleep
- 5: online
- 6: updating

---

## 5. Charges (充电记录) 查询

### 5.1 充电记录列表

```sql
WITH data AS (
    SELECT
        (round(extract(epoch FROM start_date) - 10) * 1000) AS start_date_ts,
        (round(extract(epoch FROM end_date) + 10) * 1000) AS end_date_ts,
        start_date,
        end_date,
        CONCAT_WS(', ', COALESCE(addresses.name, nullif(CONCAT_WS(' ', addresses.road, addresses.house_number), '')), addresses.city) AS address,
        g.name as geofence_name,
        g.id as geofence_id,
        p.latitude,
        p.longitude,
        cp.charge_energy_added,
        cp.charge_energy_used,
        duration_min,
        start_battery_level,
        end_battery_level,
        end_${preferred_range}_range_km - start_${preferred_range}_range_km as range_added,
        outside_temp_avg,
        cp.id,
        p.odometer - lag(p.odometer) OVER (ORDER BY start_date) AS distance,
        cars.efficiency,
        cp.car_id,
        cost,
        max(c.charger_voltage) as max_charger_voltage,
        CASE WHEN NULLIF(mode() within group (order by charger_phases),0) is null THEN 'DC' ELSE 'AC' END AS charge_type,
        p.odometer as odometer
    FROM
        charging_processes cp
    LEFT JOIN charges c ON cp.id = c.charging_process_id
    LEFT JOIN positions p ON p.id = cp.position_id
    LEFT JOIN cars ON cars.id = cp.car_id
    LEFT JOIN addresses ON addresses.id = cp.address_id
    LEFT JOIN geofences g ON g.id = geofence_id
    WHERE
        cp.car_id = $car_id AND
        (cp.charge_energy_added IS NULL OR cp.charge_energy_added > 0)
        -- 可添加时间过滤: AND $__timeFilter(start_date)
        -- 可添加地理围栏过滤: AND geofence_id = $geofence
    GROUP BY 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 19, p.odometer
    ORDER BY start_date
)
SELECT
    start_date_ts,
    end_date_ts,
    car_id,
    id,
    start_date,
    end_date,
    COALESCE(geofence_name, address) as address,
    charge_type,
    duration_min,
    cost,
    cost / NULLIF(greatest(charge_energy_added, charge_energy_used), 0) as cost_per_kwh,
    charge_energy_added,
    greatest(charge_energy_used, charge_energy_added) as charge_energy_used,
    charge_energy_added / greatest(charge_energy_used, charge_energy_added) as charging_efficiency,
    convert_celsius(outside_temp_avg, '$temp_unit') AS outside_temp_avg,
    charge_energy_added * 60 / NULLIF(duration_min, 0) AS charge_energy_added_per_hour,
    convert_km(range_added * 60 / NULLIF(duration_min, 0), '$length_unit') AS range_added_per_hour,
    convert_km(range_added, '$length_unit') AS range_added,
    start_battery_level,
    end_battery_level,
    convert_km(odometer::numeric, '$length_unit') AS odometer
FROM data
WHERE (distance >= 0 OR distance IS NULL)
ORDER BY start_date DESC;
```

### 5.2 未完成的充电记录

```sql
SELECT id AS "Charging Process ID", start_date, end_date,
       charge_energy_added, charge_energy_used,
       start_battery_level, end_battery_level, duration_min
FROM charging_processes
WHERE car_id = $car_id AND end_date IS NULL
ORDER BY start_date DESC
```

---

## 6. Drives (行程记录) 查询

### 6.1 行程记录列表

```sql
WITH data AS (
  SELECT
    round(extract(epoch FROM start_date)) * 1000 AS start_date_ts,
    round(extract(epoch FROM end_date)) * 1000 AS end_date_ts,
    car.id as car_id,
    CASE
      WHEN start_geofence.id IS NULL THEN CONCAT('new?lat=', start_position.latitude, '&lng=', start_position.longitude)
      ELSE CONCAT(start_geofence.id, '/edit')
    END as start_path,
    CASE
      WHEN end_geofence.id IS NULL THEN CONCAT('new?lat=', end_position.latitude, '&lng=', end_position.longitude)
      ELSE CONCAT(end_geofence.id, '/edit')
    END as end_path,
    TO_CHAR((duration_min * INTERVAL '1 minute'), 'HH24:MI') as duration_str,
    drives.id as drive_id,
    start_date,
    COALESCE(start_geofence.name, CONCAT_WS(', ', COALESCE(start_address.name, nullif(CONCAT_WS(' ', start_address.road, start_address.house_number), '')), start_address.city)) AS start_address,
    COALESCE(end_geofence.name, CONCAT_WS(', ', COALESCE(end_address.name, nullif(CONCAT_WS(' ', end_address.road, end_address.house_number), '')), end_address.city)) AS end_address,
    duration_min,
    distance,
    start_position.battery_level as start_battery_level,
    end_position.battery_level as end_battery_level,
    start_${preferred_range}_range_km - end_${preferred_range}_range_km as range_diff,
    car.efficiency as car_efficiency,
    outside_temp_avg,
    distance / coalesce(NULLIF(duration_min, 0) * 60, extract(epoch from end_date - start_date)) * 3600 AS avg_speed,
    speed_max,
    power_max,
    ascent,
    descent
  FROM drives
  LEFT JOIN addresses start_address ON start_address_id = start_address.id
  LEFT JOIN addresses end_address ON end_address_id = end_address.id
  LEFT JOIN positions start_position ON start_position_id = start_position.id
  LEFT JOIN positions end_position ON end_position_id = end_position.id
  LEFT JOIN geofences start_geofence ON start_geofence_id = start_geofence.id
  LEFT JOIN geofences end_geofence ON end_geofence_id = end_geofence.id
  LEFT JOIN cars car ON car.id = drives.car_id
  WHERE drives.car_id = $car_id
  -- 可添加时间过滤: AND $__timeFilter(start_date)
)
SELECT
    start_date_ts,
    end_date_ts,
    car_id,
    drive_id,
    start_date,
    start_address,
    end_address,
    duration_min,
    convert_km(distance::numeric, '$length_unit') AS distance,
    start_battery_level as "% Start",
    end_battery_level as "% End",
    convert_celsius(outside_temp_avg, '$temp_unit') AS outside_temp,
    convert_km(avg_speed::numeric, '$length_unit') AS speed_avg,
    convert_km(speed_max::numeric, '$length_unit') AS speed_max,
    power_max,
    CASE
      WHEN range_diff > 0 THEN distance / range_diff
      ELSE NULL
    END as efficiency,
    range_diff * car_efficiency as "consumption_kWh",
    range_diff * car_efficiency / convert_km(distance::numeric, '$length_unit') * 1000 as consumption_kWh_per_unit
FROM data
ORDER BY drive_id DESC;
```

### 6.2 未完成的行程记录

```sql
SELECT id AS "Drive ID", start_date, end_date, distance, duration_min
FROM drives
WHERE car_id = $car_id AND end_date IS NULL
ORDER BY start_date DESC
```

---

## 7. Battery Health (电池健康) 查询

### 7.1 电池容量和效率计算 (复杂查询)

```sql
WITH Aux as (
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

CurrentCapacity AS (
    SELECT AVG(Capacity) AS Capacity
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
        ORDER BY cp.end_date DESC, c.date desc
        LIMIT 100
    ) AS lastCharges
),

MaxCapacity AS (
    SELECT
        MAX(c.rated_battery_range_km * aux.efficiency / c.usable_battery_level) AS Capacity
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
    json_build_object(
        'MaxCapacity', MaxCapacity.Capacity,
        'CurrentCapacity', CASE WHEN CurrentCapacity.Capacity IS NULL THEN 1 ELSE CurrentCapacity.Capacity END,
        'RatedEfficiency', aux.efficiency
    )
FROM (SELECT NULL) AS Base
    LEFT JOIN Aux ON true
    LEFT JOIN MaxCapacity ON true
    LEFT JOIN CurrentCapacity ON true
```

### 7.2 行驶统计

```sql
-- 已记录的行驶距离
SELECT ROUND(convert_km(sum(distance)::numeric, '$length_unit'),0) as "Logged"
FROM drives
WHERE car_id = $car_id;

-- 里程表差值
SELECT ROUND(convert_km((max(end_km) - min(start_km))::numeric, '$length_unit'),0) as "Mileage"
FROM drives WHERE car_id = $car_id;

-- 当前里程表
SELECT ROUND(convert_km(max(end_km)::numeric, '$length_unit'),0) as "Odometer"
FROM drives WHERE car_id = $car_id;
```

### 7.3 充电统计

```sql
-- 充电次数
SELECT COUNT(*) AS "# of Charges"
FROM charging_processes
WHERE car_id = $car_id AND charge_energy_added > 0.01;

-- 总充电能量
SELECT sum(charge_energy_added) as "Total Energy added"
FROM charging_processes
WHERE car_id = $car_id AND charge_energy_added > 0.01;

-- 总使用能量
SELECT SUM(greatest(charge_energy_added, charge_energy_used)) AS "Total Energy used"
FROM charging_processes
WHERE car_id = $car_id AND charge_energy_added > 0.01;

-- 充电效率
SELECT SUM(charge_energy_added) / SUM(greatest(charge_energy_added, charge_energy_used)) AS "Charging Efficiency"
FROM charging_processes
WHERE car_id = $car_id AND charge_energy_added > 0.01;
```

### 7.4 AC/DC 充电比例

```sql
WITH data AS (
  SELECT
    cp.id,
    cp.charge_energy_added,
    CASE WHEN NULLIF(mode() within group (order by charger_phases),0) is null THEN 'DC'
         ELSE 'AC'
    END AS current,
    cp.charge_energy_used
  FROM charging_processes cp
  RIGHT JOIN charges ON cp.id = charges.charging_process_id
  WHERE
    cp.car_id = $car_id
    AND cp.charge_energy_added > 0.01
  GROUP BY 1,2
)
SELECT
  now() AS time,
  SUM(GREATEST(charge_energy_added, charge_energy_used)) AS value,
  current AS metric
FROM data
GROUP BY 3
ORDER BY metric DESC;
```

---

## 8. 辅助函数

TeslaMate 在 PostgreSQL 中定义了一些辅助函数用于单位转换:

### 8.1 距离转换

```sql
-- convert_km(value, unit)
-- unit: 'km' 或 'mi'
-- 示例: convert_km(100, 'mi') 返回英里值
```

### 8.2 温度转换

```sql
-- convert_celsius(value, unit)
-- unit: 'C' 或 'F'
-- 示例: convert_celsius(20, 'F') 返回华氏温度
```

---

## 9. Node.js API 封装建议

### 9.1 推荐的 API 结构

```javascript
// 建议的 API 端点
GET /api/cars                    // 获取车辆列表
GET /api/cars/:id/overview       // 车辆概览
GET /api/cars/:id/charges        // 充电记录
GET /api/cars/:id/drives         // 行程记录
GET /api/cars/:id/battery-health // 电池健康
GET /api/cars/:id/statistics     // 统计数据
GET /api/settings                // 系统设置
GET /api/geofences               // 地理围栏列表
```

### 9.2 查询参数

| 参数              | 说明         | 示例                   |
| ----------------- | ------------ | ---------------------- |
| `from`            | 开始时间     | `2024-01-01T00:00:00Z` |
| `to`              | 结束时间     | `2024-12-31T23:59:59Z` |
| `length_unit`     | 长度单位     | `km` 或 `mi`           |
| `temp_unit`       | 温度单位     | `C` 或 `F`             |
| `preferred_range` | 续航类型     | `ideal` 或 `rated`     |
| `geofence_id`     | 地理围栏ID   | `1`                    |
| `limit`           | 返回数量限制 | `100`                  |
| `offset`          | 分页偏移     | `0`                    |

### 9.3 数据库连接示例

```javascript
const { Pool } = require("pg");

const pool = new Pool({
  host: process.env.DATABASE_HOST,
  port: process.env.DATABASE_PORT,
  database: process.env.DATABASE_NAME,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASS,
});

// 示例查询
async function getCarOverview(carId) {
  const query = `
    SELECT battery_level, date
    FROM positions
    WHERE car_id = $1 AND ideal_battery_range_km IS NOT NULL
    ORDER BY date DESC
    LIMIT 1
  `;
  const result = await pool.query(query, [carId]);
  return result.rows[0];
}
```

---

## 10. 注意事项

1. **时间过滤**: Grafana 使用 `$__timeFilter(column)` 宏进行时间过滤，在 Node.js 中需要手动构建时间条件
2. **变量替换**: 所有 `$variable` 形式的变量需要在查询前替换为实际值
3. **单位转换**: 需要实现 `convert_km` 和 `convert_celsius` 函数或在应用层处理
4. **性能优化**: 对于大数据量查询，建议添加适当的索引和分页
5. **安全性**: 使用参数化查询防止 SQL 注入
