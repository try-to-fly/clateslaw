import type { DriveRecord, DriveQueryParams, DrivePosition } from '../../types/drive.js';
import type { GrafanaClient } from '../grafana-client.js';
import { DRIVE_QUERIES } from '../queries/drives.js';

export class DriveService {
  constructor(private readonly client: GrafanaClient) {}

  /**
   * 获取行程记录列表
   */
  async getDrives(carId: number, params: DriveQueryParams = {}): Promise<DriveRecord[]> {
    const { from = 'now-90d', to = 'now', limit = 50 } = params;

    return this.client.query<DriveRecord>(DRIVE_QUERIES.list, {
      variables: { car_id: carId, limit, from, to },
      timeRange: { from, to },
    });
  }

  /**
   * 获取行程的 GPS 轨迹数据
   */
  async getDrivePositions(carId: number, driveId: number): Promise<DrivePosition[]> {
    return this.client.query<DrivePosition>(DRIVE_QUERIES.positions, {
      variables: { car_id: carId, drive_id: driveId },
    });
  }
}
