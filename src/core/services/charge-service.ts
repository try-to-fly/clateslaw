import type { ChargeRecord, ChargeQueryParams, ChargeCurvePoint } from '../../types/charge.js';
import type { GrafanaClient } from '../grafana-client.js';
import { CHARGE_QUERIES } from '../queries/charges.js';

export class ChargeService {
  constructor(private readonly client: GrafanaClient) {}

  /**
   * 获取充电记录列表
   */
  async getCharges(carId: number, params: ChargeQueryParams = {}): Promise<ChargeRecord[]> {
    const { from = 'now-90d', to = 'now', limit = 50 } = params;

    return this.client.query<ChargeRecord>(CHARGE_QUERIES.list, {
      variables: { car_id: carId, limit },
      timeRange: { from, to },
    });
  }

  /**
   * 获取充电过程的详细曲线数据
   */
  async getChargeCurve(chargeId: number): Promise<ChargeCurvePoint[]> {
    return this.client.query<ChargeCurvePoint>(CHARGE_QUERIES.curve, {
      variables: { charging_process_id: chargeId },
    });
  }
}
