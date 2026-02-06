import mqtt from 'mqtt';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import type {
  VehicleState,
  ChargingState,
  StateTracker,
  RangeSnapshot,
  PersistedMqttState,
  ParkingSnapshot,
} from '../../types/mqtt.js';
import { SLEEP_STATES } from '../../types/mqtt.js';
import { getMessageService } from './message-service.js';
import { getGrafanaClient } from '../index.js';
import { ProjectedRangeService } from './projected-range-service.js';

const execAsync = promisify(exec);

const DEBOUNCE_MS = 60 * 1000; // 60 秒防抖
const TRIGGER_DELAY_MS = 30 * 1000; // 30 秒延迟等待数据入库
const ONLINE_NOTIFY_DELAY_MS = 5 * 1000; // 5 秒延迟发送上线通知
const PERSIST_DEBOUNCE_MS = 5 * 1000; // 5 秒防抖持久化
const UPDATE_NOTIFY_INTERVAL_MS = 4 * 60 * 60 * 1000; // 4 小时更新通知间隔
const PARK_NOTIFY_MIN_MS = 60 * 60 * 1000; // 停车->驾驶推送最小间隔（默认 1h）

export interface MqttServiceOptions {
  host: string;
  port: number;
  carId: number;
  topicPrefix: string;
}

export class MqttService {
  private client: mqtt.MqttClient | null = null;
  private options: MqttServiceOptions;
  private state: StateTracker = {
    vehicleState: null,
    chargingState: null,
    lastDriveTrigger: 0,
    lastChargeTrigger: 0,
    lastOfflineRange: null,
    lastOnlineTrigger: 0,
    sleepStartTime: null,
    updateAvailable: false,
    updateVersion: null,
    lastUpdateNotifyTime: 0,
    lastParkStart: null,
    lastParkNotifyTime: 0,
  };

  private lastRatedRangeKm: number | null = null;
  private lastUsableBatteryLevel: number | null = null;
  private persistTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(options: MqttServiceOptions) {
    this.options = options;
  }

  async start(): Promise<void> {
    const { host, port, carId, topicPrefix } = this.options;
    const brokerUrl = `mqtt://${host}:${port}`;

    // 加载持久化状态
    await this.loadPersistedState();

    console.log(`正在连接 MQTT Broker: ${brokerUrl}`);

    this.client = mqtt.connect(brokerUrl, {
      clientId: `tesla-service-${Date.now()}`,
      reconnectPeriod: 5000,
      keepalive: 30,           // 30秒心跳，更频繁保持连接
      connectTimeout: 30000,   // 30秒连接超时
      clean: true,             // 清除旧会话
      resubscribe: true,       // 重连后自动重订阅
    });

    this.client.on('connect', () => {
      console.log('MQTT 连接成功');
      this.subscribe();
    });

    this.client.on('error', (err) => {
      const error = err as Error & { code?: string | number };
      console.error('MQTT 错误:', error.message, error.code ? `(${error.code})` : '');
    });

    this.client.on('reconnect', () => {
      console.log('正在重新连接 MQTT...');
    });

    this.client.on('message', (topic, message) => {
      this.handleMessage(topic, message.toString());
    });

    this.client.on('close', () => {
      console.log('MQTT 连接已关闭');
    });

    this.client.on('offline', () => {
      console.log('MQTT 客户端离线（网络不可用）');
    });

    this.client.on('disconnect', (packet) => {
      console.log('收到 Broker 断开请求:', packet?.reasonCode || '未知原因');
    });
  }

  stop(): void {
    if (this.client) {
      this.client.end();
      this.client = null;
      console.log('MQTT 服务已停止');
    }
  }

