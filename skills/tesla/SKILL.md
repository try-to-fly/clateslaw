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
| "行程 123 详情" / "查看行程 123" | `detail.drive` | recordId: 123 |
| "充电 456 详情" / "查看充电 456" | `detail.charge` | recordId: 456 |

### 纯数据查询（使用 `tesla query`）

| 自然语言示例 | type | 说明 |
|-------------|------|------|
| "这周开了多少公里" | `stats.driving` | timeRange: this_week |
| "本月充电统计" | `stats.charging` | timeRange: this_month |
| "电池状态" / "电池健康" | `battery` | 返回电池健康数据 |
| "最近的行程列表" | `drives` | 返回行程列表，不截图 |
| "效率报告" | `efficiency` | 返回效率数据 |
| "里程统计" | `mileage` | 返回里程数据 |
| "车辆信息" | `car` | 返回车辆概览 |

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
    type: 'drive' | 'charge' | 'daily';
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

## 判断是否需要截图

以下情况需要生成截图（使用 `tesla screenshot query`）：

1. 用户明确要求"看看"、"发送"、"截图"
2. 查询类型是 `drives`、`charges`、`detail.drive`、`detail.charge`、`screenshot`
3. 用户请求"日报"、"汇总"

以下情况仅返回数据（使用 `tesla query`）：

1. 用户询问统计数据，如"开了多少公里"、"充了多少电"
2. 查询类型是 `battery`、`efficiency`、`mileage`、`stats.*`
3. 用户明确要求"列表"而非查看详情

## 默认行为

- `carId` 默认为 1
- 未指定时间范围时，不添加 timeRange（使用服务默认值）
- 截图命令默认添加 `--send` 参数发送到 Telegram
- 日报的日期默认为今天

## 协议参考

详细的 TeslaQuery 协议定义请参考：[query-protocol.md](./references/query-protocol.md)
