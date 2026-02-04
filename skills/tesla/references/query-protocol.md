# TeslaQuery 协议参考

本文档定义了 TeslaQuery 协议的完整规范。

## 协议版本

当前版本: `1.0`

## 基础结构

```typescript
interface TeslaQuery {
  version: '1.0';
  type: QueryType;
  carId?: number;
  recordId?: number;
  timeRange?: TimeRange;
  filters?: FilterCondition[];
  sort?: SortConfig;
  pagination?: PaginationConfig;
  output?: 'table' | 'json' | 'summary';
  period?: 'day' | 'week' | 'month' | 'year';
  screenshot?: ScreenshotConfig;
  extra?: ExtraParams;
  rawQuery?: string;
}
```

## 查询类型 (QueryType)

| 类型 | 说明 | 截图支持 |
|------|------|---------|
| `drives` | 行程列表 | ✓ (取第一条) |
| `charges` | 充电列表 | ✓ (取第一条) |
| `battery` | 电池健康 | ✗ |
| `efficiency` | 效率数据 | ✗ |
| `states` | 状态记录 | ✗ |
| `updates` | 软件更新 | ✗ |
| `mileage` | 里程统计 | ✗ |
| `vampire` | 吸血鬼损耗 | ✗ |
| `locations` | 位置统计 | ✗ |
| `timeline` | 时间线 | ✗ |
| `visited` | 访问地点 | ✗ |
| `projected-range` | 预估续航 | ✗ |
| `stats.charging` | 充电统计 | ✗ |
| `stats.driving` | 驾驶统计 | ✗ |
| `stats.period` | 周期统计 | ✗ |
| `detail.drive` | 行程详情 | ✓ |
| `detail.charge` | 充电详情 | ✓ |
| `screenshot` | 截图专用 | ✓ |
| `car` | 车辆概览 | ✗ |
| `cars` | 车辆列表 | ✗ |

## 语义时间 (SemanticTime)

```typescript
type SemanticTime =
  | 'today'
  | 'yesterday'
  | 'this_week'
  | 'last_week'
  | 'this_month'
  | 'last_month'
  | 'this_year'
  | 'last_year'
  | 'last_3_days'
  | 'last_7_days'
  | 'last_30_days'
  | 'last_90_days'
  | 'all_time';
```

## 时间范围 (TimeRange)

```typescript
interface TimeRange {
  semantic?: SemanticTime;
  relative?: { from: string; to?: string };
  absolute?: { from: string; to: string };
}
```

三种方式互斥，优先级: `absolute` > `relative` > `semantic`

### 示例

语义时间:
```json
{
  "timeRange": {
    "semantic": "this_week"
  }
}
```

相对时间:
```json
{
  "timeRange": {
    "relative": {
      "from": "-7d",
      "to": "now"
    }
  }
}
```

绝对时间:
```json
{
  "timeRange": {
    "absolute": {
      "from": "2025-01-01T00:00:00Z",
      "to": "2025-01-31T23:59:59Z"
    }
  }
}
```

## 分页配置 (PaginationConfig)

```typescript
interface PaginationConfig {
  limit?: number;   // 返回数量，默认 50
  offset?: number;  // 偏移量，默认 0
}
```

## 截图配置 (ScreenshotConfig)

```typescript
interface ScreenshotConfig {
  type: 'drive' | 'charge' | 'daily';
  id?: number;      // 指定记录 ID
  date?: string;    // 日期 (YYYY-MM-DD)，用于 daily 类型
  send?: boolean;   // 是否发送到 Telegram
}
```

## 额外参数 (ExtraParams)

```typescript
interface ExtraParams {
  minDuration?: number;   // 最小时长（分钟）
  minDistance?: number;   // 最小距离（公里）
  top?: number;           // 返回前 N 条
}
```

## 完整示例

### 查询最近 5 条行程

```json
{
  "version": "1.0",
  "type": "drives",
  "carId": 1,
  "pagination": {
    "limit": 5
  }
}
```

### 查询本周充电统计

```json
{
  "version": "1.0",
  "type": "stats.charging",
  "carId": 1,
  "timeRange": {
    "semantic": "this_week"
  }
}
```

### 查询行程详情

```json
{
  "version": "1.0",
  "type": "detail.drive",
  "carId": 1,
  "recordId": 4275
}
```

### 生成今日日报截图

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

### 生成指定日期日报截图

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

### 查询吸血鬼损耗（最小 2 小时）

```json
{
  "version": "1.0",
  "type": "vampire",
  "carId": 1,
  "timeRange": {
    "semantic": "last_7_days"
  },
  "extra": {
    "minDuration": 120
  }
}
```

### 查询访问最多的 10 个地点

```json
{
  "version": "1.0",
  "type": "visited",
  "carId": 1,
  "timeRange": {
    "semantic": "this_month"
  },
  "extra": {
    "top": 10
  }
}
```