  private subscribe(): void {
    if (!this.client) return;

    const { carId, topicPrefix } = this.options;
    const topics = [
      `${topicPrefix}/cars/${carId}/state`,
      `${topicPrefix}/cars/${carId}/charging_state`,
      `${topicPrefix}/cars/${carId}/update_available`,
      `${topicPrefix}/cars/${carId}/update_version`,
      // TeslaMate MQTT: rated range + usable battery percent for park-loss tracking
      `${topicPrefix}/cars/${carId}/rated_battery_range_km`,
      `${topicPrefix}/cars/${carId}/usable_battery_level`,
    ];

    topics.forEach((topic) => {
      this.client!.subscribe(topic, (err) => {
        if (err) {
          console.error(`订阅失败 ${topic}:`, err.message);
        } else {
          console.log(`已订阅: ${topic}`);
        }
      });
    });
  }

  private handleMessage(topic: string, message: string): void {
    const { carId, topicPrefix } = this.options;
    const stateTopic = `${topicPrefix}/cars/${carId}/state`;
    const chargingTopic = `${topicPrefix}/cars/${carId}/charging_state`;
    const updateAvailableTopic = `${topicPrefix}/cars/${carId}/update_available`;
    const updateVersionTopic = `${topicPrefix}/cars/${carId}/update_version`;
    const ratedRangeTopic = `${topicPrefix}/cars/${carId}/rated_battery_range_km`;
    const usableBatteryTopic = `${topicPrefix}/cars/${carId}/usable_battery_level`;

    if (process.env.MQTT_DEBUG === '1') {
      console.log(`[mqtt] ${topic} = ${message}`);
    }

    if (topic === stateTopic) {
      this.handleVehicleStateChange(message as VehicleState);
    } else if (topic === chargingTopic) {
      this.handleChargingStateChange(message as ChargingState);
    } else if (topic === updateAvailableTopic) {
      this.handleUpdateAvailable(message === 'true');
    } else if (topic === updateVersionTopic) {
      this.handleUpdateVersion(message);
    } else if (topic === ratedRangeTopic) {
      this.handleRatedRange(message);
    } else if (topic === usableBatteryTopic) {
      this.handleUsableBatteryLevel(message);
    }
  }

  private handleVehicleStateChange(newState: VehicleState): void {
    const prevState = this.state.vehicleState;
    this.state.vehicleState = newState;

    console.log(`车辆状态: ${prevState || '(初始化)'} -> ${newState}`);

    // Track park window boundaries:
    // - driving -> non-driving: mark park start snapshot once per park window
    // - non-driving -> driving: compute and notify (with min interval)
    //
    // A "park window" can include multiple intermediate states (online/charging/asleep/etc).
    // We want the *first* transition out of driving to define the window start.
    if (prevState === 'driving' && newState !== 'driving') {
      if (!this.state.lastParkStart) {
        this.markParkStart();
      } else {
        console.log('ParkStart 已存在（仍在停车窗口内），不重复记录');
      }
    }
    if (prevState && prevState !== 'driving' && newState === 'driving') {
      await this.notifyParkDeltaOnDriveStart();
      this.logParkLoss('drive_start');
    }

    const wasSleeping = prevState && SLEEP_STATES.includes(prevState);
    const isSleeping = SLEEP_STATES.includes(newState);

    // 进入休眠状态时记录时间
    if (!wasSleeping && isSleeping) {
      this.state.sleepStartTime = Date.now();
      console.log('车辆进入休眠状态');
    }

    // 进入 offline 时记录当前续航
    if (newState === 'offline' && prevState !== 'offline') {
      this.captureOfflineRange();
    }

    // 从休眠状态唤醒时发送上线通知
    if (wasSleeping && !isSleeping) {
      this.triggerOnlineNotification();
    }

    // 行程结束: driving -> 其他状态
    if (prevState === 'driving' && newState !== 'driving') {
      this.triggerDriveScreenshot();
    }

    this.schedulePersist();
  }

