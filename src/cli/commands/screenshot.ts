import { Command } from 'commander';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as http from 'node:http';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import puppeteer from 'puppeteer';
import handler from 'serve-handler';
import { getGrafanaClient, DriveService, ChargeService, StatsService } from '../../core/index.js';
import { config } from '../../config/index.js';
import type { DriveRecord, DrivePosition } from '../../types/drive.js';
import type { ChargeRecord, ChargeCurvePoint } from '../../types/charge.js';
import { getMockDriveData, getMockChargeData, getMockDailyData } from './screenshot-mock.js';
import { executeQuery } from '../../core/query-executor.js';
import type { TeslaQuery } from '../../types/query-protocol.js';

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

interface WeeklyData {
  period: string;
  periodLabel: string;
  drives: DriveRecord[];
  charges: ChargeRecord[];
  allPositions: DrivePosition[][];
  stats: {
    totalDistance: number;
    totalDuration: number;
    totalDrives: number;
    totalCharges: number;
    totalEnergyUsed: number;
    totalEnergyAdded: number;
    totalCost: number;
    avgEfficiency: number;
  };
  comparison?: {
    distanceChange: number;
    distanceChangePercent: number;
    energyChange: number;
    energyChangePercent: number;
  };
}

interface MonthlyData {
  period: string;
  periodLabel: string;
  drives: DriveRecord[];
  charges: ChargeRecord[];
  allPositions: DrivePosition[][];
  stats: {
    totalDistance: number;
    totalDuration: number;
    totalDrives: number;
    totalCharges: number;
    totalEnergyUsed: number;
    totalEnergyAdded: number;
    totalCost: number;
    avgEfficiency: number;
  };
  comparison?: {
    distanceChange: number;
    distanceChangePercent: number;
    energyChange: number;
    energyChangePercent: number;
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
        { source: '/weekly', destination: '/index.html' },
        { source: '/monthly', destination: '/index.html' },
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
  data: DriveData | ChargeData | DailyData | WeeklyData | MonthlyData,
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

    console.log('正在加载页面...');
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    console.log('页面 DOM 加载完成');

    // 等待内容渲染
    console.log('等待内容渲染...');
    await page.waitForSelector('#root > div', { timeout: 10000 });

    // 等待地图加载完成（如果页面有地图）
    console.log('等待地图加载...');
    try {
      await page.waitForSelector('[data-map-ready="true"]', { timeout: 8000 });
      console.log('地图加载完成');
    } catch {
      console.log('页面无地图或地图加载超时，继续执行');
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
  startOfDay.setUTCHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setUTCHours(23, 59, 59, 999);

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

/**
 * 获取指定日期所在周的起止日期（周一到周日）
 */
function getWeekRange(dateStr?: string): { from: string; to: string; label: string } {
  const date = dateStr ? new Date(dateStr) : new Date();
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;

  const monday = new Date(date);
  monday.setDate(date.getDate() + diff);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  const weekNum = getWeekNumber(monday);
  const label = `${monday.getFullYear()}年第${weekNum}周`;

  return {
    from: monday.toISOString(),
    to: sunday.toISOString(),
    label,
  };
}

/**
 * 获取指定日期所在月的起止日期
 */
function getMonthRange(dateStr?: string): { from: string; to: string; label: string } {
  const date = dateStr ? new Date(dateStr) : new Date();

  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
  firstDay.setHours(0, 0, 0, 0);

  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  lastDay.setHours(23, 59, 59, 999);

  const label = `${date.getFullYear()}年${date.getMonth() + 1}月`;

  return {
    from: firstDay.toISOString(),
    to: lastDay.toISOString(),
    label,
  };
}

/**
 * 获取ISO周数
 */
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

async function getWeeklyData(carId: number, dateStr?: string): Promise<WeeklyData> {
  const client = getGrafanaClient();
  const driveService = new DriveService(client);
  const chargeService = new ChargeService(client);
  const statsService = new StatsService(client);

  const currentRange = getWeekRange(dateStr);
  const { from, to, label } = currentRange;

  const [drives, charges, aggregatedStats] = await Promise.all([
    driveService.getDrives(carId, { from, to, limit: 100 }),
    chargeService.getCharges(carId, { from, to, limit: 100 }),
    statsService.getWeeklyStats({ carId, date: dateStr, includePrevious: true }),
  ]);

  const allPositions = await Promise.all(
    drives.map((drive) => driveService.getDrivePositions(carId, drive.id))
  );

  return {
    period: from.split('T')[0],
    periodLabel: label,
    drives,
    charges,
    allPositions,
    stats: {
      totalDistance: aggregatedStats.totalDistance,
      totalDuration: aggregatedStats.totalDuration,
      totalDrives: aggregatedStats.totalDrives,
      totalCharges: aggregatedStats.totalCharges,
      totalEnergyUsed: aggregatedStats.totalEnergyUsed,
      totalEnergyAdded: aggregatedStats.totalEnergyAdded,
      totalCost: aggregatedStats.totalCost,
      avgEfficiency: aggregatedStats.avgEfficiency,
    },
    comparison: aggregatedStats.comparison,
  };
}

async function getMonthlyData(carId: number, dateStr?: string): Promise<MonthlyData> {
  const client = getGrafanaClient();
  const driveService = new DriveService(client);
  const chargeService = new ChargeService(client);
  const statsService = new StatsService(client);

  const currentRange = getMonthRange(dateStr);
  const { from, to, label } = currentRange;

  const [drives, charges, aggregatedStats] = await Promise.all([
    driveService.getDrives(carId, { from, to, limit: 200 }),
    chargeService.getCharges(carId, { from, to, limit: 200 }),
    statsService.getMonthlyStats({ carId, date: dateStr, includePrevious: true }),
  ]);

  const allPositions = await Promise.all(
    drives.map((drive) => driveService.getDrivePositions(carId, drive.id))
  );

  return {
    period: from.split('T')[0],
    periodLabel: label,
    drives,
    charges,
    allPositions,
    stats: {
      totalDistance: aggregatedStats.totalDistance,
      totalDuration: aggregatedStats.totalDuration,
      totalDrives: aggregatedStats.totalDrives,
      totalCharges: aggregatedStats.totalCharges,
      totalEnergyUsed: aggregatedStats.totalEnergyUsed,
      totalEnergyAdded: aggregatedStats.totalEnergyAdded,
      totalCost: aggregatedStats.totalCost,
      avgEfficiency: aggregatedStats.avgEfficiency,
    },
    comparison: aggregatedStats.comparison,
  };
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

async function screenshotWeekly(
  dateStr: string | undefined,
  options: ScreenshotOptions
): Promise<void> {
  const width = parseInt(options.width || String(DEFAULT_WIDTH), 10);
  const scale = parseInt(options.scale || String(DEFAULT_SCALE), 10);
  const carId = parseInt(options.carId || '1', 10);

  console.log('正在获取周报数据...');
  const data = await getWeeklyData(carId, dateStr);

  const outputPath = options.output || `weekly-${data.period}.png`;

  const distPath = await ensureWebBuild();

  const server = await startServer(distPath);
  const port = getServerPort(server);

  try {
    const theme = options.theme || 'tesla';
    await takeScreenshot(
      `http://localhost:${port}/weekly?theme=${theme}`,
      data,
      outputPath,
      width,
      scale
    );
    await sendAndCleanup(outputPath, options, `${data.periodLabel} 周报截图`);
  } finally {
    server.close();
  }
}

async function screenshotMonthly(
  dateStr: string | undefined,
  options: ScreenshotOptions
): Promise<void> {
  const width = parseInt(options.width || String(DEFAULT_WIDTH), 10);
  const scale = parseInt(options.scale || String(DEFAULT_SCALE), 10);
  const carId = parseInt(options.carId || '1', 10);

  console.log('正在获取月报数据...');
  const data = await getMonthlyData(carId, dateStr);

  const outputPath = options.output || `monthly-${data.period}.png`;

  const distPath = await ensureWebBuild();

  const server = await startServer(distPath);
  const port = getServerPort(server);

  try {
    const theme = options.theme || 'tesla';
    await takeScreenshot(
      `http://localhost:${port}/monthly?theme=${theme}`,
      data,
      outputPath,
      width,
      scale
    );
    await sendAndCleanup(outputPath, options, `${data.periodLabel} 月报截图`);
  } finally {
    server.close();
  }
}

/**
 * 解析查询输入（支持 JSON 字符串或文件路径）
 */
function parseQueryInput(input: string): TeslaQuery {
  const trimmed = input.trim();

  if (fs.existsSync(trimmed)) {
    const content = fs.readFileSync(trimmed, 'utf-8');
    return JSON.parse(content);
  }

  return JSON.parse(trimmed);
}

/**
 * 验证查询协议
 */
function validateQuery(query: unknown): query is TeslaQuery {
  if (!query || typeof query !== 'object') return false;
  const q = query as Record<string, unknown>;
  if (q.version !== '1.0') return false;
  if (typeof q.type !== 'string') return false;
  return true;
}

type PageType = 'drive' | 'charge' | 'daily' | 'weekly' | 'monthly';

/**
 * 根据查询类型确定页面类型
 */
function determinePageType(query: TeslaQuery): PageType {
  // 如果有 screenshot 配置，使用其 type
  if (query.screenshot?.type) {
    return query.screenshot.type;
  }

  // 根据 query.type 推断
  switch (query.type) {
    case 'detail.drive':
    case 'drives':
      return 'drive';
    case 'detail.charge':
    case 'charges':
      return 'charge';
    case 'screenshot':
      return query.screenshot?.type || 'daily';
    default:
      return 'daily';
  }
}

/**
 * 为截图获取数据
 */
async function fetchDataForScreenshot(
  query: TeslaQuery,
  pageType: PageType,
  carId: number
): Promise<DriveData | ChargeData | DailyData | WeeklyData | MonthlyData> {
  switch (pageType) {
    case 'drive': {
      // 如果有明确的 recordId
      if (query.recordId) {
        return getDriveData(carId, query.recordId);
      }
      // 如果有 screenshot.id
      if (query.screenshot?.id) {
        return getDriveData(carId, query.screenshot.id);
      }
      // 否则查询最近的行程
      const result = await executeQuery({
        ...query,
        type: 'drives',
        pagination: { limit: 1 },
      });
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to fetch drives');
      }
      const drives = result.data as DriveRecord[];
      if (drives.length === 0) {
        throw new Error('No drives found');
      }
      return getDriveData(carId, drives[0].id);
    }

    case 'charge': {
      // 如果有明确的 recordId
      if (query.recordId) {
        return getChargeData(carId, query.recordId);
      }
      // 如果有 screenshot.id
      if (query.screenshot?.id) {
        return getChargeData(carId, query.screenshot.id);
      }
      // 否则查询最近的充电
      const result = await executeQuery({
        ...query,
        type: 'charges',
        pagination: { limit: 1 },
      });
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to fetch charges');
      }
      const charges = result.data as ChargeRecord[];
      if (charges.length === 0) {
        throw new Error('No charges found');
      }
      return getChargeData(carId, charges[0].id);
    }

    case 'daily': {
      const date = query.screenshot?.date || new Date().toISOString().split('T')[0];
      return getDailyData(carId, date);
    }

    case 'weekly': {
      const date = query.screenshot?.date;
      return getWeeklyData(carId, date);
    }

    case 'monthly': {
      const date = query.screenshot?.date;
      return getMonthlyData(carId, date);
    }
  }
}

/**
 * 生成输出文件路径
 */
function generateOutputPath(
  query: TeslaQuery,
  pageType: PageType,
  data: DriveData | ChargeData | DailyData | WeeklyData | MonthlyData
): string {
  const timestamp = Date.now();
  switch (pageType) {
    case 'drive':
      return `drive-${(data as DriveData).drive.id}-${timestamp}.png`;
    case 'charge':
      return `charge-${(data as ChargeData).charge.id}-${timestamp}.png`;
    case 'daily':
      return `daily-${(data as DailyData).date}-${timestamp}.png`;
    case 'weekly':
      return `weekly-${(data as WeeklyData).period}-${timestamp}.png`;
    case 'monthly':
      return `monthly-${(data as MonthlyData).period}-${timestamp}.png`;
  }
}

/**
 * 生成消息
 */
function generateMessage(
  query: TeslaQuery,
  pageType: PageType,
  data: DriveData | ChargeData | DailyData | WeeklyData | MonthlyData
): string {
  switch (pageType) {
    case 'drive':
      return `行程 #${(data as DriveData).drive.id} 截图`;
    case 'charge':
      return `充电 #${(data as ChargeData).charge.id} 截图`;
    case 'daily':
      return `${(data as DailyData).date} 日报截图`;
    case 'weekly':
      return `${(data as WeeklyData).periodLabel} 周报截图`;
    case 'monthly':
      return `${(data as MonthlyData).periodLabel} 月报截图`;
  }
}

/**
 * 从 TeslaQuery JSON 生成截图
 */
async function screenshotQuery(
  jsonInput: string,
  options: ScreenshotOptions
): Promise<void> {
  // 1. 解析查询
  let query: TeslaQuery;
  try {
    query = parseQueryInput(jsonInput);
  } catch (error) {
    console.error('Error: 无效的 JSON 输入');
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }

  // 2. 验证查询
  if (!validateQuery(query)) {
    console.error('Error: 无效的查询协议');
    console.error('查询必须包含 version: "1.0" 和有效的 type');
    process.exit(1);
  }

  const width = parseInt(options.width || String(DEFAULT_WIDTH), 10);
  const scale = parseInt(options.scale || String(DEFAULT_SCALE), 10);
  const carId = parseInt(options.carId || String(query.carId || 1), 10);

  // 3. 确定页面类型
  const pageType = determinePageType(query);
  console.log(`页面类型: ${pageType}`);

  // 4. 获取数据
  console.log('正在获取数据...');
  const data = await fetchDataForScreenshot(query, pageType, carId);

  // 5. 生成输出路径
  const outputPath = options.output || generateOutputPath(query, pageType, data);

  // 6. 构建并启动服务器
  const distPath = await ensureWebBuild();
  const server = await startServer(distPath);
  const port = getServerPort(server);

  try {
    // 7. 生成截图
    const theme = options.theme || 'tesla';
    await takeScreenshot(
      `http://localhost:${port}/${pageType}?theme=${theme}`,
      data,
      outputPath,
      width,
      scale
    );

    // 8. 发送到 Telegram（如果需要）
    const message = options.message || generateMessage(query, pageType, data);
    await sendAndCleanup(outputPath, options, message);
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
  )
  .addCommand(
    new Command('weekly')
      .description('Screenshot weekly overview')
      .argument('[date]', 'Date within the week (YYYY-MM-DD, defaults to current week)')
      .option('-o, --output <path>', 'Output file path')
      .option('-w, --width <number>', 'Viewport width', String(DEFAULT_WIDTH))
      .option('--scale <number>', 'Device pixel ratio', String(DEFAULT_SCALE))
      .option('-c, --car-id <number>', 'Car ID', '1')
      .option('-s, --send', '发送到 Telegram 后删除文件')
      .option('-t, --target <id>', '消息目标 ID (默认: OPENCLAW_TARGET)')
      .option('-m, --message <text>', '自定义消息')
      .option('--theme <name>', '主题风格 (tesla/cyberpunk/glass)', 'tesla')
      .action(screenshotWeekly)
  )
  .addCommand(
    new Command('monthly')
      .description('Screenshot monthly overview')
      .argument('[date]', 'Date within the month (YYYY-MM-DD, defaults to current month)')
      .option('-o, --output <path>', 'Output file path')
      .option('-w, --width <number>', 'Viewport width', String(DEFAULT_WIDTH))
      .option('--scale <number>', 'Device pixel ratio', String(DEFAULT_SCALE))
      .option('-c, --car-id <number>', 'Car ID', '1')
      .option('-s, --send', '发送到 Telegram 后删除文件')
      .option('-t, --target <id>', '消息目标 ID (默认: OPENCLAW_TARGET)')
      .option('-m, --message <text>', '自定义消息')
      .option('--theme <name>', '主题风格 (tesla/cyberpunk/glass)', 'tesla')
      .action(screenshotMonthly)
  )
  .addCommand(
    new Command('query')
      .description('Screenshot from TeslaQuery JSON')
      .argument('<json>', 'TeslaQuery JSON string or file path')
      .option('-o, --output <path>', 'Output file path')
      .option('-w, --width <number>', 'Viewport width', String(DEFAULT_WIDTH))
      .option('--scale <number>', 'Device pixel ratio', String(DEFAULT_SCALE))
      .option('-c, --car-id <number>', 'Car ID')
      .option('-s, --send', '发送到 Telegram 后删除文件')
      .option('-t, --target <id>', '消息目标 ID (默认: OPENCLAW_TARGET)')
      .option('-m, --message <text>', '自定义消息')
      .option('--theme <name>', '主题风格 (tesla/cyberpunk/glass)', 'tesla')
      .action(screenshotQuery)
  );
