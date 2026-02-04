# Tesla Service (Clateslaw)

基于 TeslaMate 的 Tesla 数据服务 CLI 工具，为 [OpenClaw](https://github.com/anthropics/openclaw) 提供 Tesla 车辆数据查询能力。

## 核心用途

本项目主要作为 OpenClaw 的 Skill 使用，通过自然语言与 AI 交互查询 Tesla 车辆数据：

```
用户: "给我看看最近的行程"
  ↓
AI (OpenClaw Skill) 解析自然语言
  ↓
生成 TeslaQuery JSON
  ↓
执行 tesla screenshot query '<json>' --send
  ↓
截图发送到 Telegram
```

**Skill 文档**: [`skills/tesla/SKILL.md`](./skills/tesla/SKILL.md)

## 功能特性

- 🚗 车辆信息查询
- 🔋 电池健康状态分析
- ⚡ 充电记录查询
- 🛣️ 驾驶记录查询
- 📊 能效分析
- 📍 位置统计
- 🧛 待机能耗分析
- 📈 里程统计
- 🔄 软件更新历史
- 📅 活动时间线
- 🛞 胎压监测 (TPMS)
- 📸 可视化截图（日报/周报/月报/年报）

## 环境要求

- Node.js >= 18
- pnpm
- TeslaMate + Grafana 实例

## 安装

```bash
# 克隆项目
git clone <repository-url>
cd tesla-service

# 安装依赖
pnpm install

# 配置环境变量
cp .env.example .env
```

### 全局安装

将 CLI 注册为全局命令 `tesla`，可在任意目录使用：

```bash
# 构建 CLI
pnpm build:cli

# 全局链接
pnpm link --global

# 验证安装
tesla --help
```

取消全局链接：

```bash
pnpm unlink --global
```

## 配置

在 `.env` 文件中配置以下环境变量：

```env
GRAFANA_URL=http://your-grafana-host:3000
GRAFANA_TOKEN=your-grafana-api-token
```

## 使用方法

### CLI 命令

```bash
# 开发模式运行
pnpm dev <command>

# 或构建后运行
pnpm build
tesla <command>
```

### 可用命令

| 命令 | 描述 |
|------|------|
| `cars` | 列出所有车辆 |
| `car <id>` | 查看车辆概览 |
| `charges <car-id>` | 查看充电记录 |
| `drives <car-id>` | 查看驾驶记录 |
| `battery <car-id>` | 电池健康状态 |
| `efficiency <car-id>` | 能效分析 |
| `states <car-id>` | 车辆状态历史 |
| `updates <car-id>` | 软件更新历史 |
| `mileage <car-id>` | 里程统计 |
| `vampire <car-id>` | 待机能耗分析 |
| `locations <car-id>` | 位置统计 |
| `timeline <car-id>` | 活动时间线 |
| `visited <car-id>` | 访问地点 |
| `projected-range <car-id>` | 预计续航分析 |
| `tpms <car-id>` | 胎压监测 (TPMS) |
| `stats charging <car-id>` | 充电统计 |
| `stats driving <car-id>` | 驾驶统计 |
| `stats period <car-id>` | 周期统计 |
| `query <json>` | 执行 TeslaQuery 协议查询 |
| `screenshot query <json>` | 从 TeslaQuery 生成截图 |
| `screenshot drive [id]` | 行程截图 |
| `screenshot charge [id]` | 充电截图 |
| `screenshot daily [date]` | 日报截图 |
| `screenshot weekly [date]` | 周报截图 |
| `screenshot monthly [date]` | 月报截图 |
| `screenshot yearly [year]` | 年报截图 |

### 通用选项

- `-o, --output <format>` - 输出格式: `table` | `json` (默认: table)
- `-f, --from <date>` - 开始时间 (如: `now-30d`)
- `-t, --to <date>` - 结束时间 (如: `now`)
- `-l, --limit <number>` - 记录数量限制

### 示例

```bash
# 列出所有车辆
pnpm dev cars

# 查看车辆 1 的电池状态
pnpm dev battery 1

# 查看最近 30 天的充电记录 (JSON 格式)
pnpm dev charges 1 -f now-30d -o json

# 查看驾驶统计
pnpm dev stats driving 1
```

### TeslaQuery 协议

支持通过 JSON 协议执行结构化查询，主要用于 AI/Skill 集成：

```bash
# 查询最近的行程并截图发送
tesla screenshot query '{"version":"1.0","type":"drives","pagination":{"limit":1}}' --send

# 查询指定行程详情
tesla screenshot query '{"version":"1.0","type":"detail.drive","recordId":4275}' --send

# 生成今日日报
tesla screenshot query '{"version":"1.0","type":"screenshot","screenshot":{"type":"daily"}}' --send

# 纯数据查询（不截图）
tesla query '{"version":"1.0","type":"stats.driving","timeRange":{"semantic":"this_week"}}'

# 从文件读取查询
tesla screenshot query ./query.json --send
```

详细协议定义见 [`skills/tesla/references/query-protocol.md`](./skills/tesla/references/query-protocol.md)

## 数据采集

将 API 数据采集到本地 JSON 文件：

```bash
pnpm collect
```

数据将保存到 `data/` 目录，结构如下：

```
data/
├── _metadata.json          # 采集元数据
├── settings/
│   └── settings.json
└── cars/
    ├── cars.json
    └── car-1/
        ├── overview.json
        ├── battery/
        ├── charges/
        │   ├── records.json
        │   └── curves/       # 充电曲线数据
        ├── drives/
        │   ├── records.json
        │   └── positions/    # GPS 轨迹数据
        ├── efficiency/
        ├── states/
        ├── updates/
        ├── mileage/
        ├── vampire/
        ├── locations/
        ├── timeline/
        ├── projected-range/
        ├── tpms/             # 胎压监测数据
        │   ├── latest.json
        │   └── stats.json
        └── stats/
```

## 测试

项目包含数据验证测试，用于检测 API 异常数据：

```bash
# 运行所有测试
pnpm test

# 运行测试一次
pnpm test:run

# 运行单个测试文件
pnpm test tests/battery.test.ts
```

### 测试覆盖

- 元数据验证
- 设置验证
- 车辆数据验证
- 电池数据验证
- 充电记录验证
- 充电曲线验证
- 驾驶记录验证
- GPS 轨迹验证
- 能效数据验证
- 位置数据验证
- 里程数据验证
- 预计续航验证
- 状态数据验证
- 统计数据验证
- 时间线验证
- 软件更新验证
- 待机能耗验证
- 胎压监测验证 (TPMS)

## 项目结构

```
tesla-service/
├── src/
│   ├── cli/           # CLI 命令
│   ├── core/          # 核心服务和查询
│   ├── config/        # 配置
│   ├── types/         # TypeScript 类型定义
│   └── web/           # Web 可视化组件
│       ├── components/  # UI 组件
│       ├── pages/       # 页面组件
│       ├── hooks/       # React Hooks
│       └── demo/        # Demo 数据
├── scripts/
│   └── collect-data.ts  # 数据采集脚本
├── tests/
│   ├── helpers/       # 测试辅助工具
│   └── *.test.ts      # 测试文件
├── data/              # 采集的数据 (gitignore)
└── dist/              # 构建输出
```

## 开发

```bash
# 开发模式
pnpm dev

# 构建
pnpm build

# 运行测试
pnpm test
```

### Mock 数据开发

截图命令支持 `--mock` 参数，使用预设的 Mock 数据进行开发，无需连接 Grafana：

```bash
# 使用 Mock 数据截图单次驾驶
pnpm dev screenshot drive --mock

# 使用 Mock 数据截图充电记录
pnpm dev screenshot charge --mock

# 使用 Mock 数据截图每日汇总
pnpm dev screenshot daily --mock
```

Mock 数据定义在 `src/cli/commands/screenshot-mock.ts`，可自行修改测试数据。

### Demo 数据

Web 端在开发模式下可使用 Demo 数据，无需真实的 TeslaMate 后端。Demo 数据位于 `src/web/demo/` 目录：

| 文件 | 说明 |
|------|------|
| `home.ts` | 首页 Demo 数据 |
| `drive.ts` | 行程详情页 Demo 数据 |
| `charge.ts` | 充电详情页 Demo 数据 |
| `daily.ts` | 日报页面 Demo 数据（含行程、充电、轨迹、胎压） |

启动 Web 开发服务器：

```bash
pnpm dev:web
```

## License

MIT
