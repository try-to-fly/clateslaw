import { env } from "node:process";

function requireEnv(key: string): string {
  const value = env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
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
} as const;

export type Config = typeof config;
