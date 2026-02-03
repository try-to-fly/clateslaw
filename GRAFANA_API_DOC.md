---

## 11. Grafana HTTP API 调用方案（推荐）

相比直接连接数据库，通过 Grafana HTTP API 调用是更优的方案：

- 不需要直接暴露数据库凭据
- 利用 Grafana 的查询缓存和权限管理
- 统一的认证机制

### 11.1 认证方式

#### API Key 认证（推荐）

在 Grafana 中创建 API Key：

1. 登录 Grafana 管理界面
2. 进入 **Configuration → API Keys**
3. 点击 **Add API key**
4. 设置名称、角色（Viewer/Editor/Admin）和过期时间

```bash
# 使用 API Key 调用
curl -H "Authorization: Bearer <YOUR_API_KEY>" \
     http://localhost:3000/api/dashboards/uid/kOuP_Fggz
```

#### Basic Auth 认证

```bash
curl -u admin:password http://localhost:3000/api/dashboards/uid/kOuP_Fggz
```

### 11.2 核心 API 端点

| 端点                          | 方法 | 说明                       |
| ----------------------------- | ---- | -------------------------- |
| `/api/search`                 | GET  | 搜索 dashboards            |
| `/api/dashboards/uid/{uid}`   | GET  | 获取 dashboard 定义        |
| `/api/ds/query`               | POST | **执行数据源查询（核心）** |
| `/api/datasources`            | GET  | 获取数据源列表             |
| `/api/datasources/proxy/{id}` | \*   | 代理数据源请求             |
| `/render/d-solo/{uid}/{slug}` | GET  | 渲染 panel 图片            |

### 11.3 核心 API: `/api/ds/query`

这是获取数据的核心 API，可以直接执行 SQL 查询。

**请求格式:**

```bash
POST /api/ds/query
Content-Type: application/json
Authorization: Bearer <API_KEY>
```

```json
{
  "queries": [
    {
      "refId": "A",
      "datasource": {
        "type": "grafana-postgresql-datasource",
        "uid": "TeslaMate"
      },
      "rawSql": "SELECT battery_level, date FROM positions WHERE car_id = 1 ORDER BY date DESC LIMIT 1",
      "format": "table"
    }
  ],
  "from": "now-24h",
  "to": "now"
}
```

**响应格式:**

```json
{
  "results": {
    "A": {
      "frames": [
        {
          "schema": {
            "fields": [
              { "name": "battery_level", "type": "number" },
              { "name": "date", "type": "time" }
            ]
          },
          "data": {
            "values": [[85], [1706000000000]]
          }
        }
      ]
    }
  }
}
```

### 11.4 Node.js 实现示例

#### 项目结构

```
tesla-service/
├── src/
│   ├── config/
│   │   └── grafana.js          # Grafana 配置
│   ├── services/
│   │   └── grafanaClient.js    # Grafana HTTP 客户端
│   ├── routes/
│   │   ├── cars.js             # 车辆相关路由
│   │   ├── charges.js          # 充电相关路由
│   │   ├── drives.js           # 行程相关路由
│   │   └── battery.js          # 电池健康路由
│   ├── queries/
│   │   └── sql.js              # SQL 查询模板
│   └── index.js                # 入口文件
├── package.json
└── .env
```

#### 环境变量配置

```env
# .env
GRAFANA_URL=http://localhost:3000
GRAFANA_API_KEY=eyJrIjoiT0tTcG1pUlY2RnVKZTFVaDFsNFZXdE9ZWmNrMkZYbk...
PORT=3001
```

#### GrafanaClient 类

