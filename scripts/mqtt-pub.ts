import mqtt from 'mqtt';

function requireEnv(name: string, fallback?: string): string {
  const v = process.env[name] ?? fallback;
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

async function main() {
  const host = requireEnv('MQTT_HOST', '127.0.0.1');
  const port = requireEnv('MQTT_PORT', '1883');
  const topic = requireEnv('MQTT_TOPIC');
  const message = requireEnv('MQTT_MESSAGE', '');
  const retain = (process.env.MQTT_RETAIN ?? '0') === '1';

  const url = `mqtt://${host}:${port}`;
  const client = mqtt.connect(url, {
    clientId: `tesla-service-mqtt-pub-${Date.now()}`,
    connectTimeout: 10_000,
    reconnectPeriod: 0,
    clean: true,
  });

  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('MQTT connect timeout')), 12_000);
    client.on('connect', () => {
      clearTimeout(timer);
      resolve();
    });
    client.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });

  await new Promise<void>((resolve, reject) => {
    client.publish(topic, message, { qos: 0, retain }, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });

  client.end(true);
  console.log(`published: ${topic} = ${JSON.stringify(message)} retain=${retain}`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
