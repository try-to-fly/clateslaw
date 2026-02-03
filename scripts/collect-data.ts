import 'dotenv/config';
import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  getGrafanaClient,
  CarService,
  SettingsService,
  BatteryService,
  ChargeService,
  DriveService,
  EfficiencyService,
  StateService,
  UpdateService,
  MileageService,
  VampireService,
  LocationService,
  TimelineService,
  ProjectedRangeService,
  StatsService,
} from '../src/core/index.js';
import type { Car } from '../src/types/car.js';

// 配置参数
const CONFIG = {
  outputDir: 'data',
  timeRange: {
    default: { from: 'now-3d', to: 'now' },
    updates: { from: 'now-1y', to: 'now' },
    locations: { from: 'now-1y', to: 'now' },
    period: { from: 'now-1y', to: 'now' },
  },
  limits: {
    records: 100,
    topLocations: 10,
    detailRecords: 10, // 采集详细数据的记录数
  },
};

interface CollectionResult {
  success: boolean;
  file: string;
  error?: string;
}

interface Metadata {
  collectedAt: string;
  totalApis: number;
  successCount: number;
  failureCount: number;
  errors: Array<{ file: string; error: string }>;
  cars: Array<{ id: number; name: string }>;
}

class DataCollector {
  private client = getGrafanaClient();
  private results: CollectionResult[] = [];

  // 服务实例
  private settingsService = new SettingsService(this.client);
  private carService = new CarService(this.client);
  private batteryService = new BatteryService(this.client);
  private chargeService = new ChargeService(this.client);
  private driveService = new DriveService(this.client);
  private efficiencyService = new EfficiencyService(this.client);
  private stateService = new StateService(this.client);
  private updateService = new UpdateService(this.client);
  private mileageService = new MileageService(this.client);
  private vampireService = new VampireService(this.client);
  private locationService = new LocationService(this.client);
  private timelineService = new TimelineService(this.client);
  private projectedRangeService = new ProjectedRangeService(this.client);
  private statsService = new StatsService(this.client);

  async run(): Promise<void> {
    console.log('🚀 开始数据采集...\n');
    const startTime = Date.now();

    // 确保输出目录存在
    this.ensureDir(CONFIG.outputDir);

    // 1. 采集设置
    console.log('📋 采集设置...');
    await this.collectSettings();

    // 2. 采集车辆列表
    console.log('🚗 采集车辆列表...');
    const cars = await this.collectCars();

    if (cars.length === 0) {
      console.log('⚠️  未找到车辆数据');
    } else {
      // 3. 对每辆车采集数据
      for (const car of cars) {
        console.log(`\n📊 采集车辆 ${car.id} (${car.name}) 的数据...`);
        await this.collectCarData(car);
      }
    }

    // 4. 保存元数据
    const metadata = this.generateMetadata(cars);
    await this.saveJson(`${CONFIG.outputDir}/_metadata.json`, metadata);

    // 5. 输出摘要
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    this.printSummary(metadata, duration);
  }

