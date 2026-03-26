import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { config } from '../../config/index.js';
import { loadStoredConfig } from '../../config/store.js';

const execAsync = promisify(exec);

function proxyEnvPrefix(): string {
  // Avoid committing sensitive info by not hard-coding proxy URLs.
  // If the runtime already has proxy env vars set, forward them to the OpenClaw CLI.
  const keys = ['HTTPS_PROXY', 'HTTP_PROXY', 'ALL_PROXY', 'NO_PROXY'] as const;
  const parts = keys
    .map((k) => {
      const v = process.env[k];
      return v ? `${k}=${JSON.stringify(v)}` : null;
    })
    .filter(Boolean);

  return parts.length ? `${parts.join(' ')} ` : '';
}

export interface MessageOptions {
  channel?: string;
  target?: string;
  account?: string;
}

/**
 * 转义 shell 特殊字符
 */
function escapeShellArg(arg: string): string {
  return arg.replace(/(["\$`\\])/g, '\\$1');
}

function quoteShellArg(arg: string): string {
  // Wrap in double-quotes and escape characters that are special inside them.
  return `"${escapeShellArg(arg)}"`;
}

export class MessageService {
  private resolveDefaults(): Required<MessageOptions> {
    // Long-running PM2 workers must pick up config store route changes without restart.
    const stored = loadStoredConfig();
    const openclaw = stored.openclaw || {};
    const hasLiveAccount = Object.prototype.hasOwnProperty.call(openclaw, 'account');

    return {
      channel:
        typeof openclaw.channel === 'string' && openclaw.channel.trim()
          ? openclaw.channel.trim()
          : config.openclaw.channel,
      target:
        typeof openclaw.target === 'string' && openclaw.target.trim()
          ? openclaw.target.trim()
          : config.openclaw.target,
      // Treat a deleted/cleared optional account in config store as "no account".
      account: hasLiveAccount
        ? typeof openclaw.account === 'string' && openclaw.account.trim()
          ? openclaw.account.trim()
          : ''
        : config.openclaw.account || '',
    };
  }

  /**
   * 发送纯文本消息
   */
  async sendText(message: string, options?: MessageOptions): Promise<void> {
    const defaults = this.resolveDefaults();
    const target = options?.target || defaults.target;
    const channel = options?.channel || defaults.channel;
    const account = typeof options?.account === 'string' ? options.account : defaults.account;

    const accountPart = account ? ` --account ${quoteShellArg(account)}` : '';
    const command =
      `${proxyEnvPrefix()}openclaw message send${accountPart}` +
      ` --channel ${quoteShellArg(channel)}` +
      ` --target ${quoteShellArg(target)}` +
      ` --message ${quoteShellArg(message)}`;

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
    const defaults = this.resolveDefaults();
    const target = options?.target || defaults.target;
    const channel = options?.channel || defaults.channel;
    const account = typeof options?.account === 'string' ? options.account : defaults.account;

    const accountPart = account ? ` --account ${quoteShellArg(account)}` : '';
    const command =
      `${proxyEnvPrefix()}openclaw message send${accountPart}` +
      ` --channel ${quoteShellArg(channel)}` +
      ` --target ${quoteShellArg(target)}` +
      ` --message ${quoteShellArg(message)}` +
      ` --media ${quoteShellArg(mediaPath)}`;

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
