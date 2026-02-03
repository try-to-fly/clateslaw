import { env } from "node:process";

function requireEnv(key: string): string {
  const value = env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function optionalEnv(key: string, defaultValue: string): string {
  return env[key] || defaultValue;
}

export const config = {
  grafana: {
    url: requireEnv("GRAFANA_URL"),
    token: requireEnv("GRAFANA_TOKEN"),
  },
  openclaw: {
    channel: requireEnv("OPENCLAW_CHANNEL"),
    target: requireEnv("OPENCLAW_TARGET"),
  },
  mqtt: {
    host: optionalEnv("MQTT_HOST", "localhost"),
    port: parseInt(optionalEnv("MQTT_PORT", "1883"), 10),
    carId: parseInt(optionalEnv("MQTT_CAR_ID", "1"), 10),
    topicPrefix: optionalEnv("MQTT_TOPIC_PREFIX", "teslamate"),
  },
} as const;

export type Config = typeof config;
