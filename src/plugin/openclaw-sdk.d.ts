/**
 * OpenClaw Plugin SDK 类型声明
 * 这是一个临时的类型声明文件，用于开发阶段
 * 实际使用时应该从 openclaw 包导入
 */

declare module 'openclaw/plugin-sdk' {
  /** 插件配置 */
  export interface PluginConfig {
    [key: string]: unknown;
  }

  /** Tool 输入 Schema */
  export interface ToolInputSchema {
    type: 'object';
    required?: string[];
    properties: Record<string, {
      type: string;
      description?: string;
      enum?: string[];
      default?: unknown;
    }>;
  }

  /** Tool 定义 */
  export interface ToolDefinition {
    name: string;
    description: string;
    inputSchema: ToolInputSchema;
    handler: (input: Record<string, unknown>) => Promise<unknown>;
  }

  /** 命令响应 */
  export interface CommandResponse {
    type: 'text' | 'json' | 'error' | 'markdown';
    content: unknown;
  }

  /** 命令定义 */
  export interface CommandDefinition {
    name: string;
    description: string;
    usage?: string;
    examples?: string[];
    handler: (args: string) => Promise<CommandResponse>;
  }

  /** OpenClaw 插件 API */
  export interface OpenClawPluginApi {
    /** 获取插件配置 */
    getPluginConfig(): PluginConfig;

    /** 注册 AI Tool */
    registerTool(tool: ToolDefinition): void;

    /** 注册斜杠命令 */
    registerCommand(command: CommandDefinition): void;
  }
}
