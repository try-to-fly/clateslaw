import type { TPMSRecord, TPMSStats, TPMSQueryParams } from '../../types/tpms.js';
import { parseGrafanaTime, type GrafanaClient } from '../grafana-client.js';
import { TPMS_QUERIES } from '../queries/tpms.js';

/** 轮胎压力异常阈值（bar） */
const PRESSURE_DIFF_THRESHOLD = 0.3;

export class TPMSService {
  constructor(private readonly client: GrafanaClient) {}

  async getLatest(carId: number): Promise<TPMSRecord | null> {
    const result = await this.client.query<TPMSRecord>(TPMS_QUERIES.latest, {
      variables: { car_id: carId },
    });

    return result[0] || null;
  }

  async getHistory(carId: number, params: TPMSQueryParams = {}): Promise<TPMSRecord[]> {
    const { from = 'now-7d', to = 'now' } = params;
    const fromTs = parseGrafanaTime(from);
    const toTs = parseGrafanaTime(to);

    const result = await this.client.query<TPMSRecord>(TPMS_QUERIES.history, {
      variables: { car_id: carId, from: fromTs, to: toTs, limit: 100 },
    });

    return result;
  }

  async getStats(carId: number, params: TPMSQueryParams = {}): Promise<TPMSStats> {
    const { from = 'now-30d', to = 'now' } = params;
    const fromTs = parseGrafanaTime(from);
    const toTs = parseGrafanaTime(to);

    const [latestResult, statsResult] = await Promise.all([
      this.client.query<TPMSRecord>(TPMS_QUERIES.latest, {
        variables: { car_id: carId },
      }),
      this.client.query<{
        avg_fl: number | null;
        avg_fr: number | null;
        avg_rl: number | null;
        avg_rr: number | null;
        min_fl: number | null;
        max_fl: number | null;
      }>(TPMS_QUERIES.stats, {
        variables: { car_id: carId, from: fromTs, to: toTs },
      }),
    ]);

    const latest = latestResult[0] || null;
    const stats = statsResult[0];

    const avg = {
      fl: stats?.avg_fl ?? null,
      fr: stats?.avg_fr ?? null,
      rl: stats?.avg_rl ?? null,
      rr: stats?.avg_rr ?? null,
    };

    // 检查压力异常
    let hasAlert = false;
    let alertMessage: string | null = null;

    if (latest) {
      const pressures = [latest.fl, latest.fr, latest.rl, latest.rr].filter(
        (p): p is number => p !== null
      );

      if (pressures.length >= 2) {
        const maxPressure = Math.max(...pressures);
        const minPressure = Math.min(...pressures);
        const diff = maxPressure - minPressure;

        if (diff > PRESSURE_DIFF_THRESHOLD) {
          hasAlert = true;
          alertMessage = `轮胎压力差异过大 (${diff.toFixed(2)} bar)，建议检查`;
        }
      }
    }

    return {
      latest,
      avg,
      hasAlert,
      alertMessage,
    };
  }
}