  private handleChargingStateChange(newState: ChargingState): void {
    const prevState = this.state.chargingState;
    this.state.chargingState = newState;

    console.log(`充电状态: ${prevState || '(初始化)'} -> ${newState}`);

    // 充电结束: Charging -> Complete 或 Disconnected
    if (prevState === 'Charging' && (newState === 'Complete' || newState === 'Disconnected')) {
      this.triggerChargeScreenshot();
    }

    this.schedulePersist();
  }

  private triggerDriveScreenshot(): void {
    const now = Date.now();
    if (now - this.state.lastDriveTrigger < DEBOUNCE_MS) {
      console.log('行程截图触发被防抖，跳过');
      return;
    }
    this.state.lastDriveTrigger = now;

    console.log(`行程结束，${TRIGGER_DELAY_MS / 1000} 秒后执行截图...`);
    setTimeout(async () => {
      try {
        console.log('正在执行行程截图...');
        const { stdout, stderr } = await execAsync('pnpm dev screenshot drive --send');
        if (stdout) console.log(stdout);
        if (stderr) console.error(stderr);
        console.log('行程截图完成');
      } catch (error) {
        console.error('行程截图失败:', error instanceof Error ? error.message : error);
      }
    }, TRIGGER_DELAY_MS);
  }

  private triggerChargeScreenshot(): void {
    const now = Date.now();
    if (now - this.state.lastChargeTrigger < DEBOUNCE_MS) {
      console.log('充电截图触发被防抖，跳过');
      return;
    }
    this.state.lastChargeTrigger = now;

    console.log(`充电结束，${TRIGGER_DELAY_MS / 1000} 秒后执行截图...`);
    setTimeout(async () => {
      try {
        console.log('正在执行充电截图...');
        const { stdout, stderr } = await execAsync('pnpm dev screenshot charge --send');
        if (stdout) console.log(stdout);
        if (stderr) console.error(stderr);
        console.log('充电截图完成');
      } catch (error) {
        console.error('充电截图失败:', error instanceof Error ? error.message : error);
      }
    }, TRIGGER_DELAY_MS);
  }

  /**
   * 记录进入 offline 时的续航数据
   */
  private async captureOfflineRange(): Promise<void> {
    try {
      const client = getGrafanaClient();
      const rangeService = new ProjectedRangeService(client);
      const stats = await rangeService.getProjectedRangeStats(this.options.carId);

      this.state.lastOfflineRange = {
        range_km: Math.round(stats.projected_range * stats.avg_usable_battery_level / 100),
        battery_level: Math.round(stats.avg_usable_battery_level),
        timestamp: Date.now(),
      };

      console.log(`已记录 offline 续航: ${this.state.lastOfflineRange.range_km} km (${this.state.lastOfflineRange.battery_level}%)`);
    } catch (error) {
      console.error('记录 offline 续航失败:', error instanceof Error ? error.message : error);
    }
  }

  /**
   * 触发上线通知（带防抖）
   */
  private triggerOnlineNotification(): void {
    const now = Date.now();
    if (now - this.state.lastOnlineTrigger < DEBOUNCE_MS) {
      console.log('上线通知触发被防抖，跳过');
      return;
    }
    this.state.lastOnlineTrigger = now;

    console.log(`车辆上线，${ONLINE_NOTIFY_DELAY_MS / 1000} 秒后发送通知...`);
    setTimeout(() => this.sendOnlineNotification(), ONLINE_NOTIFY_DELAY_MS);
  }

