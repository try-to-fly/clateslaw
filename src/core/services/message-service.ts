import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { config } from '../../config/index.js';

const execAsync = promisify(exec);

export interface MessageOptions {
  target?: string;
}

/**
 * 转义 shell 特殊字符
 */
function escapeShellArg(arg: string): string {
  return arg.replace(/(["\$`\\])/g, '\\$1');
}

export class MessageService {
  private channel: string;
  private defaultTarget: string;

  constructor() {
    this.channel = config.openclaw.channel;
    this.defaultTarget = config.openclaw.target;
  }

  /**
   * 发送纯文本消息
   */
  async sendText(message: string, options?: MessageOptions): Promise<void> {
    const target = options?.target || this.defaultTarget;
    const escapedMessage = escapeShellArg(message);

    const command = `openclaw message send --channel ${this.channel} --target ${target} --message "${escapedMessage}"`;

    try {
      await execAsync(command);
    } catch (error) {
      throw new Error(
        `发送消息失败: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * 发送带媒体的消息
   */
  async sendMedia(
    message: string,
    mediaPath: string,
    options?: MessageOptions
  ): Promise<void> {
    const target = options?.target || this.defaultTarget;
    const escapedMessage = escapeShellArg(message);

    const command = `openclaw message send --channel ${this.channel} --target ${target} --message "${escapedMessage}" --media "${mediaPath}"`;

    try {
      await execAsync(command);
    } catch (error) {
      throw new Error(
        `发送媒体消息失败: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}

let messageServiceInstance: MessageService | null = null;

/**
 * 获取 MessageService 单例
 */
export function getMessageService(): MessageService {
  if (!messageServiceInstance) {
    messageServiceInstance = new MessageService();
  }
  return messageServiceInstance;
}
