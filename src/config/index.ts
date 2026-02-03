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
} as const;

export type Config = typeof config;
