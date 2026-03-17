import { Command } from 'commander';
import Configstore from 'configstore';
import { spawn } from 'node:child_process';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { getStoredValue } from '../../config/store.js';

const STORE_NAME = 'tesla-cli';
const LABEL = 'fox.tesla.daily-screenshot';

type ExecResult = { code: number; stdout: string; stderr: string };

function runCommand(command: string, args: string[]): Promise<ExecResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => {
      stdout += String(chunk);
    });
    child.stderr.on('data', (chunk) => {
      stderr += String(chunk);
    });
    child.on('error', reject);
    child.on('close', (code) => {
      resolve({ code: code ?? 0, stdout, stderr });
    });
  });
}

function getLaunchAgentsDir(): string {
  return path.join(os.homedir(), 'Library', 'LaunchAgents');
}

function getPlistPath(): string {
  return path.join(getLaunchAgentsDir(), `${LABEL}.plist`);
}

function getLogsDir(): string {
  return path.join(os.homedir(), '.tesla-cli', 'logs');
}

function ensureDirs(): void {
  fs.mkdirSync(getLaunchAgentsDir(), { recursive: true });
  fs.mkdirSync(getLogsDir(), { recursive: true });
}

function getRepoCwd(): string {
  const v = getStoredValue<string>('service.repoCwd');
  if (typeof v === 'string' && v.trim()) return v.trim();
  return process.cwd();
}

function normalizeHmTime(value: string): { hour: number; minute: number } | null {
  const trimmed = value.trim();
  const m = trimmed.match(/^(\d{2}):(\d{2})$/);
  if (!m) return null;
  const hour = Number(m[1]);
  const minute = Number(m[2]);
  if (!Number.isInteger(hour) || !Number.isInteger(minute)) return null;
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  return { hour, minute };
}

