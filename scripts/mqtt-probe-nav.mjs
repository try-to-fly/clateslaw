#!/usr/bin/env node
/**
 * Simple MQTT probe for TeslaMate navigation (active_route_*) topics.
 *
 * Usage:
 *   node scripts/mqtt-probe-nav.mjs --host 192.168.1.2 --port 1883 --carId 1 --prefix teslamate --duration 60
 *   node scripts/mqtt-probe-nav.mjs --config ./config.json --duration 120 --json
 */

import mqtt from 'mqtt';
import fs from 'node:fs';
import path from 'node:path';

function parseArgs(argv) {
  const args = {
    host: undefined,
    port: undefined,
    carId: undefined,
    prefix: undefined,
    duration: 60,
    json: false,
    config: undefined,
    topic: undefined,
  };

  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--json') args.json = true;
    else if (a === '--host') args.host = argv[++i];
    else if (a === '--port') args.port = Number(argv[++i]);
    else if (a === '--carId') args.carId = Number(argv[++i]);
    else if (a === '--prefix') args.prefix = argv[++i];
    else if (a === '--duration') args.duration = Number(argv[++i]);
    else if (a === '--config') args.config = argv[++i];
    else if (a === '--topic') args.topic = argv[++i];
    else if (a === '-h' || a === '--help') args.help = true;
    else {
      console.error(`Unknown arg: ${a}`);
      args.help = true;
    }
  }
  return args;
}

function usage() {
  console.log(`\nMQTT probe for TeslaMate nav topics\n\nOptions:\n  --config <path>   JSON config file containing { mqtt: { host, port, carId, topicPrefix } }\n  --host <host>     MQTT broker host\n  --port <port>     MQTT broker port\n  --carId <id>      TeslaMate car id\n  --prefix <pfx>    TeslaMate topicPrefix (default: teslamate)\n  --topic <topic>   Override subscribe topic (default: <prefix>/cars/<carId>/active_route#)\n  --duration <sec>  Exit after N seconds (default: 60)\n  --json            Output one JSON per line\n\nExamples:\n  node scripts/mqtt-probe-nav.mjs --config ./config.json --duration 120\n  node scripts/mqtt-probe-nav.mjs --host 192.168.31.56 --port 1883 --carId 1 --prefix teslamate --json\n`);
}

function loadFromConfig(p) {
  const abs = path.resolve(process.cwd(), p);
  const raw = fs.readFileSync(abs, 'utf8');
  const cfg = JSON.parse(raw);
  const m = cfg?.mqtt;
  return {
    host: m?.host,
    port: m?.port,
    carId: m?.carId,
    prefix: m?.topicPrefix,
  };
}

function nowIso() {
  return new Date().toISOString();
}

const args = parseArgs(process.argv);
if (args.help) {
  usage();
  process.exit(0);
}

let host = args.host;
let port = args.port;
let carId = args.carId;
let prefix = args.prefix;

if (args.config) {
  const fromCfg = loadFromConfig(args.config);
  host ??= fromCfg.host;
  port ??= fromCfg.port;
  carId ??= fromCfg.carId;
  prefix ??= fromCfg.prefix;
}

prefix ??= 'teslamate';

if (!host || !Number.isFinite(port) || !Number.isFinite(carId)) {
  console.error('Missing required MQTT connection args. Use --config or --host/--port/--carId.');
  usage();
  process.exit(1);
}

// mqtt.js uses MQTT wildcards: '+' for one level, '#' must be its own level (ends with '/#').
const topic = args.topic || `${prefix}/cars/${carId}/active_route/#`;
const url = `mqtt://${host}:${port}`;

const client = mqtt.connect(url, {
  clientId: `tesla-nav-probe-${Date.now()}`,
  reconnectPeriod: 0,
  connectTimeout: 15_000,
  clean: true,
});

const seen = new Map();

function print(topic, payload) {
  const line = {
    ts: nowIso(),
    topic,
    payload,
  };

  if (args.json) {
    process.stdout.write(`${JSON.stringify(line)}\n`);
  } else {
    console.log(`[${line.ts}] ${topic} = ${payload}`);
  }
}

client.on('connect', () => {
  console.log(`Connected: ${url}`);
  console.log(`Subscribing: ${topic}`);

  client.subscribe(topic, { qos: 0 }, (err) => {
    if (err) {
      console.error('Subscribe failed:', err.message);
      process.exitCode = 2;
      client.end(true);
      return;
    }

    console.log(`Running for ${args.duration}s...`);
    setTimeout(() => {
      console.log('Done.');
      client.end(true);
    }, Math.max(1, args.duration) * 1000);
  });
});

client.on('message', (t, msg) => {
  const payload = msg.toString();

  // Reduce noise: only print if changed from last seen payload for the same topic.
  const prev = seen.get(t);
  if (prev !== payload) {
    seen.set(t, payload);
    print(t, payload);
  }
});

client.on('error', (err) => {
  console.error('MQTT error:', err.message);
  process.exitCode = 2;
});

client.on('close', () => {
  // no-op
});
