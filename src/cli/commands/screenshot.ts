import { Command } from 'commander';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as http from 'node:http';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import puppeteer from 'puppeteer';
import handler from 'serve-handler';
import { getGrafanaClient, DriveService, ChargeService } from '../../core/index.js';
import { config } from '../../config/index.js';
import type { DriveRecord, DrivePosition } from '../../types/drive.js';
import type { ChargeRecord, ChargeCurvePoint } from '../../types/charge.js';
import { getMockDriveData, getMockChargeData, getMockDailyData } from './screenshot-mock.js';

function findChromePath(): string | undefined {
  const paths = [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', // macOS
    '/opt/homebrew/bin/chromium', // macOS Homebrew
    '/usr/bin/google-chrome', // Linux
    '/usr/bin/chromium-browser', // Linux
  ];
  return paths.find(p => fs.existsSync(p));
}

interface DriveData {
  drive: DriveRecord;
  positions: DrivePosition[];
}

interface ChargeData {
  charge: ChargeRecord;
  curve: ChargeCurvePoint[];
}

interface DailyData {
  date: string;
  drives: DriveRecord[];
  charges: ChargeRecord[];
  allPositions: DrivePosition[][];
  stats: {
    totalDistance: number;
    totalDuration: number;
    totalEnergyUsed: number;
    totalEnergyAdded: number;
  };
}

const DEFAULT_WIDTH = 402;
const DEFAULT_SCALE = 3;
const execAsync = promisify(exec);

function getNewestMtime(dir: string): number {
  let newest = 0;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      newest = Math.max(newest, getNewestMtime(fullPath));
    } else {
      const stat = fs.statSync(fullPath);
      newest = Math.max(newest, stat.mtimeMs);
    }
  }
  return newest;
}

async function ensureWebBuild(): Promise<string> {
  const cwd = process.cwd();
  const distPath = path.resolve(cwd, 'dist/web');
  const srcWebPath = path.resolve(cwd, 'src/web');

  const needsBuild = !fs.existsSync(distPath) ||
    getNewestMtime(srcWebPath) > getNewestMtime(distPath);

  if (needsBuild) {
    console.log('检测到 Web 源码更新，正在打包...');
    await execAsync('pnpm build:web', { cwd });
    console.log('打包完成');
  }

  return distPath;
}

interface ScreenshotOptions {
  output?: string;
  width?: string;
  scale?: string;
  carId?: string;
  send?: boolean;
  target?: string;
  message?: string;
  theme?: string;
  mock?: boolean;
}

async function startServer(distPath: string): Promise<http.Server> {
  const server = http.createServer((req, res) => {
    return handler(req, res, {
      public: distPath,
      cleanUrls: true,
      rewrites: [
        { source: '/drive', destination: '/index.html' },
        { source: '/charge', destination: '/index.html' },
        { source: '/daily', destination: '/index.html' },
      ],
    });
  });

  return new Promise((resolve) => {
    server.listen(0, () => {
      resolve(server);
    });
  });
}

function getServerPort(server: http.Server): number {
  const address = server.address();
  if (typeof address === 'object' && address !== null) {
    return address.port;
  }
  throw new Error('Failed to get server port');
}

async function takeScreenshot(
  url: string,
  data: DriveData | ChargeData | DailyData,
  outputPath: string,
  width: number,
  scale: number
): Promise<void> {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: findChromePath(),
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();

    // 设置初始视口，高度设置较大以减少视口调整次数
    await page.setViewport({
      width,
      height: 2000,
      deviceScaleFactor: scale,
    });

    // 注入 CSS 变量设置固定宽度
    await page.evaluateOnNewDocument((w) => {
      document.addEventListener('DOMContentLoaded', () => {
        document.documentElement.style.setProperty('--screenshot-width', `${w}px`);
      });
    }, width);

    // 注入数据
    await page.evaluateOnNewDocument((injectedData) => {
      (window as any).__TESLA_DATA__ = injectedData;
    }, data);

    await page.goto(url, { waitUntil: 'networkidle2' });

    // 等待内容渲染
    await page.waitForSelector('#root > div', { timeout: 10000 });

    // 等待地图加载完成（如果页面有地图）
    try {
      await page.waitForSelector('[data-map-ready="true"]', { timeout: 8000 });
    } catch {
      // 页面可能没有地图，忽略超时
    }

    // 等待一小段时间确保页面完全渲染
    await new Promise(resolve => setTimeout(resolve, 500));

    // 获取容器元素
    const container = await page.$('#root > div');
    if (!container) {
      throw new Error('Container element not found');
    }

    // 获取容器实际尺寸
    const boundingBox = await container.boundingBox();
    if (!boundingBox) {
      throw new Error('Failed to get container bounding box');
    }

    console.log(`容器尺寸: ${boundingBox.width}x${boundingBox.height}`);

    // 使用元素截图替代 clip，避免 deviceScaleFactor 兼容问题
    await container.screenshot({
      path: outputPath,
      type: 'png',
    });

    console.log(`截图已保存: ${outputPath}`);
  } finally {
    await browser.close();
  }
}

