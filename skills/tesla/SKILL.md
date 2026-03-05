---
name: tesla
description: Tesla 车辆数据查询与可视化，支持行程、充电、电池、效率等数据查询和截图生成
homepage: https://github.com/try-to-fly/clateslaw
metadata:
  openclaw:
    emoji: "🚗"
    version: "1.0.0"
    requires:
      bins:
        - tesla
        - openclaw
      env:
        - GRAFANA_URL
        - GRAFANA_TOKEN
        - OPENCLAW_CHANNEL
        - OPENCLAW_TARGET
    optional_env:
      - MQTT_HOST
      - MQTT_PORT
      - VITE_AMAP_KEY
---

# Tesla 自然语言查询 Skill

## 概述

此 Skill 使 AI 能够解析用户的自然语言请求，生成 TeslaQuery JSON，并执行对应的命令来查询 Tesla 车辆数据或生成截图。

## 执行方式

根据查询类型选择不同的执行方式：

| 场景 | 命令 |
|------|------|
| 需要截图发送 | `tesla screenshot query '<json>' --send` |
| 仅生成截图 | `tesla screenshot query '<json>'` |
| 纯数据查询 | `tesla query '<json>'` |

## 意图识别规则

### 截图类查询（使用 `tesla screenshot query`）

| 自然语言示例 | type | 说明 |
|-------------|------|------|
| "最近的行程" / "上一次行程" | `drives` | 需要截图，limit: 1 |
| "最近的充电" / "上一次充电" | `charges` | 需要截图，limit: 1 |
| "今天汇总" / "日报" / "今天的日报" | `screenshot` | screenshot.type: daily |
| "昨天的日报" | `screenshot` | screenshot.type: daily, date: 昨天日期 |
| "本周汇总" / "周报" | `screenshot` | screenshot.type: weekly |
| "上周周报" | `screenshot` | screenshot.type: weekly, date: 上周某天日期 |
| "本月汇总" / "月报" | `screenshot` | screenshot.type: monthly |
| "上月月报" | `screenshot` | screenshot.type: monthly, date: 上月某天日期 |
| "年报" / "今年汇总" / "年度报告" | `screenshot` | screenshot.type: yearly |
| "去年年报" / "2024年报" | `screenshot` | screenshot.type: yearly, date: 指定年份 |
| "行程 123 详情" / "查看行程 123" | `detail.drive` | recordId: 123 |
| "充电 456 详情" / "查看充电 456" | `detail.charge` | recordId: 456 |

### 纯数据查询（使用 `tesla query`）

| 自然语言示例 | type | 说明 |
|-------------|------|------|
| "这周开了多少公里" | `stats.driving` | timeRange: this_week |
| "本月充电统计" | `stats.charging` | timeRange: this_month |
| "电池状态" / "电池健康" / "电池衰减" / "电池寿命" | `battery` | 返回电池健康数据 |
| "最近的行程列表" | `drives` | 返回行程列表，不截图 |
| "效率报告" | `efficiency` | 返回效率数据 |
| "开了多远" / "总里程" / "里程统计" | `mileage` | 返回里程数据 |
| "车辆信息" | `car` | 返回车辆概览 |
| "待机耗电" / "吸血鬼" / "停车耗电" | `vampire` | 返回待机能耗数据 |
| "去过哪里" / "常去地点" / "位置统计" | `locations` | 返回位置统计数据 |
| "充电站分析" / "充电站统计" / "常用充电站" | `locations.charging` | 返回充电站使用统计（超充/家充比例等） |
| "软件版本" / "更新记录" / "固件版本" | `updates` | 返回固件更新历史 |
| "轮胎压力" / "胎压" / "TPMS" | `tpms` | 返回轮胎压力监测数据 |

## 时间映射表

| 中文表达 | SemanticTime |
|---------|-------------|
| 今天 | `today` |
| 昨天 | `yesterday` |
| 这周 / 本周 | `this_week` |
| 上周 | `last_week` |
| 这个月 / 本月 | `this_month` |
| 上个月 | `last_month` |
| 今年 / 本年 | `this_year` |
| 去年 | `last_year` |
| 最近3天 | `last_3_days` |
| 最近7天 / 最近一周 | `last_7_days` |
| 最近30天 / 最近一个月 | `last_30_days` |
| 最近90天 / 最近三个月 | `last_90_days` |
| 所有时间 / 全部 | `all_time` |

## TeslaQuery JSON 结构

```typescript
interface TeslaQuery {
  version: '1.0';           // 必须是 "1.0"
  type: QueryType;          // 查询类型
  carId?: number;           // 车辆 ID，默认 1
  recordId?: number;        // 记录 ID（用于 detail.drive/detail.charge）
  timeRange?: {
    semantic?: SemanticTime;  // 语义时间
  };
  pagination?: {
    limit?: number;         // 返回数量限制
  };
  screenshot?: {
    type: 'drive' | 'charge' | 'daily' | 'weekly' | 'monthly';
    id?: number;            // 截图的记录 ID
    date?: string;          // 日期 (YYYY-MM-DD)
  };
}
```

## 示例

### 示例 1：最近的行程（需要截图发送）

**用户**: "给我看看最近的行程"

**生成的 JSON**:
```json
{
  "version": "1.0",
  "type": "drives",
  "carId": 1,
  "pagination": { "limit": 1 }
}
```

**执行命令**:
```bash
tesla screenshot query '{"version":"1.0","type":"drives","carId":1,"pagination":{"limit":1}}' --send
```