function xmlEscape(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function getCurrentPathEnv(): string {
  return process.env.PATH || '/usr/bin:/bin:/usr/sbin:/sbin';
}

function resolvePnpmPath(): string {
  const pnpmFromEnv = process.env.npm_execpath;
  if (typeof pnpmFromEnv === 'string' && pnpmFromEnv.trim()) return pnpmFromEnv.trim();
  return 'pnpm';
}

function buildPlist(hour: number, minute: number, cwd: string): string {
  const outPath = path.join(getLogsDir(), 'daily-screenshot-launchd.out.log');
  const errPath = path.join(getLogsDir(), 'daily-screenshot-launchd.err.log');
  const pathEnv = getCurrentPathEnv();
  const pnpmPath = resolvePnpmPath();
  const shellScript = `${JSON.stringify(pnpmPath)} dev screenshot daily $(date +%F) --send -o /tmp/openclaw/daily-$(date +%F).png`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple Computer//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>${xmlEscape(LABEL)}</string>

  <key>ProgramArguments</key>
  <array>
    <string>/bin/bash</string>
    <string>-lc</string>
    <string>${xmlEscape(shellScript)}</string>
  </array>

  <key>WorkingDirectory</key>
  <string>${xmlEscape(cwd)}</string>

  <key>EnvironmentVariables</key>
  <dict>
    <key>PATH</key>
    <string>${xmlEscape(pathEnv)}</string>
  </dict>

  <key>StartCalendarInterval</key>
  <dict>
    <key>Hour</key>
    <integer>${hour}</integer>
    <key>Minute</key>
    <integer>${minute}</integer>
  </dict>

  <key>StandardOutPath</key>
  <string>${xmlEscape(outPath)}</string>
  <key>StandardErrorPath</key>
  <string>${xmlEscape(errPath)}</string>

  <key>RunAtLoad</key>
  <false/>
</dict>
</plist>
`;
}

async function unloadIfLoaded(plistPath: string): Promise<void> {
  const uid = process.getuid?.();
  if (typeof uid !== 'number') return;
  const result = await runCommand('launchctl', ['bootout', `gui/${uid}`, plistPath]).catch(() => null);
  if (!result) return;
  if (result.stdout && result.stdout.trim()) process.stdout.write(result.stdout);
  if (result.stderr && result.stderr.trim() && !result.stderr.includes('No such process')) process.stderr.write(result.stderr);
}

async function registerLaunchAgentFromConfig(): Promise<void> {
  const raw = getStoredValue<string>('navAlert.dailyScreenshotTime');
  if (typeof raw !== 'string' || !raw.trim()) {
    await unregisterLaunchAgent();
    console.log('navAlert.dailyScreenshotTime 未配置，已移除 daily screenshot launchd 定时任务');
    return;
  }

  const parsed = normalizeHmTime(raw);
  if (!parsed) throw new Error('navAlert.dailyScreenshotTime 必须是 HH:mm');

  ensureDirs();
  const cwd = getRepoCwd();
  const plistPath = getPlistPath();
  fs.writeFileSync(plistPath, buildPlist(parsed.hour, parsed.minute, cwd), 'utf-8');

  await unloadIfLoaded(plistPath);

  const uid = process.getuid?.();
  if (typeof uid !== 'number') throw new Error('process.getuid unavailable');
  const result = await runCommand('launchctl', ['bootstrap', `gui/${uid}`, plistPath]);
  if (result.stdout && result.stdout.trim()) process.stdout.write(result.stdout);
  if (result.stderr && result.stderr.trim()) process.stderr.write(result.stderr);
  if (result.code !== 0) throw new Error(`launchctl bootstrap failed with code ${result.code}`);

  const enable = await runCommand('launchctl', ['enable', `gui/${uid}/${LABEL}`]).catch(() => null);
  if (enable?.stdout && enable.stdout.trim()) process.stdout.write(enable.stdout);
  if (enable?.stderr && enable.stderr.trim()) process.stderr.write(enable.stderr);

  const store = new Configstore(STORE_NAME);
  store.set('launchd.dailyScreenshotLabel', LABEL);
  store.set('launchd.dailyScreenshotPlist', plistPath);

  console.log(`LaunchAgent installed: ${LABEL}`);
  console.log(`Plist: ${plistPath}`);
  console.log(`Schedule: ${raw}`);
}

async function unregisterLaunchAgent(): Promise<void> {
  const plistPath = getPlistPath();
  await unloadIfLoaded(plistPath);
  if (fs.existsSync(plistPath)) fs.unlinkSync(plistPath);

  const store = new Configstore(STORE_NAME);
  store.delete('launchd.dailyScreenshotLabel');
  store.delete('launchd.dailyScreenshotPlist');
}

async function statusLaunchAgent(): Promise<void> {
  const plistPath = getPlistPath();
  console.log(`Label: ${LABEL}`);
  console.log(`Plist: ${plistPath}`);
  console.log(`Exists: ${fs.existsSync(plistPath) ? 'yes' : 'no'}`);

  const uid = process.getuid?.();
  if (typeof uid !== 'number') throw new Error('process.getuid unavailable');
  const print = await runCommand('launchctl', ['print', `gui/${uid}/${LABEL}`]).catch(() => null);
  if (!print) {
    console.log('launchctl print failed');
    return;
  }
  if (print.stdout && print.stdout.trim()) process.stdout.write(print.stdout);
  if (print.stderr && print.stderr.trim()) process.stderr.write(print.stderr);
}

export async function syncDailyScreenshotLaunchAgent(): Promise<void> {
  const raw = getStoredValue<string>('navAlert.dailyScreenshotTime');
  if (typeof raw === 'string' && raw.trim()) {
    await registerLaunchAgentFromConfig();
  } else {
    await unregisterLaunchAgent();
  }
}

export const launchdCommand = new Command('launchd').description('Manage macOS launchd jobs for Tesla');

launchdCommand
  .command('sync-daily-screenshot')
  .description('Install/update/remove the daily screenshot LaunchAgent from current config')
  .action(async () => {
    await syncDailyScreenshotLaunchAgent();
  });

launchdCommand
  .command('status-daily-screenshot')
  .description('Show daily screenshot LaunchAgent status')
  .action(async () => {
    await statusLaunchAgent();
  });

launchdCommand
  .command('remove-daily-screenshot')
  .description('Remove the daily screenshot LaunchAgent')
  .action(async () => {
    await unregisterLaunchAgent();
    console.log('Daily screenshot LaunchAgent removed');
  });
