import { GrafanaClient } from './grafana-client.js';
import { config } from '../config/index.js';
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
} from './services/index.js';

let clientInstance: GrafanaClient | null = null;

/**
 * 获取 GrafanaClient 单例
 */
export function getGrafanaClient(): GrafanaClient {
  if (!clientInstance) {
    clientInstance = new GrafanaClient({
      baseUrl: config.grafana.url,
      token: config.grafana.token,
    });
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

export { GrafanaClient, GrafanaApiError, GrafanaQueryError } from './grafana-client.js';
export * from './services/index.js';
