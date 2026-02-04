import type { OpenClawPluginApi } from "openclaw/plugin-sdk";
import { executeQuery } from "../core/query-executor.js";
import type { TeslaQuery, QueryType } from "../types/query-protocol.js";

/**
 * 解析自然语言查询为 TeslaQuery
 * 支持简单的命令格式
 */
function parseNaturalQuery(
  input: string,
  defaultCarId: number,
): TeslaQuery | null {
  const trimmed = input.trim().toLowerCase();

  // 简单的关键词映射
  const typeMap: Record<string, QueryType> = {
    cars: "cars",
    车辆: "cars",
    car: "car",
    概览: "car",
    drives: "drives",
    行程: "drives",
    charges: "charges",
    充电: "charges",
    battery: "battery",
    电池: "battery",
    efficiency: "efficiency",
    能耗: "efficiency",
    效率: "efficiency",
    states: "states",
    状态: "states",
    updates: "updates",
    更新: "updates",
    mileage: "mileage",
    里程: "mileage",
    vampire: "vampire",
    静置: "vampire",
    耗电: "vampire",
    locations: "locations",
    位置: "locations",
    timeline: "timeline",
    时间线: "timeline",
    tpms: "tpms",
    胎压: "tpms",
  };

  // 尝试匹配类型
  for (const [keyword, type] of Object.entries(typeMap)) {
    if (trimmed.includes(keyword)) {
      return {
        version: "1.0",
        type,
        carId: defaultCarId,
      };
    }
  }

  return null;
}

/**
 * 注册 /tesla 命令
 */
export function registerTeslaCommand(api: OpenClawPluginApi) {
  api.registerCommand({
    name: "tesla",
    description: "查询 Tesla 车辆数据",
    usage: "/tesla <查询类型或自然语言>",
    examples: [
      "/tesla drives",
      "/tesla 充电记录",
      '/tesla {"version":"1.0","type":"battery"}',
    ],
    handler: async (args: string) => {
      const config = api.getPluginConfig();
      const defaultCarId = (config.defaultCarId as number) || 1;

      if (!args.trim()) {
        return {
          type: "text",
          content: `Tesla 数据查询命令

用法: /tesla <查询类型>

支持的查询类型:
  cars      - 车辆列表
  car       - 车辆概览
  drives    - 行程记录
  charges   - 充电记录
  battery   - 电池健康
  efficiency - 能耗效率
  states    - 状态历史
  updates   - 更新历史
  mileage   - 里程统计
  vampire   - 静置耗电
  locations - 位置统计
  timeline  - 时间线
  tpms      - 胎压数据

也可以直接传入 JSON 查询:
  /tesla {"version":"1.0","type":"drives","timeRange":{"semantic":"last_7_days"}}`,
        };
      }

      let query: TeslaQuery;

      // 尝试解析为 JSON
      if (args.trim().startsWith("{")) {
        try {
          query = JSON.parse(args);
          if (!query.carId) {
            query.carId = defaultCarId;
          }
        } catch {
          return {
            type: "error",
            content: "无效的 JSON 格式",
          };
        }
      } else {
        // 尝试解析自然语言
        const parsed = parseNaturalQuery(args, defaultCarId);
        if (!parsed) {
          return {
            type: "error",
            content: `无法识别的查询: ${args}\n使用 /tesla 查看帮助`,
          };
        }
        query = parsed;
      }

      // 执行查询
      try {
        const result = await executeQuery(query);
        if (result.success) {
          return {
            type: "json",
            content: result.data,
          };
        } else {
          return {
            type: "error",
            content: result.error || "查询失败",
          };
        }
      } catch (error) {
        return {
          type: "error",
          content: error instanceof Error ? error.message : String(error),
        };
      }
    },
  });
}