async function sendAndCleanup(
  outputPath: string,
  options: ScreenshotOptions,
  defaultMessage: string
): Promise<void> {
  if (!options.send) return;

  const target = options.target || config.openclaw.target;
  const message = options.message || defaultMessage;

  console.log(`正在发送截图到 Telegram...`);

  try {
    await execAsync(
      `openclaw message send --channel ${config.openclaw.channel} --target ${target} --message "${message}" --media "${outputPath}"`
    );
    console.log('发送成功');

    fs.unlinkSync(outputPath);
    console.log(`已清理: ${outputPath}`);
  } catch (error) {
    console.error('发送失败:', error instanceof Error ? error.message : error);
    console.log(`截图保留在: ${outputPath}`);
  }
}

async function getDriveData(carId: number, driveId: number): Promise<DriveData> {
  const client = getGrafanaClient();
  const driveService = new DriveService(client);

  const drives = await driveService.getDrives(carId, { limit: 100 });
  const drive = drives.find((d) => d.id === driveId);

  if (!drive) {
    throw new Error(`Drive ${driveId} not found`);
  }

  const positions = await driveService.getDrivePositions(carId, driveId);

  return { drive, positions };
}

async function getChargeData(carId: number, chargeId: number): Promise<ChargeData> {
  const client = getGrafanaClient();
  const chargeService = new ChargeService(client);

  const charges = await chargeService.getCharges(carId, { limit: 100 });
  const charge = charges.find((c) => c.id === chargeId);

  if (!charge) {
    throw new Error(`Charge ${chargeId} not found`);
  }

  const curve = await chargeService.getChargeCurve(chargeId);

  return { charge, curve };
}

async function getDailyData(carId: number, dateStr: string): Promise<DailyData> {
  const client = getGrafanaClient();
  const driveService = new DriveService(client);
  const chargeService = new ChargeService(client);

  const date = new Date(dateStr);
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const from = startOfDay.toISOString();
  const to = endOfDay.toISOString();

  const [drives, charges] = await Promise.all([
    driveService.getDrives(carId, { from, to, limit: 50 }),
    chargeService.getCharges(carId, { from, to, limit: 50 }),
  ]);

  // 并行获取所有行程的轨迹数据
  const allPositions = await Promise.all(
    drives.map((drive) => driveService.getDrivePositions(carId, drive.id))
  );

  const stats = {
    totalDistance: drives.reduce((sum, d) => sum + d.distance, 0),
    totalDuration: drives.reduce((sum, d) => sum + d.duration_min, 0),
    totalEnergyUsed: charges.reduce((sum, c) => sum + c.charge_energy_used, 0),
    totalEnergyAdded: charges.reduce((sum, c) => sum + c.charge_energy_added, 0),
  };

  return { date: dateStr, drives, charges, allPositions, stats };
}

async function screenshotDrive(
  id: string | undefined,
  options: ScreenshotOptions
): Promise<void> {
  const width = parseInt(options.width || String(DEFAULT_WIDTH), 10);
  const scale = parseInt(options.scale || String(DEFAULT_SCALE), 10);

  let data: DriveData;
  let driveId: number;

  if (options.mock) {
    console.log('使用 Mock 数据...');
    data = getMockDriveData();
    driveId = data.drive.id;
  } else {
    const carId = parseInt(options.carId || '1', 10);
    if (id) {
      driveId = parseInt(id, 10);
    } else {
      const client = getGrafanaClient();
      const driveService = new DriveService(client);
      const drives = await driveService.getDrives(carId, { limit: 1 });
      if (drives.length === 0) {
        throw new Error('No drives found');
      }
      driveId = drives[0].id;
    }
    data = await getDriveData(carId, driveId);
  }

  const outputPath = options.output || `drive-${driveId}.png`;

  const distPath = await ensureWebBuild();

  const server = await startServer(distPath);
  const port = getServerPort(server);

  try {
    const theme = options.theme || 'tesla';
    await takeScreenshot(
      `http://localhost:${port}/drive?theme=${theme}`,
      data,
      outputPath,
      width,
      scale
    );
    await sendAndCleanup(outputPath, options, `行程 #${driveId} 截图`);
  } finally {
    server.close();
  }
}

