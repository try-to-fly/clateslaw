# Tesla CLI

Tesla CLI 是一个基于 TeslaMate / Grafana 的 Tesla 数据查询、可视化与通知工具。

它把几类能力收敛到同一个项目里：
- **CLI 查询**：本地查看车辆、行程、充电、电池等数据
- **Screenshot 渲染**：把行程、充电等结果生成图片
- **MQTT 实时服务**：监听 TeslaMate MQTT 事件并触发通知/截图
- **OpenClaw 使用约定**：通过工作区 `TOOLS.md` 暴露 `tesla` CLI，让 OpenClaw 能自然语言调用 Tesla 能力

如果你想做的不只是“看数据”，而是把 Tesla 数据接到日常使用场景里，这个项目就是为这种需求准备的。

## 3 分钟上手

如果你只是想 **通过 npm 安装，然后马上开始用**，按下面走就行。

### 1) 全局安装

```bash
# 推荐：跳过 puppeteer 浏览器下载，安装更稳更快
PUPPETEER_SKIP_DOWNLOAD=1 npm install -g tesla-cli2

# 如果你的网络需要代理
HTTP_PROXY=http://127.0.0.1:7890 \
HTTPS_PROXY=http://127.0.0.1:7890 \
ALL_PROXY=http://127.0.0.1:7890 \
PUPPETEER_SKIP_DOWNLOAD=1 \
npm install -g tesla-cli2

# 验证安装
tesla --version
tesla --help
```

为什么默认推荐 `PUPPETEER_SKIP_DOWNLOAD=1`：
- CLI 查询、MQTT 服务、绝大多数日常功能 **不依赖** 安装阶段下载浏览器
- 某些网络 / 代理环境下，`puppeteer` 的 Chrome 下载可能失败，导致 `npm install` 卡住或报错
- 先跳过下载，能让用户更稳定地把 CLI 装起来

如果你后面需要截图功能，再看下文的“截图能力说明”。

### 2) 初始化配置

```bash
tesla config init
```

至少准备这些配置：
- `grafana.url`
- `grafana.token`
- `grafana.datasourceUid`
- `openclaw.channel`
- `openclaw.target`
- `mqtt.host`
- `mqtt.port`
- `mqtt.carId`
- `mqtt.topicPrefix`

初始化完成后可以检查：

```bash
tesla config get
tesla config doctor
```

期望输出：
- `config get` 能正常显示配置（敏感字段会打码）
- `config doctor` 输出 `OK`

### 3) 先跑两个命令确认 CLI 正常

```bash
tesla cars -o json
tesla battery 1 -o json
```

如果这两条都通，说明：
- npm 安装出来的 CLI 能正常执行
- 配置能被正确读取
- Grafana / TeslaMate 数据链路基本正常

### 4) 如果你要跑 MQTT 实时服务

```bash
npm install -g pm2
tesla service install
tesla service status
pm2 logs tesla-mqtt --lines 80 --nostream
```

期望看到：
- `tesla-mqtt` 状态为 `online`
- 日志里出现：
  - `MQTT 服务配置:`
  - `正在连接 MQTT Broker:`
  - `MQTT 连接成功`
  - 多条订阅成功 / 状态变化日志

### 5) 如果你想快速验证 MQTT 事件链路

```bash
tesla mqtt test state online
tesla mqtt test drive-cycle
tesla mqtt test charge-cycle
```

这些命令会往你配置的 MQTT broker 发送测试事件，用来验证：
- CLI 能否正常 publish MQTT
- 后台 MQTT 服务能否收到事件
- 日志 / 截图 / 通知链路是否按预期工作

## 最常用命令

装好后，大多数用户先用这几条就够了：

```bash
# 查看车辆
tesla cars -o json

# 看电池状态
tesla battery 1 -o json

# 看最近几次行程
tesla drives 1 -l 5

# 看最近几次充电
tesla charges 1 -l 5

# 看车辆当前位置
tesla where 1 --amap

# 启动 MQTT 监听
tesla mqtt listen

# 查看 MQTT 服务状态
tesla service status
```

## 截图能力说明

截图功能依赖 Web 渲染链路。

如果你主要想：
- 查数据
- 跑 MQTT 服务
- 让 OpenClaw / 自动化去消费这些数据

那么**即使安装时跳过了 puppeteer 下载，也完全可以先用起来**。

如果你后面需要“生成截图 / 卡片图片”，再看：
- [`docs/screenshots.md`](./docs/screenshots.md)
- [`docs/getting-started.md`](./docs/getting-started.md)

## 从哪里开始

按目标选入口：
- 想先跑起来：[`docs/getting-started.md`](./docs/getting-started.md)
- 想用 CLI 查数据：[`docs/cli.md`](./docs/cli.md)
- 想生成截图：[`docs/screenshots.md`](./docs/screenshots.md)
- 想跑 MQTT 实时通知：[`docs/mqtt-service.md`](./docs/mqtt-service.md)
- 想从 OpenClaw 里使用：[`docs/openclaw/README.md`](./docs/openclaw/README.md)
- 想看查询协议 / 字段语义：[`docs/API-REFERENCE.md`](./docs/API-REFERENCE.md)
- 改完代码想回归：[`docs/REGRESSION-CHECKLIST.md`](./docs/REGRESSION-CHECKLIST.md)

