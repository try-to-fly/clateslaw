import type { OpenClawPluginApi } from "openclaw/plugin-sdk";
import { configureGrafanaClient } from "../core/index.js";
import { executeQuery } from "../core/query-executor.js";
import type { TeslaQuery } from "../types/query-protocol.js";

/**
 * 验证查询协议
 */
function validateQuery(query: unknown): query is TeslaQuery {
  if (!query || typeof query !== "object") return false;
  const q = query as Record<string, unknown>;
  if (q.version !== "1.0") return false;
  if (typeof q.type !== "string") return false;
  return true;
}

/**
 * 注册 tesla_query AI Tool
 */
export function registerTeslaTool(api: OpenClawPluginApi) {
  // 配置 GrafanaClient
  const pluginConfig = api.getPluginConfig();
  configureGrafanaClient({
    baseUrl: pluginConfig.grafanaUrl as string,
    token: pluginConfig.grafanaToken as string,
  });

  api.registerTool({
    name: "tesla_query",
    description: `查询 Tesla 车辆数据。支持的查询类型:
- cars: 获取所有车辆列表
- car: 获取单个车辆概览
- drives: 获取行程记录
- charges: 获取充电记录
- battery: 获取电池健康状态
- efficiency: 获取能耗效率
- states: 获取车辆状态历史
- updates: 获取软件更新历史
- mileage: 获取里程统计
- vampire: 获取静置耗电记录
- locations: 获取位置统计
- locations.charging: 获取充电站统计
- timeline: 获取时间线
- visited: 获取访问过的地点
- projected-range: 获取预估续航历史
- stats.charging: 获取充电统计
- stats.driving: 获取驾驶统计
- stats.period: 获取周期统计
- tpms: 获取胎压数据
- detail.drive: 获取行程详情 (需要 recordId)
- detail.charge: 获取充电详情 (需要 recordId)`,
    inputSchema: {
      type: "object",
      required: ["query"],
      properties: {
        query: {
          type: "string",
          description:
            'TeslaQuery JSON 字符串，格式: {"version":"1.0","type":"<查询类型>",...}',
        },
      },
    },
    handler: async (input: Record<string, unknown>) => {
      try {
        const queryStr = input.query as string;
        if (!queryStr) {
          return {
            success: false,
            error: "Missing required parameter: query",
          };
        }

        // 解析查询
        let query: TeslaQuery;
        try {
          query = JSON.parse(queryStr);
        } catch {
          return {
            success: false,
            error: "Invalid JSON format",
          };
        }

        // 验证查询
        if (!validateQuery(query)) {
          return {
            success: false,
            error:
              'Invalid query protocol. Must have version: "1.0" and a valid type.',
          };
        }

        // 设置默认 carId
        const config = api.getPluginConfig();
        if (!query.carId && config.defaultCarId) {
          query.carId = config.defaultCarId as number;
        }

        // 执行查询
        const result = await executeQuery(query);
        return result;
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    },
  });
}