async function screenshotCharge(
  id: string | undefined,
  options: ScreenshotOptions
): Promise<void> {
  const width = parseInt(options.width || String(DEFAULT_WIDTH), 10);
  const scale = parseInt(options.scale || String(DEFAULT_SCALE), 10);

  let data: ChargeData;
  let chargeId: number;

  if (options.mock) {
    console.log('使用 Mock 数据...');
    data = getMockChargeData();
    chargeId = data.charge.id;
  } else {
    const carId = parseInt(options.carId || '1', 10);
    if (id) {
      chargeId = parseInt(id, 10);
    } else {
      const client = getGrafanaClient();
      const chargeService = new ChargeService(client);
      const charges = await chargeService.getCharges(carId, { limit: 1 });
      if (charges.length === 0) {
        throw new Error('No charges found');
      }
      chargeId = charges[0].id;
    }
    data = await getChargeData(carId, chargeId);
  }

  const outputPath = options.output || `charge-${chargeId}.png`;

  const distPath = await ensureWebBuild();

  const server = await startServer(distPath);
  const port = getServerPort(server);

  try {
    const theme = options.theme || 'tesla';
    await takeScreenshot(
      `http://localhost:${port}/charge?theme=${theme}`,
      data,
      outputPath,
      width,
      scale
    );
    await sendAndCleanup(outputPath, options, `充电 #${chargeId} 截图`);
  } finally {
    server.close();
  }
}

async function screenshotDaily(
  dateStr: string | undefined,
  options: ScreenshotOptions
): Promise<void> {
  const width = parseInt(options.width || String(DEFAULT_WIDTH), 10);
  const scale = parseInt(options.scale || String(DEFAULT_SCALE), 10);

  let data: DailyData;
  let date: string;

  if (options.mock) {
    console.log('使用 Mock 数据...');
    data = getMockDailyData();
    date = data.date;
  } else {
    const carId = parseInt(options.carId || '1', 10);
    date = dateStr || new Date().toISOString().split('T')[0];
    data = await getDailyData(carId, date);
  }

  const outputPath = options.output || `daily-${date}.png`;

  const distPath = await ensureWebBuild();

  const server = await startServer(distPath);
  const port = getServerPort(server);

  try {
    const theme = options.theme || 'tesla';
    await takeScreenshot(
      `http://localhost:${port}/daily?theme=${theme}`,
      data,
      outputPath,
      width,
      scale
    );
    await sendAndCleanup(outputPath, options, `${date} 日报截图`);
  } finally {
    server.close();
  }
}

export const screenshotCommand = new Command('screenshot')
  .description('Generate screenshot of Tesla data visualization')
  .addCommand(
    new Command('drive')
      .description('Screenshot drive details')
      .argument('[id]', 'Drive ID (defaults to latest)')
      .option('-o, --output <path>', 'Output file path')
      .option('-w, --width <number>', 'Viewport width', String(DEFAULT_WIDTH))
      .option('--scale <number>', 'Device pixel ratio', String(DEFAULT_SCALE))
      .option('-c, --car-id <number>', 'Car ID', '1')
      .option('-s, --send', '发送到 Telegram 后删除文件')
      .option('-t, --target <id>', '消息目标 ID (默认: OPENCLAW_TARGET)')
      .option('-m, --message <text>', '自定义消息')
      .option('--theme <name>', '主题风格 (tesla/cyberpunk/glass)', 'tesla')
      .option('--mock', '使用 Mock 数据（无需连接 Grafana）')
      .action(screenshotDrive)
  )
  .addCommand(
    new Command('charge')
      .description('Screenshot charge details')
      .argument('[id]', 'Charge ID (defaults to latest)')
      .option('-o, --output <path>', 'Output file path')
      .option('-w, --width <number>', 'Viewport width', String(DEFAULT_WIDTH))
      .option('--scale <number>', 'Device pixel ratio', String(DEFAULT_SCALE))
      .option('-c, --car-id <number>', 'Car ID', '1')
      .option('-s, --send', '发送到 Telegram 后删除文件')
      .option('-t, --target <id>', '消息目标 ID (默认: OPENCLAW_TARGET)')
      .option('-m, --message <text>', '自定义消息')
      .option('--theme <name>', '主题风格 (tesla/cyberpunk/glass)', 'tesla')
      .option('--mock', '使用 Mock 数据（无需连接 Grafana）')
      .action(screenshotCharge)
  )
  .addCommand(
    new Command('daily')
      .description('Screenshot daily overview')
      .argument('[date]', 'Date (YYYY-MM-DD, defaults to today)')
      .option('-o, --output <path>', 'Output file path')
      .option('-w, --width <number>', 'Viewport width', String(DEFAULT_WIDTH))
      .option('--scale <number>', 'Device pixel ratio', String(DEFAULT_SCALE))
      .option('-c, --car-id <number>', 'Car ID', '1')
      .option('-s, --send', '发送到 Telegram 后删除文件')
      .option('-t, --target <id>', '消息目标 ID (默认: OPENCLAW_TARGET)')
      .option('-m, --message <text>', '自定义消息')
      .option('--theme <name>', '主题风格 (tesla/cyberpunk/glass)', 'tesla')
      .option('--mock', '使用 Mock 数据（无需连接 Grafana）')
      .action(screenshotDaily)
  );