### 示例 2：指定行程详情

**用户**: "查看行程 4275 的详情"

**生成的 JSON**:
```json
{
  "version": "1.0",
  "type": "detail.drive",
  "carId": 1,
  "recordId": 4275
}
```

**执行命令**:
```bash
tesla screenshot query '{"version":"1.0","type":"detail.drive","carId":1,"recordId":4275}' --send
```

### 示例 3：今天的日报

**用户**: "发一下今天的日报"

**生成的 JSON**:
```json
{
  "version": "1.0",
  "type": "screenshot",
  "carId": 1,
  "screenshot": {
    "type": "daily"
  }
}
```

**执行命令**:
```bash
tesla screenshot query '{"version":"1.0","type":"screenshot","carId":1,"screenshot":{"type":"daily"}}' --send
```

### 示例 4：昨天的日报

**用户**: "看看昨天的汇总"

**生成的 JSON**（假设今天是 2025-02-04）:
```json
{
  "version": "1.0",
  "type": "screenshot",
  "carId": 1,
  "screenshot": {
    "type": "daily",
    "date": "2025-02-03"
  }
}
```

**执行命令**:
```bash
tesla screenshot query '{"version":"1.0","type":"screenshot","carId":1,"screenshot":{"type":"daily","date":"2025-02-03"}}' --send
```

### 示例 5：本周驾驶统计（纯数据查询）

**用户**: "这周开了多少公里"

**生成的 JSON**:
```json
{
  "version": "1.0",
  "type": "stats.driving",
  "carId": 1,
  "timeRange": {
    "semantic": "this_week"
  }
}
```

**执行命令**:
```bash
tesla query '{"version":"1.0","type":"stats.driving","carId":1,"timeRange":{"semantic":"this_week"}}'
```

### 示例 6：最近的充电（需要截图）

**用户**: "最近一次充电"

**生成的 JSON**:
```json
{
  "version": "1.0",
  "type": "charges",
  "carId": 1,
  "pagination": { "limit": 1 }
}
```

**执行命令**:
```bash
tesla screenshot query '{"version":"1.0","type":"charges","carId":1,"pagination":{"limit":1}}' --send
```

### 示例 7：本周周报（需要截图）

**用户**: "发一下本周的周报"

**生成的 JSON**:
```json
{
  "version": "1.0",
  "type": "screenshot",
  "carId": 1,
  "screenshot": {
    "type": "weekly"
  }
}
```

**执行命令**:
```bash
tesla screenshot query '{"version":"1.0","type":"screenshot","carId":1,"screenshot":{"type":"weekly"}}' --send
```

### 示例 8：本月月报（需要截图）

**用户**: "看看这个月的汇总"

**生成的 JSON**:
```json
{
  "version": "1.0",
  "type": "screenshot",
  "carId": 1,
  "screenshot": {
    "type": "monthly"
  }
}
```

**执行命令**:
```bash
tesla screenshot query '{"version":"1.0","type":"screenshot","carId":1,"screenshot":{"type":"monthly"}}' --send
```

### 示例 9：待机耗电查询

**用户**: "最近吸血鬼损耗多少"

**生成的 JSON**:
```json
{
  "version": "1.0",
  "type": "vampire",
  "carId": 1,
  "timeRange": {
    "semantic": "last_7_days"
  }
}
```

**执行命令**:
```bash
tesla query '{"version":"1.0","type":"vampire","carId":1,"timeRange":{"semantic":"last_7_days"}}'
```

## 判断是否需要截图

以下情况需要生成截图（使用 `tesla screenshot query`）：

1. 用户明确要求"看看"、"发送"、"截图"
2. 查询类型是 `drives`、`charges`、`detail.drive`、`detail.charge`、`screenshot`
3. 用户请求"日报"、"周报"、"月报"、"汇总"

以下情况仅返回数据（使用 `tesla query`）：

1. 用户询问统计数据，如"开了多少公里"、"充了多少电"
2. 查询类型是 `battery`、`efficiency`、`mileage`、`vampire`、`locations`、`updates`、`stats.*`
3. 用户明确要求"列表"而非查看详情

## 默认行为

- `carId` 默认为 1
- 未指定时间范围时，不添加 timeRange（使用服务默认值）
- 截图命令默认添加 `--send` 参数发送到 Telegram
- 日报的日期默认为今天

## 协议参考

详细的 TeslaQuery 协议定义请参考：[query-protocol.md](./references/query-protocol.md)

## 错误处理

当命令执行失败时，请根据以下错误信息进行处理：

| 错误信息 | 处理方式 |
|---------|---------|
| "No data found" / "No drives found" / "No charges found" | 告知用户该时间段无相关记录，建议扩大时间范围或检查日期 |
| "Connection failed" / "ECONNREFUSED" | 建议用户检查 TeslaMate 服务是否正常运行 |
| "Drive/Charge {id} not found" | 告知用户指定的记录 ID 不存在，建议查询最近记录列表 |
| 截图生成失败 | 尝试使用 `tesla query` 返回纯数据结果作为备选 |
| "Invalid JSON" | 检查生成的 JSON 格式是否正确 |
| "Invalid query protocol" | 确保 version 为 "1.0" 且 type 字段有效 |

### 常见问题排查

1. **无数据返回**: 检查时间范围是否合理，TeslaMate 是否正常记录数据
2. **截图空白**: 确认 Web 服务打包成功，检查浏览器是否正常启动
3. **发送失败**: 检查 OpenClaw 配置和 Telegram 连接状态
