import puppeteer, { type Browser } from 'puppeteer';
import * as fs from 'node:fs';

/**
 * 查找 Chrome 可执行文件路径
 */
function findChromePath(): string | undefined {
  const paths = [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', // macOS
    '/opt/homebrew/bin/chromium', // macOS Homebrew
    '/usr/bin/google-chrome', // Linux
    '/usr/bin/chromium-browser', // Linux
  ];
  return paths.find(p => fs.existsSync(p));
}

/**
 * Puppeteer 浏览器池
 * 复用浏览器实例以提高截图性能
 */
class BrowserPool {
  private static instance: BrowserPool;
  private browser: Browser | null = null;
  private useCount = 0;
  private readonly maxUseCount = 50; // 每个浏览器实例最多使用 50 次后重启
  private isClosing = false;

  private constructor() {}

  static getInstance(): BrowserPool {
    if (!BrowserPool.instance) {
      BrowserPool.instance = new BrowserPool();
    }
    return BrowserPool.instance;
  }

  /**
   * 获取浏览器实例
   */
  async getBrowser(): Promise<Browser> {
    // 如果正在关闭，等待关闭完成
    while (this.isClosing) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // 如果达到最大使用次数，关闭并重新创建
    if (this.browser && this.useCount >= this.maxUseCount) {
      await this.closeBrowser();
    }

    // 创建新的浏览器实例
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: true,
        executablePath: findChromePath(),
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
      });
      this.useCount = 0;

      // 监听浏览器断开事件
      this.browser.on('disconnected', () => {
        this.browser = null;
        this.useCount = 0;
      });
    }

    this.useCount++;
    return this.browser;
  }

  /**
   * 关闭浏览器实例
   */
  async closeBrowser(): Promise<void> {
    if (this.browser && !this.isClosing) {
      this.isClosing = true;
      try {
        await this.browser.close();
      } catch {
        // 忽略关闭错误
      }
      this.browser = null;
      this.useCount = 0;
      this.isClosing = false;
    }
  }

  /**
   * 获取当前使用次数
   */
  getUseCount(): number {
    return this.useCount;
  }

  /**
   * 检查浏览器是否可用
   */
  isAvailable(): boolean {
    return this.browser !== null && !this.isClosing;
  }
}

// 导出单例
export const browserPool = BrowserPool.getInstance();

// 进程退出时清理浏览器
process.on('exit', () => {
  browserPool.closeBrowser().catch(() => {});
});

process.on('SIGINT', async () => {
  await browserPool.closeBrowser();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await browserPool.closeBrowser();
  process.exit(0);
});