  /**
   * 发送上线通知
   */
  private async sendOnlineNotification(): Promise<void> {
    try {
      const client = getGrafanaClient();
      const rangeService = new ProjectedRangeService(client);
      const stats = await rangeService.getProjectedRangeStats(this.options.carId);

      const currentRange = Math.round(stats.projected_range * stats.avg_usable_battery_level / 100);
      const currentLevel = Math.round(stats.avg_usable_battery_level);

      let message = `🚗 车辆已上线\n当前续航: ${currentRange} km (${currentLevel}%)`;

      // 添加休眠时长
      if (this.state.sleepStartTime) {
        const sleepDuration = Date.now() - this.state.sleepStartTime;
        message += `\n休眠时长: ${this.formatDuration(sleepDuration)}`;
        this.state.sleepStartTime = null;
      }

      // 如果有 offline 时的记录，计算待机变化（上涨/下跌都展示；完全不变则省略）
      if (this.state.lastOfflineRange) {
        const rangeDelta = currentRange - this.state.lastOfflineRange.range_km;
        const levelDelta = currentLevel - this.state.lastOfflineRange.battery_level;

        if (rangeDelta !== 0 || levelDelta !== 0) {
          const fmt = (n: number) => (n > 0 ? `+${n}` : `${n}`);
          message += `\n待机变化: ${fmt(rangeDelta)} km (${fmt(levelDelta)}%)`;
        }
      }

      const messageService = getMessageService();
      await messageService.sendText(message);
      console.log('上线通知已发送');
    } catch (error) {
      console.error('发送上线通知失败:', error instanceof Error ? error.message : error);
    }
  }

  private handleRatedRange(message: string): void {
    const parsed = Number(message);
    if (Number.isFinite(parsed)) {
      // TeslaMate provides a float; we keep a 0.1km precision.
      this.lastRatedRangeKm = Math.round(parsed * 10) / 10;
    }
  }

  private handleUsableBatteryLevel(message: string): void {
    const parsed = Number(message);
    if (Number.isFinite(parsed)) {
      // TeslaMate provides a float; we keep a 0.1% precision.
      this.lastUsableBatteryLevel = Math.round(parsed * 10) / 10;
    }
  }

  private currentParkingSnapshot(): ParkingSnapshot {
    const rated = this.lastRatedRangeKm;
    const level = this.lastUsableBatteryLevel;

    return {
      timestamp: Date.now(),
      rated_range_km: typeof rated === 'number' ? rated : null,
      usable_battery_level: typeof level === 'number' ? level : null,
    };
  }

  private markParkStart(): void {
    this.state.lastParkStart = this.currentParkingSnapshot();

    const r = this.state.lastParkStart.rated_range_km;
    const l = this.state.lastParkStart.usable_battery_level;
    console.log(
      `ParkStart: rated=${r ?? 'n/a'}km usable=${l ?? 'n/a'}%`
    );
  }

  private fmtDelta(n: number): string {
    return n > 0 ? `+${n}` : `${n}`;
  }

  private async notifyParkDeltaOnDriveStart(): Promise<void> {
    if (!this.state.lastParkStart) return;

    const now = Date.now();
    if (now - this.state.lastParkNotifyTime < PARK_NOTIFY_MIN_MS) {
      console.log('停车->驾驶推送在最小间隔内，跳过');
      // Still reset, otherwise the next drive start might incorrectly include a short park window.
      this.state.lastParkStart = null;
      this.schedulePersist();
      return;
    }

    const start = this.state.lastParkStart;
    const end = this.currentParkingSnapshot();
    const dtMs = end.timestamp - start.timestamp;

    const rangeDelta =
      start.rated_range_km != null && end.rated_range_km != null
        ? Math.round((end.rated_range_km - start.rated_range_km) * 10) / 10
        : null;

    const levelDelta =
      start.usable_battery_level != null && end.usable_battery_level != null
        ? Math.round((end.usable_battery_level - start.usable_battery_level) * 10) / 10
        : null;

    // Only suppress when both are exactly unchanged.
    if (rangeDelta === 0 && levelDelta === 0) {
      console.log('停车->驾驶待机变化为 0，省略推送');
      this.state.lastParkStart = null;
      this.schedulePersist();
      return;
    }

    try {
      let message = `🚗 开始驾驶`;
      message += `\n待机时长: ${this.formatDuration(dtMs)}`;

      if (rangeDelta != null || levelDelta != null) {
        const r = rangeDelta != null ? this.fmtDelta(rangeDelta) : 'n/a';
        const l = levelDelta != null ? this.fmtDelta(levelDelta) : 'n/a';
        message += `\n待机变化: ${r} km (${l}%)`;
      }

      const messageService = getMessageService();
      await messageService.sendText(message);

      this.state.lastParkNotifyTime = now;
      console.log('停车->驾驶推送已发送');
    } catch (error) {
      console.error('发送停车->驾驶推送失败:', error instanceof Error ? error.message : error);
    } finally {
      // Reset after reporting, so next park window is a new segment.
      this.state.lastParkStart = null;
      this.schedulePersist();
    }
  }

