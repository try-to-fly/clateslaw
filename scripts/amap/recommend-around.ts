import 'dotenv/config';
import { getGrafanaClient, DriveService } from '../../src/core/index.js';

const AMAP_AROUND_URL = 'https://restapi.amap.com/v3/place/around';

type AmapAroundPoi = {
  id: string;
  name: string;
  type?: string;
  typecode?: string;
  address?: string;
  location: string; // "lng,lat"
  distance?: string; // meters as string
  tel?: string;
  biz_ext?: { rating?: string; cost?: string };
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
  types?: string;
  offset?: number;
  page?: number;
  sortrule?: 'distance' | 'weight';
  extensions?: 'base' | 'all';
}): Promise<AmapAroundResponse> {
  const u = new URL(AMAP_AROUND_URL);
  u.searchParams.set('key', params.key);
  u.searchParams.set('location', `${toFixed6(params.location.lng)},${toFixed6(params.location.lat)}`);
  u.searchParams.set('radius', String(params.radius));
  if (params.keywords) u.searchParams.set('keywords', params.keywords);
  if (params.types) u.searchParams.set('types', params.types);
  u.searchParams.set('offset', String(params.offset ?? 10));
  u.searchParams.set('page', String(params.page ?? 1));
  u.searchParams.set('sortrule', params.sortrule ?? 'distance');
  u.searchParams.set('extensions', params.extensions ?? 'base');
  u.searchParams.set('output', 'JSON');

  const res = await fetch(u);
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`AMap HTTP ${res.status}: ${body.slice(0, 200)}`);
  }
  return (await res.json()) as AmapAroundResponse;
}

async function main(): Promise<void> {
  const key = requireEnv('AMP_WEB_API');

  const carId = Number(process.env.MQTT_CAR_ID ?? '1');
  const radius = Number(process.env.AMAP_AROUND_RADIUS ?? '1500');

  const client = getGrafanaClient();
  const driveService = new DriveService(client);

  // Grab the most recent drive, then use the last GPS point as "current location".
  const drives = await driveService.getDrives(carId, { from: 'now-7d', to: 'now', limit: 1 });
  const lastDrive = drives[0];
  if (!lastDrive) {
    throw new Error('No drives found in the last 7 days; cannot infer current location.');
  }

  const positions = await driveService.getDrivePositions(carId, lastDrive.id);
  const lastPos = pickLast(positions);
  if (!lastPos) {
    throw new Error(`Drive ${lastDrive.id} has no GPS positions.`);
  }

  const center = { lng: lastPos.longitude, lat: lastPos.latitude };

  console.log(`\nCenter: ${toFixed6(center.lng)},${toFixed6(center.lat)} (from drive ${lastDrive.id})`);
  console.log(`Radius: ${radius}m`);

  // A simple "personalized" starter set: food/coffee, parking, EV-related, convenience.
  // We can tune this once we see real results.
  const categories: Array<{ title: string; keywords?: string; types?: string }> = [
    { title: 'Coffee', keywords: '咖啡' },
    { title: 'Food', keywords: '美食' },
    { title: 'Parking', keywords: '停车场' },
    { title: 'EV / Charging', keywords: '充电站' },
    { title: 'Convenience', keywords: '便利店' },
  ];

  for (const c of categories) {
    const data = await amapAround({
      key,
      location: center,
      radius,
      keywords: c.keywords,
      types: c.types,
      offset: 8,
      page: 1,
      sortrule: 'distance',
      extensions: 'base',
    });

    if (data.status !== '1') {
      console.log(`\n== ${c.title} ==`);
      console.log(`AMap error: ${data.info} (infocode=${data.infocode ?? '-'})`);
      continue;
    }

    const pois = (data.pois ?? []).slice(0, 5);
    console.log(`\n== ${c.title} ==`);
    if (pois.length === 0) {
      console.log('No results');
      continue;
    }

    for (const p of pois) {
      const dist = fmtDistanceMeters(p.distance);
      const addr = p.address ? ` | ${p.address}` : '';
      const tel = p.tel ? ` | ${p.tel}` : '';
      console.log(`- ${p.name} (${dist})${addr}${tel}`);
    }
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
