#!/usr/bin/env node
import { spawn } from 'node:child_process';
import process from 'node:process';

function formatLocalDate(d = new Date()) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const date = formatLocalDate();
const child = spawn(
  process.execPath,
  [
    './node_modules/tsx/dist/cli.mjs',
    'src/index.ts',
    'screenshot',
    'daily',
    date,
    '--send',
    '-o',
    `/tmp/openclaw/daily-${date}.png`,
  ],
  {
    stdio: 'inherit',
    cwd: process.cwd(),
    env: {
      ...process.env,
      PATH: process.env.PATH || '/usr/bin:/bin:/usr/sbin:/sbin',
    },
  }
);

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 1);
});

child.on('error', (error) => {
  console.error(error);
  process.exit(1);
});
