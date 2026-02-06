import 'dotenv/config';
import { getGrafanaClient, DriveService, getMessageService } from '../../src/core/index.js';

const AMAP_AROUND_URL = 'https://restapi.amap.com/v3/place/around';

type AmapAroundPoi = {
  id: string;
  name: string;
  type?: string;
  address?: string;
  location: string; // "lng,lat"
  distance?: string; // meters as string
  tel?: string;
};

type AmapAroundResponse = {
  status: '0' | '1';
  info: string;
  infocode?: string;
  count?: string;
  pois?: AmapAroundPoi[];
};

function requireEnv(key: string): string {
  const v = process.env[key];
  if (!v) throw new Error(`Missing required environment variable: ${key}`);
  return v;
}

function pickLast<T>(arr: T[]): T | null {
  return arr.length > 0 ? arr[arr.length - 1] : null;
}

function toFixed6(n: number): string {
  return (Math.round(n * 1e6) / 1e6).toFixed(6);
}

function fmtDistanceMeters(m?: string): string {
  const n = m ? Number(m) : NaN;
  if (!Number.isFinite(n)) return '-';
  if (n < 1000) return `${Math.round(n)}m`;
  return `${(n / 1000).toFixed(1)}km`;
}

async function amapAround(params: {
  key: string;
  location: { lng: number; lat: number };
  radius: number;
  keywords?: string;
  offset?: number;
  page?: number;
}): Promise<AmapAroundResponse> {
  const u = new URL(AMAP_AROUND_URL);
  u.searchParams.set('key', params.key);
  u.searchParams.set('location', `${toFixed6(params.location.lng)},${toFixed6(params.location.lat)}`);
  u.searchParams.set('radius', String(params.radius));
  if (params.keywords) u.searchParams.set('keywords', params.keywords);
  u.searchParams.set('offset', String(params.offset ?? 10));
  u.searchParams.set('page', String(params.page ?? 1));
  u.searchParams.set('sortrule', 'distance');
  u.searchParams.set('extensions', 'base');
  u.searchParams.set('output', 'JSON');

  const res = await fetch(u);
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`AMap HTTP ${res.status}: ${body.slice(0, 200)}`);
  }
  return (await res.json()) as AmapAroundResponse;
}

async function sleep(ms: number): Promise<void> {
  await new Promise((r) => setTimeout(r, ms));
}

async function aroundWithBackoff(
  args: Parameters<typeof amapAround>[0]
): Promise<AmapAroundResponse> {
  const delays = [0, 350, 900, 1600];
  let last: AmapAroundResponse | null = null;
  for (let i = 0; i < delays.length; i++) {
    if (delays[i] > 0) await sleep(delays[i]);
    const data = await amapAround(args);
    last = data;
    if (data.status === '1') return data;
    // 10021: limit exceeded; retry with backoff
    if (data.infocode !== '10021') return data;
  }
  return last!;
}

async function main(): Promise<void> {
  const key = requireEnv('AMP_WEB_API');
  const carId = Number(process.env.MQTT_CAR_ID ?? '1');
  const radius = Number(process.env.AMAP_AROUND_RADIUS ?? '1500');

  const client = getGrafanaClient();
  const driveService = new DriveService(client);

  const drives = await driveService.getDrives(carId, { from: 'now-7d', to: 'now', limit: 1 });
  const lastDrive = drives[0];
  if (!lastDrive) throw new Error('No drives found in the last 7 days; cannot infer current location.');

  const positions = await driveService.getDrivePositions(carId, lastDrive.id);
  const lastPos = pickLast(positions);
  if (!lastPos) throw new Error(`Drive ${lastDrive.id} has no GPS positions.`);

  const center = { lng: lastPos.longitude, lat: lastPos.latitude };

  const categories: Array<{ title: string; keywords: string; emoji: string }> = [
    { title: '充电', keywords: '充电站', emoji: '⚡' },
    { title: '停车', keywords: '停车场', emoji: '🅿️' },
    { title: '美食', keywords: '美食', emoji: '🍜' },
    { title: '其他', keywords: '便利店', emoji: '✨' },
  ];

  const lines: string[] = [];
  lines.push(`📍停车后周边推荐（半径${radius}m）`);
  lines.push(`坐标: ${toFixed6(center.lng)},${toFixed6(center.lat)}`);

  for (const c of categories) {
    const data = await aroundWithBackoff({
      key,
      location: center,
      radius,
      keywords: c.keywords,
      offset: 6,
      page: 1,
    });

    if (data.status !== '1') {
      lines.push(`${c.emoji} ${c.title}: ${data.info}${data.infocode ? ` (${data.infocode})` : ''}`);
      continue;
    }

    const pois = (data.pois ?? [])
      .slice()
      .sort((a, b) => Number(a.distance ?? 1e18) - Number(b.distance ?? 1e18))
      .slice(0, 3);

    if (pois.length === 0) {
      lines.push(`${c.emoji} ${c.title}: 无结果`);
      continue;
    }

    lines.push(`${c.emoji} ${c.title}:`);
    for (const poi of pois) {
      const dist = fmtDistanceMeters(poi.distance);
      const addr = poi.address ? ` | ${poi.address}` : '';
      lines.push(`- ${poi.name} (${dist})${addr}`);
    }
  }

  const msg = lines.join('\n');
  const messageService = getMessageService();
  await messageService.sendText(msg);
  console.log('Sent to OpenClaw:', msg);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
