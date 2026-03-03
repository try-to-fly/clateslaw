import { loadStoredConfig } from './store.js';

function requireCfg(v: unknown, keyPath: string): string {
  if (typeof v !== 'string' || !v.trim()) {
    throw new Error(`Missing required config: ${keyPath} (run: tesla config init)`);
  }
  return v;
}

function optionalString(v: unknown, defaultValue: string): string {
  return typeof v === 'string' && v.trim() ? v : defaultValue;
}

function optionalNumber(v: unknown, defaultValue: number): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : defaultValue;
}

export const config = (() => {
  const stored = loadStoredConfig();

  const mqtt = stored.mqtt || {};
  const grafana = stored.grafana || {};
  const openclaw = stored.openclaw || {};
  const amap = stored.amap || {};
  const navAlert = stored.navAlert || {};

  return {
    grafana: {
      url: requireCfg(grafana.url, 'grafana.url'),
      token: requireCfg(grafana.token, 'grafana.token'),
    },
    openclaw: {
      channel: requireCfg(openclaw.channel, 'openclaw.channel'),
      target: requireCfg(openclaw.target, 'openclaw.target'),
      account: typeof openclaw.account === 'string' ? openclaw.account : undefined,
    },
    mqtt: {
      host: optionalString(mqtt.host, 'localhost'),
      port: optionalNumber(mqtt.port, 1883),
      carId: optionalNumber(mqtt.carId, 1),
      topicPrefix: optionalString(mqtt.topicPrefix, 'teslamate'),
    },
    amap: {
      webApiKey:
        typeof amap.webApiKey === 'string' && amap.webApiKey.trim()
          ? amap.webApiKey.trim()
          : undefined,
    },
    navAlert: {
      enabled: typeof navAlert.enabled === 'boolean' ? navAlert.enabled : false,
      destinationKeywords: Array.isArray(navAlert.destinationKeywords)
        ? navAlert.destinationKeywords.filter((v) => typeof v === 'string' && v.trim())
        : [],
      thresholdsMinutes: Array.isArray(navAlert.thresholdsMinutes)
        ? navAlert.thresholdsMinutes
            .filter((n) => typeof n === 'number' && Number.isFinite(n))
            .map((n) => Math.max(0, Math.round(n)))
        : [15, 10, 5],
    },
  } as const;
})();

export type Config = typeof config;
