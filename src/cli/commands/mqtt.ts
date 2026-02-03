import { Command } from 'commander';
import { MqttService } from '../../core/services/mqtt-service.js';
import { config } from '../../config/index.js';

interface MqttOptions {
  host?: string;
  port?: string;
  carId?: string;
}

async function mqttAction(options: MqttOptions): Promise<void> {
  const host = options.host || config.mqtt.host;
  const port = options.port ? parseInt(options.port, 10) : config.mqtt.port;
  const carId = options.carId ? parseInt(options.carId, 10) : config.mqtt.carId;
  const topicPrefix = config.mqtt.topicPrefix;

  console.log('MQTT 服务配置:');
  console.log(`  Host: ${host}`);
  console.log(`  Port: ${port}`);
  console.log(`  Car ID: ${carId}`);
  console.log(`  Topic Prefix: ${topicPrefix}`);
  console.log('');

  const service = new MqttService({ host, port, carId, topicPrefix });

  // 优雅退出
  process.on('SIGINT', () => {
    console.log('\n收到 SIGINT，正在停止服务...');
    service.stop();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log('\n收到 SIGTERM，正在停止服务...');
    service.stop();
    process.exit(0);
  });

  await service.start();
}

export const mqttCommand = new Command('mqtt')
  .description('启动 MQTT 监听服务，自动截图行程和充电记录')
  .option('--host <host>', 'MQTT Broker 地址')
  .option('--port <port>', 'MQTT Broker 端口')
  .option('--car-id <id>', '车辆 ID')
  .action(mqttAction);
