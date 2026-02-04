import { GrafanaClient } from './grafana-client.js';
import type { GrafanaClientConfig } from '../types/grafana.js';
import {
  CarService,
  ChargeService,
  DriveService,
  SettingsService,
  BatteryService,
  StatsService,
  EfficiencyService,
  StateService,
  UpdateService,
  MileageService,
  VampireService,
  LocationService,
  TimelineService,
  ProjectedRangeService,
  TPMSService,
  getMessageService,
} from './services/index.js';

let clientInstance: GrafanaClient | null = null;
let clientConfig: GrafanaClientConfig | null = null;

/**
 * 配置 GrafanaClient（用于插件模式）
 */
export function configureGrafanaClient(cfg: GrafanaClientConfig): void {
  clientConfig = cfg;
  clientInstance = null; // 重置实例以使用新配置
}

/**
 * 从环境变量加载配置
 */
function loadEnvConfig(): GrafanaClientConfig {
  const url = process.env.GRAFANA_URL;
  const token = process.env.GRAFANA_TOKEN;
  if (!url || !token) {
    throw new Error('Missing required environment variables: GRAFANA_URL and GRAFANA_TOKEN');
  }
  return { baseUrl: url, token };
}

/**
 * 获取 GrafanaClient 单例
 */
export function getGrafanaClient(): GrafanaClient {
  if (!clientInstance) {
    if (clientConfig) {
      // 使用外部配置（插件模式）
      clientInstance = new GrafanaClient(clientConfig);
    } else {
      // 使用环境变量配置（CLI 模式）
      clientInstance = new GrafanaClient(loadEnvConfig());
    }
  }
  return clientInstance;
}

// ============ 服务工厂函数 ============

/** 创建车辆服务 */
export function createCarService(): CarService {
  return new CarService(getGrafanaClient());
}

/** 创建充电服务 */
export function createChargeService(): ChargeService {
  return new ChargeService(getGrafanaClient());
}

/** 创建行程服务 */
export function createDriveService(): DriveService {
  return new DriveService(getGrafanaClient());
}

/** 创建设置服务 */
export function createSettingsService(): SettingsService {
  return new SettingsService(getGrafanaClient());
}

/** 创建电池服务 */
export function createBatteryService(): BatteryService {
  return new BatteryService(getGrafanaClient());
}

/** 创建统计服务 */
export function createStatsService(): StatsService {
  return new StatsService(getGrafanaClient());
}

/** 创建效率服务 */
export function createEfficiencyService(): EfficiencyService {
  return new EfficiencyService(getGrafanaClient());
}

/** 创建状态服务 */
export function createStateService(): StateService {
  return new StateService(getGrafanaClient());
}

/** 创建更新服务 */
export function createUpdateService(): UpdateService {
  return new UpdateService(getGrafanaClient());
}

/** 创建里程服务 */
export function createMileageService(): MileageService {
  return new MileageService(getGrafanaClient());
}

/** 创建待机能耗服务 */
export function createVampireService(): VampireService {
  return new VampireService(getGrafanaClient());
}

/** 创建位置服务 */
export function createLocationService(): LocationService {
  return new LocationService(getGrafanaClient());
}

/** 创建时间线服务 */
export function createTimelineService(): TimelineService {
  return new TimelineService(getGrafanaClient());
}

/** 创建续航预测服务 */
export function createProjectedRangeService(): ProjectedRangeService {
  return new ProjectedRangeService(getGrafanaClient());
}

/** 创建 TPMS 服务 */
export function createTPMSService(): TPMSService {
  return new TPMSService(getGrafanaClient());
}

/** 获取消息服务单例 */
export { getMessageService };

export { GrafanaClient, GrafanaApiError, GrafanaQueryError } from './grafana-client.js';
export * from './services/index.js';