## 核心能力

### 1. CLI 查询

支持查看：
- 车辆基础信息
- 行程 / 充电记录
- 电池状态 / 效率 / 预估续航
- 状态时间线 / 软件更新
- 常去地点 / 里程 / 待机损耗 / 胎压
- 统一 JSON 协议查询入口

详细命令见：[`docs/cli.md`](./docs/cli.md)

### 2. Screenshot / 可视化

内置 Web 渲染页面，可以把查询结果导出成图片，例如：
- 行程轨迹图
- 充电曲线图
- 日报 / 周报 / 月报卡片

适合分享、归档，或者直接发到消息渠道。

详见：[`docs/screenshots.md`](./docs/screenshots.md)

### 3. MQTT 实时通知

订阅 TeslaMate MQTT 主题后，可以感知并处理这些事件：
- 行程结束
- 开始 / 结束充电
- 软件更新可用
- 停车后再开车时的待机损耗
- 导航相关提醒
- 停车后周边信息查询与推送

详见：[`docs/mqtt-service.md`](./docs/mqtt-service.md)

### 4. OpenClaw 使用方式

实际使用方式是：
- 通过 `tesla` CLI 提供查询、截图、发送能力
- 通过工作区 `TOOLS.md` 告诉 OpenClaw 本机有哪些 Tesla 命令、该怎么调用
- 通过 PM2 持续运行 MQTT 检测服务，负责自动化通知链路

详见：[`docs/openclaw/README.md`](./docs/openclaw/README.md)

## 本地开发

### 快速开始

```bash
pnpm install
pnpm build
pnpm exec tesla config init
pnpm exec tesla cars -o json
pnpm exec tesla drives 1 -l 5
```

### 统一协议查询

```bash
pnpm exec tesla query '{"version":"1.0","type":"drives","carId":1,"timeRange":{"semantic":"last_7_days"}}'
```

### 启动 MQTT 服务

```bash
pnpm exec tesla mqtt listen
```

### 生成截图

```bash
pnpm exec tesla screenshot drive --record-id 4275 -o /tmp/drive.png
```

## 自动发布到 npm

仓库已包含：
- `.github/workflows/ci.yml`：push / PR 时执行测试和构建
- `.github/workflows/release.yml`：push `v*` tag 时自动发布 npm

使用方式：

```bash
# 1. 确认 package.json version 已更新
git add .
git commit -m "chore: release v1.0.0"
git tag v1.0.0
git push origin main --follow-tags
```

在 GitHub 仓库 Settings → Secrets and variables → Actions 中添加：
- `NPM_TOKEN`

`NPM_TOKEN` 来自 npm 网站的 Access Token，建议使用 publish 权限最小化配置。

## 项目结构

```text
src/
  cli/        Commander CLI 命令层
  core/       Grafana 查询、业务服务、时间语义、MQTT 逻辑
  web/        截图/可视化页面（Vite + React）
  config/     configstore 配置读取
  types/      查询结果与协议类型
scripts/      调试脚本、数据采集、MQTT 测试
docs/         分主题文档
tests/        查询与命令级回归测试
```

## 架构概览

```text
TeslaMate (Postgres)
   ↓
Grafana datasource / API
   ↓
src/core/query-executor.ts
   ├─ CLI commands
   ├─ Screenshot rendering
   ├─ OpenClaw CLI-based integration
   └─ MQTT event handlers
```

一句话理解：**数据入口尽量统一收口在 `core`，CLI / 截图 / MQTT / OpenClaw（经由 CLI）只是不同出口。**

## 配置方式

项目运行时配置主要走 `configstore`，而不是把环境变量散在各处。

常见必填项：
- `grafana.url`
- `grafana.token`
- `grafana.datasourceUid`
- `openclaw.channel`
- `openclaw.target`
- MQTT 相关配置（如果启用 MQTT service）

说明：这里的 `openclaw.*` 是 **CLI / 自动通知发送配置**。

初始化与排障见：[`docs/getting-started.md`](./docs/getting-started.md)

## 开发脚本

```bash
pnpm install
pnpm dev           # CLI 开发模式
pnpm dev:web       # Web 页面开发
pnpm build         # 构建 CLI + Web
pnpm build:cli     # 仅构建 CLI
pnpm build:web     # 仅构建 Web
pnpm test          # watch
pnpm test:run      # 一次性测试
```

## 阅读建议

如果你要快速理解这个仓库，推荐按这个顺序看：
1. `src/cli/index.ts`
2. `src/core/query-executor.ts`
3. `src/core/services/*`
4. `src/web/*`
5. `src/cli/commands/mqtt.ts` + `src/core/services/mqtt-service.ts`
6. `docs/openclaw/*` + OpenClaw 工作区 `TOOLS.md`

## 说明

这个 README 只保留项目定位、能力概览和入口导航。
安装、命令、协议、回归等细节，统一拆分到 `docs/` 下维护。

如果你是第一次接这个仓库，建议先看：[`docs/getting-started.md`](./docs/getting-started.md)