```javascript
// src/services/grafanaClient.js
const axios = require("axios");

class GrafanaClient {
  constructor(baseUrl, apiKey) {
    this.client = axios.create({
      baseURL: baseUrl,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });
  }

  /**
   * 执行 SQL 查询
   * @param {string} rawSql - SQL 查询语句
   * @param {object} variables - 变量替换 { car_id: 1, length_unit: 'km' }
   * @param {object} timeRange - 时间范围 { from: 'now-24h', to: 'now' }
   */
  async query(rawSql, variables = {}, timeRange = {}) {
    // 替换变量
    let sql = rawSql;
    for (const [key, value] of Object.entries(variables)) {
      sql = sql.replace(new RegExp(`\\$${key}`, "g"), value);
      sql = sql.replace(new RegExp(`\\$\\{${key}\\}`, "g"), value);
    }

    const response = await this.client.post("/api/ds/query", {
      queries: [
        {
          refId: "A",
          datasource: {
            type: "grafana-postgresql-datasource",
            uid: "TeslaMate",
          },
          rawSql: sql,
          format: "table",
        },
      ],
      from: timeRange.from || "now-24h",
      to: timeRange.to || "now",
    });

    return this.parseResponse(response.data);
  }

  /**
   * 解析 Grafana 响应为对象数组
   */
  parseResponse(data) {
    const frames = data.results?.A?.frames || [];
    if (frames.length === 0) return [];

    const frame = frames[0];
    const fields = frame.schema?.fields || [];
    const values = frame.data?.values || [];

    const rows = [];
    const rowCount = values[0]?.length || 0;

    for (let i = 0; i < rowCount; i++) {
      const row = {};
      fields.forEach((field, idx) => {
        row[field.name] = values[idx][i];
      });
      rows.push(row);
    }

    return rows;
  }

  /**
   * 获取 Dashboard 定义
   */
  async getDashboard(uid) {
    const response = await this.client.get(`/api/dashboards/uid/${uid}`);
    return response.data;
  }

  /**
   * 搜索 Dashboards
   */
  async searchDashboards(query = "", tag = "tesla") {
    const response = await this.client.get("/api/search", {
      params: { query, tag },
    });
    return response.data;
  }
}

module.exports = GrafanaClient;
```

#### Express 路由示例

