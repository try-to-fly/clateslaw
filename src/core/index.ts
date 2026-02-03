import { GrafanaClient } from './grafana-client.js';
import { config } from '../config/index.js';

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

export { GrafanaClient, GrafanaApiError, GrafanaQueryError } from './grafana-client.js';
export * from './services/index.js';
