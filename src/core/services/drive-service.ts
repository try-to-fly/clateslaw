import type { DriveRecord, DriveQueryParams } from '../../types/drive.js';
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
      variables: { car_id: carId, limit },
      timeRange: { from, to },
    });
  }
}
