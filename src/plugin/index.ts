import type { OpenClawPluginApi } from 'openclaw/plugin-sdk';
import { registerTeslaTool } from './tool.js';
import { registerTeslaCommand } from './command.js';

/**
 * OpenClaw 插件入口
 * 注册 Tesla 数据查询工具和命令
 */
export default function register(api: OpenClawPluginApi) {
  // 注册 AI Tool
  registerTeslaTool(api);

  // 注册 /tesla 命令
  registerTeslaCommand(api);
}