  private logParkLoss(reason: 'drive_start'): void {
    if (!this.state.lastParkStart) return;

    const start = this.state.lastParkStart;
    const end = this.currentParkingSnapshot();
    const dtHours = (end.timestamp - start.timestamp) / 3600000;

    const rangeLoss =
      start.rated_range_km != null && end.rated_range_km != null
        ? Math.round((start.rated_range_km - end.rated_range_km) * 10) / 10
        : null;

    const levelLoss =
      start.usable_battery_level != null && end.usable_battery_level != null
        ? Math.round((start.usable_battery_level - end.usable_battery_level) * 10) / 10
        : null;

    const startRange = start.rated_range_km != null ? `${start.rated_range_km}km` : 'n/a';
    const endRange = end.rated_range_km != null ? `${end.rated_range_km}km` : 'n/a';
    const startLevel = start.usable_battery_level != null ? `${start.usable_battery_level}%` : 'n/a';
    const endLevel = end.usable_battery_level != null ? `${end.usable_battery_level}%` : 'n/a';

    console.log(
      `ParkLoss(${reason}): dt=${dtHours.toFixed(2)}h ` +
        `usable=${startLevel}->${endLevel}` +
        (levelLoss != null ? ` (-${levelLoss}%)` : '') +
        ` rated=${startRange}->${endRange}` +
        (rangeLoss != null ? ` (-${rangeLoss}km)` : '')
    );

    // Note: we intentionally do not reset here; reset is handled by notifyParkDeltaOnDriveStart().
  }

  /**
   * 处理更新可用状态
   */
  private handleUpdateAvailable(available: boolean): void {
    const prevAvailable = this.state.updateAvailable;
    this.state.updateAvailable = available;

    console.log(`更新可用状态: ${prevAvailable} -> ${available}`);

    if (available && this.state.updateVersion) {
      this.checkAndSendUpdateNotification();
    }

    this.schedulePersist();
  }

  /**
   * 处理更新版本
   */
  private handleUpdateVersion(version: string): void {
    const prevVersion = this.state.updateVersion;
    this.state.updateVersion = version;

    console.log(`更新版本: ${prevVersion || '(无)'} -> ${version}`);

    if (this.state.updateAvailable && version) {
      this.checkAndSendUpdateNotification();
    }

    this.schedulePersist();
  }

  /**
   * 检查并发送更新通知（4小时间隔）
   */
  private async checkAndSendUpdateNotification(): Promise<void> {
    const now = Date.now();
    if (now - this.state.lastUpdateNotifyTime < UPDATE_NOTIFY_INTERVAL_MS) {
      console.log('更新通知在 4 小时间隔内，跳过');
      return;
    }

    try {
      const message = `🔄 软件更新可用\n新版本: ${this.state.updateVersion}`;
      const messageService = getMessageService();
      await messageService.sendText(message);
      this.state.lastUpdateNotifyTime = now;
      this.schedulePersist();
      console.log('更新通知已发送');
    } catch (error) {
      console.error('发送更新通知失败:', error instanceof Error ? error.message : error);
    }
  }