  private ensureDir(dir: string): void {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  private async saveJson(filePath: string, data: unknown): Promise<void> {
    const dir = path.dirname(filePath);
    this.ensureDir(dir);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  }

  private async collect<T>(
    name: string,
    filePath: string,
    fetcher: () => Promise<T>
  ): Promise<T | null> {
    try {
      const data = await fetcher();
      await this.saveJson(filePath, data);
      this.results.push({ success: true, file: filePath });
      console.log(`  ✓ ${name}`);
      return data;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.results.push({ success: false, file: filePath, error: errorMsg });
      console.log(`  ✗ ${name}: ${errorMsg}`);
      return null;
    }
  }

  private async collectSettings(): Promise<void> {
    await this.collect(
      'settings',
      `${CONFIG.outputDir}/settings/settings.json`,
      () => this.settingsService.getSettings()
    );
  }

  private async collectCars(): Promise<Car[]> {
    const cars = await this.collect(
      'cars',
      `${CONFIG.outputDir}/cars/cars.json`,
      () => this.carService.getCars()
    );
    return cars || [];
  }

  private async collectCarData(car: Car): Promise<void> {
    const carDir = `${CONFIG.outputDir}/cars/car-${car.id}`;
    const { default: defaultRange, updates, locations, period } = CONFIG.timeRange;
    const { records: limit, topLocations } = CONFIG.limits;

    // 并行采集所有数据
    await Promise.all([
      // Overview
      this.collect('overview', `${carDir}/overview.json`, () =>
        this.carService.getCarOverview(car.id)
      ),

      // Battery
      this.collect('battery/health', `${carDir}/battery/health.json`, () =>
        this.batteryService.getBatteryHealth(car.id)
      ),
      this.collect('battery/charging-stats', `${carDir}/battery/charging-stats.json`, () =>
        this.batteryService.getChargingStats(car.id)
      ),
      this.collect('battery/drive-stats', `${carDir}/battery/drive-stats.json`, () =>
        this.batteryService.getDriveStats(car.id)
      ),

      // Charges
      this.collect('charges/records', `${carDir}/charges/records.json`, () =>
        this.chargeService.getCharges(car.id, { ...defaultRange, limit })
      ),

      // Drives
      this.collect('drives/records', `${carDir}/drives/records.json`, () =>
        this.driveService.getDrives(car.id, { ...defaultRange, limit })
      ),

      // Efficiency
      this.collect('efficiency/summary', `${carDir}/efficiency/summary.json`, () =>
        this.efficiencyService.getEfficiency(car.id)
      ),
      this.collect('efficiency/by-temperature', `${carDir}/efficiency/by-temperature.json`, () =>
        this.efficiencyService.getEfficiencyByTemperature({ carId: car.id })
      ),

      // States
      this.collect('states/records', `${carDir}/states/records.json`, () =>
        this.stateService.getStates({ carId: car.id, ...defaultRange, limit })
      ),
      this.collect('states/current', `${carDir}/states/current.json`, () =>
        this.stateService.getCurrentState(car.id)
      ),
      this.collect('states/stats', `${carDir}/states/stats.json`, () =>
        this.stateService.getStateStats(car.id)
      ),

      // Updates
      this.collect('updates/records', `${carDir}/updates/records.json`, () =>
        this.updateService.getUpdates({ carId: car.id, ...updates, limit })
      ),
      this.collect('updates/stats', `${carDir}/updates/stats.json`, () =>
        this.updateService.getUpdateStats(car.id)
      ),

      // Mileage
      this.collect('mileage/stats', `${carDir}/mileage/stats.json`, () =>
        this.mileageService.getMileageStats(car.id)
      ),
      this.collect('mileage/daily', `${carDir}/mileage/daily.json`, () =>
        this.mileageService.getDailyMileage({ carId: car.id, ...defaultRange })
      ),

      // Vampire
      this.collect('vampire/records', `${carDir}/vampire/records.json`, () =>
        this.vampireService.getVampireRecords({ carId: car.id, ...defaultRange })
      ),
      this.collect('vampire/stats', `${carDir}/vampire/stats.json`, () =>
        this.vampireService.getVampireStats({ carId: car.id, ...defaultRange })
      ),

      // Locations
      this.collect('locations/stats', `${carDir}/locations/stats.json`, () =>
        this.locationService.getLocationStats(car.id)
      ),
      this.collect('locations/top-locations', `${carDir}/locations/top-locations.json`, () =>
        this.locationService.getTopLocations({ carId: car.id, ...locations, top: topLocations })
      ),

      // Timeline
      this.collect('timeline/events', `${carDir}/timeline/events.json`, () =>
        this.timelineService.getTimeline({ carId: car.id, ...defaultRange, limit })
      ),

      // Projected Range
      this.collect('projected-range/stats', `${carDir}/projected-range/stats.json`, () =>
        this.projectedRangeService.getProjectedRangeStats(car.id)
      ),
      this.collect('projected-range/history', `${carDir}/projected-range/history.json`, () =>
        this.projectedRangeService.getProjectedRangeHistory({ carId: car.id, ...defaultRange })
      ),

      // Stats
      this.collect('stats/charging', `${carDir}/stats/charging.json`, () =>
        this.statsService.getChargingStats({ carId: car.id, ...defaultRange })
      ),
      this.collect('stats/driving', `${carDir}/stats/driving.json`, () =>
        this.statsService.getDrivingStats({ carId: car.id, ...defaultRange })
      ),
      this.collect('stats/period', `${carDir}/stats/period.json`, () =>
        this.statsService.getPeriodStats({ carId: car.id, ...period })
      ),
    ]);

    // 采集详细数据（GPS 轨迹和充电曲线）
    await this.collectDetailedData(car, carDir);
  }

  private async collectDetailedData(car: Car, carDir: string): Promise<void> {
    const { detailRecords } = CONFIG.limits;

    // 获取最近的行程记录
    const drivesFile = `${carDir}/drives/records.json`;
    if (fs.existsSync(drivesFile)) {
      const drives = JSON.parse(fs.readFileSync(drivesFile, 'utf-8')) as Array<{ id: number }>;
      const drivesToCollect = drives.slice(0, detailRecords);

      console.log(`  📍 采集 ${drivesToCollect.length} 条行程的 GPS 轨迹...`);
      for (const drive of drivesToCollect) {
        await this.collect(
          `drives/positions/${drive.id}`,
          `${carDir}/drives/positions/${drive.id}.json`,
          () => this.driveService.getDrivePositions(car.id, drive.id)
        );
      }
    }

    // 获取最近的充电记录
    const chargesFile = `${carDir}/charges/records.json`;
    if (fs.existsSync(chargesFile)) {
      const charges = JSON.parse(fs.readFileSync(chargesFile, 'utf-8')) as Array<{ id: number }>;
      const chargesToCollect = charges.slice(0, detailRecords);

      console.log(`  🔋 采集 ${chargesToCollect.length} 条充电的曲线数据...`);
      for (const charge of chargesToCollect) {
        await this.collect(
          `charges/curves/${charge.id}`,
          `${carDir}/charges/curves/${charge.id}.json`,
          () => this.chargeService.getChargeCurve(charge.id)
        );
      }
    }
  }

  private generateMetadata(cars: Car[]): Metadata {
    const successCount = this.results.filter((r) => r.success).length;
    const failures = this.results.filter((r) => !r.success);

    return {
      collectedAt: new Date().toISOString(),
      totalApis: this.results.length,
      successCount,
      failureCount: failures.length,
      errors: failures.map((f) => ({ file: f.file, error: f.error || 'Unknown error' })),
      cars: cars.map((c) => ({ id: c.id, name: c.name })),
    };
  }

  private printSummary(metadata: Metadata, duration: string): void {
    console.log('\n' + '='.repeat(50));
    console.log('📊 采集完成');
    console.log('='.repeat(50));
    console.log(`⏱️  耗时: ${duration}s`);
    console.log(`📁 输出目录: ${CONFIG.outputDir}/`);
    console.log(`🚗 车辆数量: ${metadata.cars.length}`);
    console.log(`✅ 成功: ${metadata.successCount}/${metadata.totalApis}`);
    console.log(`❌ 失败: ${metadata.failureCount}/${metadata.totalApis}`);

    if (metadata.errors.length > 0) {
      console.log('\n⚠️  错误列表:');
      for (const err of metadata.errors) {
        console.log(`   - ${err.file}: ${err.error}`);
      }
    }
  }
}

// 执行采集
const collector = new DataCollector();
collector.run().catch((error) => {
  console.error('❌ 采集失败:', error);
  process.exit(1);
});
