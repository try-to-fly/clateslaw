import type { TimelineEvent, TimelineQueryParams } from '../../types/timeline.js';
import type { GrafanaClient } from '../grafana-client.js';
import { TIMELINE_QUERIES } from '../queries/timeline.js';

export class TimelineService {
  constructor(private readonly client: GrafanaClient) {}

  async getTimeline(params: TimelineQueryParams): Promise<TimelineEvent[]> {
    const { carId, from = 'now-7d', to = 'now', limit = 50 } = params;

    return this.client.query<TimelineEvent>(TIMELINE_QUERIES.list, {
      variables: { car_id: carId, limit },
      timeRange: { from, to },
    });
  }
}