```javascript
// src/routes/cars.js
const express = require("express");
const router = express.Router();
const GrafanaClient = require("../services/grafanaClient");

const client = new GrafanaClient(
  process.env.GRAFANA_URL,
  process.env.GRAFANA_API_KEY,
);

// 获取车辆列表
router.get("/", async (req, res) => {
  try {
    const cars = await client.query(`
      SELECT
        id,
        name,
        vin,
        model,
        efficiency,
        display_priority
      FROM cars
      ORDER BY display_priority ASC, name ASC
    `);
    res.json({ success: true, data: cars });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 获取车辆概览
router.get("/:id/overview", async (req, res) => {
  const carId = req.params.id;

  try {
    // 并行查询多个数据
    const [battery, range, odometer, version] = await Promise.all([
      // 电池电量
      client.query(
        `
        SELECT battery_level, date
        FROM positions
        WHERE car_id = $car_id AND ideal_battery_range_km IS NOT NULL
        ORDER BY date DESC
        LIMIT 1
      `,
        { car_id: carId },
      ),

      // 续航里程
      client.query(
        `
        SELECT ideal_battery_range_km as range
        FROM positions
        WHERE car_id = $car_id AND ideal_battery_range_km IS NOT NULL
        ORDER BY date DESC
        LIMIT 1
      `,
        { car_id: carId },
      ),

      // 里程表
      client.query(
        `
        SELECT odometer
        FROM positions
        WHERE car_id = $car_id AND ideal_battery_range_km IS NOT NULL
        ORDER BY date DESC
        LIMIT 1
      `,
        { car_id: carId },
      ),

      // 固件版本
      client.query(
        `
        SELECT split_part(version, ' ', 1) as version
        FROM updates
        WHERE car_id = $car_id
        ORDER BY start_date DESC
        LIMIT 1
      `,
        { car_id: carId },
      ),
    ]);

    res.json({
      success: true,
      data: {
        battery_level: battery[0]?.battery_level,
        range_km: range[0]?.range,
        odometer_km: odometer[0]?.odometer,
        software_version: version[0]?.version,
        last_update: battery[0]?.date,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 获取充电记录
router.get("/:id/charges", async (req, res) => {
  const carId = req.params.id;
  const { from, to, limit = 50 } = req.query;

  try {
    const charges = await client.query(
      `
      SELECT
        cp.id,
        cp.start_date,
        cp.end_date,
        cp.charge_energy_added,
        cp.charge_energy_used,
        cp.start_battery_level,
        cp.end_battery_level,
        cp.duration_min,
        cp.cost,
        COALESCE(g.name, a.city) as location
      FROM charging_processes cp
      LEFT JOIN addresses a ON cp.address_id = a.id
      LEFT JOIN geofences g ON cp.geofence_id = g.id
      WHERE cp.car_id = $car_id
        AND cp.charge_energy_added > 0
      ORDER BY cp.start_date DESC
      LIMIT ${parseInt(limit)}
    `,
      { car_id: carId },
      { from: from || "now-90d", to: to || "now" },
    );

    res.json({ success: true, data: charges });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 获取行程记录
router.get("/:id/drives", async (req, res) => {
  const carId = req.params.id;
  const { from, to, limit = 50 } = req.query;

  try {
    const drives = await client.query(
      `
      SELECT
        d.id,
        d.start_date,
        d.end_date,
        d.distance,
        d.duration_min,
        d.speed_max,
        d.power_max,
        d.outside_temp_avg,
        COALESCE(sg.name, sa.city) as start_location,
        COALESCE(eg.name, ea.city) as end_location
      FROM drives d
      LEFT JOIN addresses sa ON d.start_address_id = sa.id
      LEFT JOIN addresses ea ON d.end_address_id = ea.id
      LEFT JOIN geofences sg ON d.start_geofence_id = sg.id
      LEFT JOIN geofences eg ON d.end_geofence_id = eg.id
      WHERE d.car_id = $car_id
        AND d.distance > 0
      ORDER BY d.start_date DESC
      LIMIT ${parseInt(limit)}
    `,
      { car_id: carId },
      { from: from || "now-90d", to: to || "now" },
    );

    res.json({ success: true, data: drives });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
```

#### 入口文件

```javascript
// src/index.js
require("dotenv").config();
const express = require("express");
const carsRouter = require("./routes/cars");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());

// 路由
app.use("/api/cars", carsRouter);

// 健康检查
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log(`Tesla Service API running on port ${PORT}`);
});
```

#### package.json

```json
{
  "name": "tesla-service",
  "version": "1.0.0",
  "description": "TeslaMate Grafana API Wrapper",
  "main": "src/index.js",
  "scripts": {
    "start": "node src/index.js",
    "dev": "nodemon src/index.js"
  },
  "dependencies": {
    "axios": "^1.6.0",
    "dotenv": "^16.3.0",
    "express": "^4.18.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.0"
  }
}
```

### 11.5 API 调用示例

```bash
# 获取车辆列表
curl http://localhost:3001/api/cars

# 获取车辆概览
curl http://localhost:3001/api/cars/1/overview

# 获取充电记录（最近 30 天）
curl "http://localhost:3001/api/cars/1/charges?from=now-30d&limit=20"

# 获取行程记录
curl "http://localhost:3001/api/cars/1/drives?limit=10"
```

### 11.6 错误处理建议

```javascript
// 统一错误处理中间件
app.use((err, req, res, next) => {
  console.error("Error:", err.message);

  if (err.response) {
    // Grafana API 错误
    return res.status(err.response.status).json({
      success: false,
      error: "Grafana API error",
      details: err.response.data,
    });
  }

  res.status(500).json({
    success: false,
    error: err.message,
  });
});
```

---

## 12. 参考资源

- [Grafana HTTP API 文档](https://grafana.com/docs/grafana/latest/developers/http_api/)
- [Grafana Data Source Query API](https://grafana.com/docs/grafana/latest/developers/http_api/data_source/)
- [TeslaMate 官方文档](https://docs.teslamate.org/)
