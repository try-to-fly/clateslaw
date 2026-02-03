# Tesla Service CLI API 参考文档

本文档记录了 CLI 命令与 Grafana 仪表板的对应关系，以及各字段的语义说明。

## 目录

- [基础命令](#基础命令)
- [电池与效率](#电池与效率)
- [统计命令](#统计命令)
- [状态与历史](#状态与历史)
- [位置与时间线](#位置与时间线)
- [详情命令](#详情命令)

---

## 基础命令

### `tesla cars`

列出所有车辆。

**Grafana 仪表板**: 无直接对应，查询 `cars` 表

**字段说明**:
| 字段 | 类型 | 说明 |
|------|------|------|
| id | number | 车辆 ID |
| name | string | 车辆名称 |
| vin | string | 车辆识别号 |
| model | string | 车型 |
| efficiency | number | 车辆效率 (kWh/km) |

---

### `tesla car <id>`

获取单个车辆概览。

**Grafana 仪表板**: `overview.json`

**字段说明**:
| 字段 | 类型 | 说明 |
|------|------|------|
| id | number | 车辆 ID |
| name | string | 车辆名称 |
| vin | string | 车辆识别号 |
| model | string | 车型 |
| trim_badging | string | 配置标识 |
| efficiency | number | 车辆效率 (kWh/km) |

---

### `tesla charges <car-id>`

获取充电记录列表。

**Grafana 仪表板**: `charges.json`

**字段说明**:
| 字段 | 类型 | 说明 |
|------|------|------|
| id | number | 充电记录 ID |
| start_date | string | 开始时间 |
| end_date | string | 结束时间 |
| duration_min | number | 充电时长 (分钟) |
| charge_energy_added | number | 充入电量 (kWh) |
| charge_energy_used | number | 实际用电量 (kWh)，含损耗 |
| start_battery_level | number | 开始 SOC (%) |
| end_battery_level | number | 结束 SOC (%) |
| location | string | 充电地点名称 |
| cost | number | 充电费用 |

---

### `tesla drives <car-id>`

获取行程记录列表。

**Grafana 仪表板**: `drives.json`

**字段说明**:
| 字段 | 类型 | 说明 |
|------|------|------|
| id | number | 行程记录 ID |
| start_date | string | 开始时间 |
| end_date | string | 结束时间 |
| duration_min | number | 行程时长 (分钟) |
| distance | number | 行驶距离 (km) |
| start_address | string | 起点地址 |
| end_address | string | 终点地址 |
| speed_avg | number | 平均速度 (km/h) |
| speed_max | number | 最高速度 (km/h) |

---

## 电池与效率

### `tesla battery <car-id>`

电池健康和统计信息。

**Grafana 仪表板**: `battery-health.json`

**字段说明**:

#### 电池健康 (battery_health)
| 字段 | 类型 | 说明 |
|------|------|------|
| battery_health_percent | number | 电池健康度 (%)，100% 为新电池 |
| degradation_percent | number | 电池衰减百分比 (%) |
| usable_capacity_now | number | 当前可用容量 (kWh) |
| usable_capacity_new | number | 新车时可用容量 (kWh) |
| capacity_difference | number | 容量损失 (kWh) |
| current_soc | number | 当前电量百分比 (%) |
| current_stored_energy | number | 当前存储电量 (kWh) |
| efficiency | number | 车辆效率系数 |

#### 充电统计 (charging_stats)
| 字段 | 类型 | 说明 |
|------|------|------|
| total_charges | number | 总充电次数 |
| charging_cycles | number | 等效充电循环数 (总充电量/75kWh) |
| total_energy_added | number | 总充入电量 (kWh) |
| total_energy_used | number | 总用电量 (kWh)，含损耗 |
| charging_efficiency | number | 充电效率 (0-1) |
| ac_energy | number | 交流充电电量 (kWh) |
| dc_energy | number | 直流充电电量 (kWh) |

#### 行驶统计 (drive_stats)
| 字段 | 类型 | 说明 |
|------|------|------|
| logged_distance | number | 已记录行驶距离 (km) |
| mileage | number | 里程表差值 (km) |
| odometer | number | 当前里程表读数 (km) |
| data_lost | number | 数据丢失里程 (km) |

---

### `tesla efficiency <car-id>`

效率分析。

**Grafana 仪表板**: `efficiency.json`

**字段说明**:

#### 效率汇总 (efficiency)
| 字段 | 类型 | 说明 |
|------|------|------|
| net_consumption_wh_per_km | number | 净能耗 (Wh/km)，仅行驶中消耗 |
| gross_consumption_wh_per_km | number | 毛能耗 (Wh/km)，含静置损耗 |
| total_distance | number | 总行驶距离 (km) |

#### 按温度效率 (by_temperature)
| 字段 | 类型 | 说明 |
|------|------|------|
| temperature | number | 外部温度 (°C) |
| avg_distance | number | 该温度下平均行程距离 (km) |
| efficiency_ratio | number | 效率比率 (0-1)，1 为理想效率 |

---

### `tesla projected-range <car-id>`

预计续航分析。

**Grafana 仪表板**: `projected-range.json`

**字段说明**:

#### 统计 (stats)
| 字段 | 类型 | 说明 |
|------|------|------|
| projected_range | number | 预计满电续航 (km) |
| avg_battery_level | number | 平均电池电量 (%) |
| avg_usable_battery_level | number | 平均可用电池电量 (%) |
| current_odometer | number | 当前里程表 (km) |

#### 历史 (history)
| 字段 | 类型 | 说明 |
|------|------|------|
| date | string | 日期 |
| projected_range | number | 当日预计续航 (km) |
| odometer | number | 当日里程表 (km) |

---

## 统计命令

### `tesla stats charging <car-id>`

充电统计汇总。

**Grafana 仪表板**: `charging-stats.json`

**选项**:
- `--from`: 开始时间 (默认: now-90d)
- `--to`: 结束时间 (默认: now)
- `--min-duration`: 最小充电时长 (分钟)

**字段说明**:
| 字段 | 类型 | 说明 |
|------|------|------|
| total_charges | number | 充电次数 |
| total_energy_added | number | 总充入电量 (kWh) |
| total_energy_used | number | 总用电量 (kWh) |
| total_cost | number | 总充电费用 |
| suc_cost | number | 超充费用 |
| avg_cost_per_kwh | number | 平均每度电费用 |
| charging_efficiency | number | 充电效率 (0-1) |

---

### `tesla stats driving <car-id>`

行驶统计汇总。

**Grafana 仪表板**: `drive-stats.json`

**选项**:
- `--from`: 开始时间 (默认: now-90d)
- `--to`: 结束时间 (默认: now)

**字段说明**:
| 字段 | 类型 | 说明 |
|------|------|------|
| total_drives | number | 行程次数 |
| total_distance | number | 总行驶距离 (km) |
| total_energy_consumed | number | 总能耗 (kWh) |
| median_distance | number | 中位行程距离 (km) |
| avg_speed | number | 平均速度 (km/h) |
| max_speed | number | 最高速度 (km/h) |
| total_duration_min | number | 总行驶时长 (分钟) |

---

### `tesla stats period <car-id>`

按周期统计。

**Grafana 仪表板**: `statistics.json`

**选项**:
- `--from`: 开始时间 (默认: now-1y)
- `--to`: 结束时间 (默认: now)
- `--period`: 周期类型 (day/week/month/year，默认: month)

**字段说明**:
| 字段 | 类型 | 说明 |
|------|------|------|
| period | string | 周期标识 (如 2024-01) |
| drives | number | 行程次数 |
| distance | number | 行驶距离 (km) |
| energy_consumed | number | 能耗 (kWh) |
| charges | number | 充电次数 |
| energy_added | number | 充入电量 (kWh) |
| cost | number | 充电费用 |

---

## 状态与历史

### `tesla states <car-id>`

车辆状态历史。

**Grafana 仪表板**: `states.json`

**字段说明**:

#### 当前状态 (current)
| 字段 | 类型 | 说明 |
|------|------|------|
| state | string | 状态名称 (online/offline/asleep) |
| start_date | string | 状态开始时间 |

#### 状态统计 (stats)
| 字段 | 类型 | 说明 |
|------|------|------|
| state | string | 状态名称 |
| count | number | 出现次数 |
| total_duration_min | number | 总持续时长 (分钟) |
| percentage | number | 时间占比 (%) |

#### 状态历史 (history)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | number | 记录 ID |
| state | string | 状态名称 |
| start_date | string | 开始时间 |
| end_date | string | 结束时间 |
| duration_min | number | 持续时长 (分钟) |

---

### `tesla updates <car-id>`

软件更新历史。

**Grafana 仪表板**: `updates.json`

**字段说明**:

#### 统计 (stats)
| 字段 | 类型 | 说明 |
|------|------|------|
| current_version | string | 当前软件版本 |
| total_updates | number | 总更新次数 |
| median_interval_days | number | 更新间隔中位数 (天) |

#### 历史 (history)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | number | 记录 ID |
| version | string | 软件版本号 |
| start_date | string | 更新开始时间 |
| end_date | string | 更新结束时间 |
| duration_min | number | 更新时长 (分钟) |

---

### `tesla mileage <car-id>`

里程统计。

**Grafana 仪表板**: `mileage.json`

**字段说明**:

#### 统计 (stats)
| 字段 | 类型 | 说明 |
|------|------|------|
| current_odometer | number | 当前里程表 (km) |
| total_logged | number | 已记录总里程 (km) |
| avg_daily | number | 日均里程 (km) |
| avg_monthly | number | 月均里程 (km) |

#### 每日里程 (daily)
| 字段 | 类型 | 说明 |
|------|------|------|
| date | string | 日期 |
| odometer | number | 当日里程表 (km) |
| daily_distance | number | 当日行驶距离 (km) |

---

### `tesla vampire <car-id>`

吸血鬼耗电分析（静置时的电量损耗）。

**Grafana 仪表板**: `vampire-drain.json`

**选项**:
- `--min-duration`: 最小静置时长 (分钟，默认: 60)

**字段说明**:

#### 统计 (stats)
| 字段 | 类型 | 说明 |
|------|------|------|
| total_records | number | 记录数 |
| total_energy_drained | number | 总损耗电量 (kWh) |
| avg_range_loss_per_hour | number | 平均每小时续航损失 (km/h) |

#### 记录 (records)
| 字段 | 类型 | 说明 |
|------|------|------|
| start_date | string | 静置开始时间 |
| end_date | string | 静置结束时间 |
| duration_sec | number | 静置时长 (秒) |
| soc_diff | number | SOC 变化 (%) |
| range_loss | number | 续航损失 (km) |
| energy_drained | number | 损耗电量 (kWh) |
| avg_power | number | 平均功耗 (W) |
| range_loss_per_hour | number | 每小时续航损失 (km/h) |

---

## 位置与时间线

### `tesla locations <car-id>`

位置统计。

**Grafana 仪表板**: `locations.json`

**字段说明**:

#### 统计 (stats)
| 字段 | 类型 | 说明 |
|------|------|------|
| total_addresses | number | 总地址数 |
| total_cities | number | 城市数 |
| total_states | number | 省/州数 |
| total_countries | number | 国家数 |

#### 热门位置 (locations)
| 字段 | 类型 | 说明 |
|------|------|------|
| name | string | 地点名称 |
| city | string | 城市 |
| state | string | 省/州 |
| country | string | 国家 |
| visit_count | number | 访问次数 |
| total_charges | number | 充电次数 |
| total_energy_added | number | 充入电量 (kWh) |

---

### `tesla visited <car-id>`

访问地点列表。

**Grafana 仪表板**: `visited.json` (复用 locations 数据)

**字段说明**: 同 `locations` 命令的热门位置

---

### `tesla timeline <car-id>`

活动时间线。

**Grafana 仪表板**: `timeline.json`

**字段说明**:
| 字段 | 类型 | 说明 |
|------|------|------|
| start_date | string | 开始时间 |
| end_date | string | 结束时间 |
| action | string | 活动类型 (Drive/Charge) |
| start_address | string | 起点/充电地点 |
| end_address | string | 终点/充电地点 |
| duration_min | number | 时长 (分钟) |
| soc_start | number | 开始 SOC (%) |
| soc_end | number | 结束 SOC (%) |
| soc_diff | number | SOC 变化 (%) |
| energy_kwh | number | 能量变化 (kWh) |
| distance | number | 行驶距离 (km)，充电时为 0 |
| odometer | number | 里程表 (km) |

---

## 详情命令

### `tesla detail charge <charge-id>`

充电详情。

**Grafana 仪表板**: `internal/charge-details.json`

**字段说明**:
| 字段 | 类型 | 说明 |
|------|------|------|
| id | number | 充电记录 ID |
| start_date | string | 开始时间 |
| end_date | string | 结束时间 |
| duration_min | number | 充电时长 (分钟) |
| charge_energy_added | number | 充入电量 (kWh) |
| charge_energy_used | number | 实际用电量 (kWh) |
| start_battery_level | number | 开始 SOC (%) |
| end_battery_level | number | 结束 SOC (%) |
| start_rated_range_km | number | 开始续航 (km) |
| end_rated_range_km | number | 结束续航 (km) |
| cost | number | 充电费用 |
| location | string | 充电地点 |
| city | string | 城市 |
| country | string | 国家 |

---

### `tesla detail drive <drive-id>`

行程详情。

**Grafana 仪表板**: `internal/drive-details.json`

**字段说明**:
| 字段 | 类型 | 说明 |
|------|------|------|
| id | number | 行程记录 ID |
| start_date | string | 开始时间 |
| end_date | string | 结束时间 |
| duration_min | number | 行程时长 (分钟) |
| distance | number | 行驶距离 (km) |
| start_km | number | 起始里程表 (km) |
| end_km | number | 结束里程表 (km) |
| speed_avg | number | 平均速度 (km/h) |
| speed_max | number | 最高速度 (km/h) |
| outside_temp_avg | number | 平均外部温度 (°C) |
| start_rated_range_km | number | 开始续航 (km) |
| end_rated_range_km | number | 结束续航 (km) |
| energy_consumed | number | 能耗 (kWh) |
| start_location | string | 起点名称 |
| end_location | string | 终点名称 |
| start_city | string | 起点城市 |
| end_city | string | 终点城市 |

---

## Grafana 仪表板映射表

| CLI 命令 | Grafana 仪表板文件 |
|----------|-------------------|
| `battery` | `battery-health.json` |
| `efficiency` | `efficiency.json` |
| `projected-range` | `projected-range.json` |
| `stats charging` | `charging-stats.json` |
| `stats driving` | `drive-stats.json` |
| `stats period` | `statistics.json` |
| `states` | `states.json` |
| `updates` | `updates.json` |
| `mileage` | `mileage.json` |
| `vampire` | `vampire-drain.json` |
| `locations` | `locations.json` |
| `visited` | `visited.json` |
| `timeline` | `timeline.json` |
| `detail charge` | `internal/charge-details.json` |
| `detail drive` | `internal/drive-details.json` |
| `charges` | `charges.json` |
| `drives` | `drives.json` |

---

## 通用选项

所有命令支持以下通用选项：

| 选项 | 说明 | 默认值 |
|------|------|--------|
| `-o, --output <format>` | 输出格式 (table/json) | table |
| `-f, --from <date>` | 开始时间 | 因命令而异 |
| `-t, --to <date>` | 结束时间 | now |
| `-l, --limit <number>` | 记录限制 | 50 |

### 时间格式

支持 Grafana 风格的相对时间：
- `now` - 当前时间
- `now-1h` - 1 小时前
- `now-7d` - 7 天前
- `now-30d` - 30 天前
- `now-90d` - 90 天前
- `now-1y` - 1 年前

---

## 数据库表结构参考

主要涉及的数据库表：

| 表名 | 说明 |
|------|------|
| `cars` | 车辆信息 |
| `drives` | 行程记录 |
| `charging_processes` | 充电记录 |
| `charges` | 充电详细数据点 |
| `positions` | 位置记录 |
| `addresses` | 地址信息 |
| `geofences` | 地理围栏 |
| `states` | 车辆状态历史 |
| `updates` | 软件更新历史 |
| `settings` | 系统设置 |