  /**
   * 格式化时长
   */
  private formatDuration(ms: number): string {
    const totalMinutes = Math.floor(ms / (60 * 1000));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours > 0) {
      return `${hours}小时${minutes}分钟`;
    }
    return `${minutes}分钟`;
  }

  /**
   * 获取持久化文件路径
   */
  private getStatePath(): string {
    return path.join(process.cwd(), 'data', 'cars', `car-${this.options.carId}`, 'mqtt-state.json');
  }

  /**
   * 加载持久化状态
   */
  private async loadPersistedState(): Promise<void> {
    const statePath = this.getStatePath();
    try {
      const content = await fs.readFile(statePath, 'utf-8');
      const persisted: PersistedMqttState = JSON.parse(content);

      this.state.vehicleState = persisted.vehicleState;
      this.state.chargingState = persisted.chargingState;
      this.state.lastDriveTrigger = persisted.lastDriveTrigger;
      this.state.lastChargeTrigger = persisted.lastChargeTrigger;
      this.state.lastOfflineRange = persisted.lastOfflineRange;
      this.state.lastOnlineTrigger = persisted.lastOnlineTrigger;
      this.state.sleepStartTime = persisted.sleepStartTime;
      this.state.updateAvailable = persisted.updateAvailable;
      this.state.updateVersion = persisted.updateVersion;
      this.state.lastUpdateNotifyTime = persisted.lastUpdateNotifyTime;
      this.state.lastParkStart = persisted.lastParkStart || null;
      this.state.lastParkNotifyTime = persisted.lastParkNotifyTime || 0;

      console.log(`已加载持久化状态: ${statePath}`);
      console.log(`  车辆状态: ${this.state.vehicleState || '(无)'}`);
      console.log(`  充电状态: ${this.state.chargingState || '(无)'}`);
      if (this.state.sleepStartTime) {
        console.log(`  休眠开始: ${new Date(this.state.sleepStartTime).toLocaleString()}`);
      }
      if (this.state.updateAvailable) {
        console.log(`  待更新版本: ${this.state.updateVersion}`);
      }
      if (this.state.lastParkStart) {
        console.log(
          `  停车开始: ${new Date(this.state.lastParkStart.timestamp).toLocaleString()} rated=${this.state.lastParkStart.rated_range_km ?? 'n/a'}km usable=${this.state.lastParkStart.usable_battery_level ?? 'n/a'}%`
        );
      }
      if (this.state.lastParkNotifyTime) {
        console.log(
          `  停车推送: ${new Date(this.state.lastParkNotifyTime).toLocaleString()}`
        );
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        console.log('无持久化状态文件，使用默认状态');
      } else {
        console.error('加载持久化状态失败:', error instanceof Error ? error.message : error);
      }
    }
  }

  /**
   * 保存状态到文件
   */
  private async persistState(): Promise<void> {
    const statePath = this.getStatePath();
    const persisted: PersistedMqttState = {
      vehicleState: this.state.vehicleState,
      chargingState: this.state.chargingState,
      lastDriveTrigger: this.state.lastDriveTrigger,
      lastChargeTrigger: this.state.lastChargeTrigger,
      lastOfflineRange: this.state.lastOfflineRange,
      lastOnlineTrigger: this.state.lastOnlineTrigger,
      sleepStartTime: this.state.sleepStartTime,
      updateAvailable: this.state.updateAvailable,
      updateVersion: this.state.updateVersion,
      lastUpdateNotifyTime: this.state.lastUpdateNotifyTime,
      lastParkStart: this.state.lastParkStart,
      lastParkNotifyTime: this.state.lastParkNotifyTime,
      lastUpdated: Date.now(),
    };

    try {
      const dir = path.dirname(statePath);
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(statePath, JSON.stringify(persisted, null, 2));
      console.log('状态已持久化');
    } catch (error) {
      console.error('持久化状态失败:', error instanceof Error ? error.message : error);
    }
  }

  /**
   * 防抖持久化（5秒）
   */
  private schedulePersist(): void {
    if (this.persistTimer) {
      clearTimeout(this.persistTimer);
    }
    this.persistTimer = setTimeout(() => {
      this.persistState();
      this.persistTimer = null;
    }, PERSIST_DEBOUNCE_MS);
  }
}
