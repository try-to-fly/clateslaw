import mqtt from 'mqtt';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import type { VehicleState, ChargingState, StateTracker } from '../../types/mqtt.js';

const execAsync = promisify(exec);

const DEBOUNCE_MS = 60 * 1000; // 60 秒防抖
const TRIGGER_DELAY_MS = 30 * 1000; // 30 秒延迟等待数据入库

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
  };

  constructor(options: MqttServiceOptions) {
    this.options = options;
  }

  async start(): Promise<void> {
    const { host, port, carId, topicPrefix } = this.options;
    const brokerUrl = `mqtt://${host}:${port}`;

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

    this.client.on('error', (err: Error & { code?: string }) => {
      console.error('MQTT 错误:', err.message, err.code ? `(${err.code})` : '');
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

    if (topic === stateTopic) {
      this.handleVehicleStateChange(message as VehicleState);
    } else if (topic === chargingTopic) {
      this.handleChargingStateChange(message as ChargingState);
    }
  }

  private handleVehicleStateChange(newState: VehicleState): void {
    const prevState = this.state.vehicleState;
    this.state.vehicleState = newState;

    console.log(`车辆状态: ${prevState || '(初始化)'} -> ${newState}`);

    // 行程结束: driving -> 其他状态
    if (prevState === 'driving' && newState !== 'driving') {
      this.triggerDriveScreenshot();
    }
  }

  private handleChargingStateChange(newState: ChargingState): void {
    const prevState = this.state.chargingState;
    this.state.chargingState = newState;

    console.log(`充电状态: ${prevState || '(初始化)'} -> ${newState}`);

    // 充电结束: Charging -> Complete 或 Disconnected
    if (prevState === 'Charging' && (newState === 'Complete' || newState === 'Disconnected')) {
      this.triggerChargeScreenshot();
    }
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
}