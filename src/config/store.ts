import Configstore from 'configstore';

// Centralized, user-level runtime config for tesla-service.
// This avoids relying on process ENV (pm2, shells, IDEs) and keeps secrets out of git.
const APP_NAME = 'tesla-service';

export type StoredConfig = {
  grafana?: {
    url?: string;
    token?: string;
  };
  openclaw?: {
    channel?: string;
    target?: string;
    account?: string;
  };
  mqtt?: {
    host?: string;
    port?: number;
    carId?: number;
    topicPrefix?: string;
  };
  navAlert?: {
    enabled?: boolean;
    // Match if destination includes any keyword.
    destinationKeywords?: string[];
    // Trigger pushes when remaining minutes crosses one of these thresholds.
    thresholdsMinutes?: number[];
    // AMap (Gaode) Web API key for reverse geocoding the current location.
    // If omitted, we will fall back to lat,lng in messages.
    amapKey?: string;
  };
};

export function getConfigStore(): Configstore {
  return new Configstore(APP_NAME);
}

export function loadStoredConfig(): StoredConfig {
  const store = getConfigStore();
  return (store.all || {}) as StoredConfig;
}

export function getStoredValue<T = unknown>(key: string): T | undefined {
  const store = getConfigStore();
  return store.get(key) as T | undefined;
}
