import { Command } from 'commander';
import { getConfigStore } from '../../config/store.js';

type IgnoredLocation = {
  name: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  suppressDriveScreenshot?: boolean;
  suppressParkRecommend?: boolean;
  suppressParkDelta?: boolean;
};

function readDestinations(): string[] {
  const store = getConfigStore();
  const v = store.get('navAlert.destinationKeywords') as unknown;
  if (v == null) return [];
  if (!Array.isArray(v)) {
    throw new Error('Invalid config: navAlert.destinationKeywords must be a string[]');
  }

  const invalid = v.find((x) => typeof x !== 'string' || !x.trim());
  if (invalid !== undefined) {
    throw new Error('Invalid config: navAlert.destinationKeywords must be a non-empty string[]');
  }

  return Array.from(new Set(v.map((x) => x.trim())));
}

function writeDestinations(list: string[]): void {
  const store = getConfigStore();
  const uniq = Array.from(new Set(list.map((s) => s.trim()).filter(Boolean)));
  store.set('navAlert.destinationKeywords', uniq);
}

function readThresholds(): number[] {
  const store = getConfigStore();
  const v = store.get('navAlert.thresholdsMinutes') as any;
  if (!Array.isArray(v)) return [15, 10, 5];
  const arr = v
    .filter((n) => typeof n === 'number' && Number.isFinite(n))
    .map((n) => Math.max(0, Math.round(n)));
  return arr.length ? arr : [15, 10, 5];
}

function writeThresholds(list: number[]): void {
  const store = getConfigStore();
  const uniq = Array.from(new Set(list.filter((n) => Number.isFinite(n) && n >= 0).map((n) => Math.round(n))));
  store.set('navAlert.thresholdsMinutes', uniq);
}

function readIgnoredLocations(): IgnoredLocation[] {
  const store = getConfigStore();
  const v = store.get('navAlert.ignoredLocations') as unknown;
  if (v == null) return [];
  if (!Array.isArray(v)) {
    throw new Error('Invalid config: navAlert.ignoredLocations must be an object[]');
  }

  return v.filter((item) => {
    if (!item || typeof item !== 'object') return false;
    const x = item as any;
    return (
      typeof x.name === 'string' &&
      x.name.trim() &&
      typeof x.latitude === 'number' &&
      Number.isFinite(x.latitude) &&
      typeof x.longitude === 'number' &&
      Number.isFinite(x.longitude) &&
      typeof x.radiusMeters === 'number' &&
      Number.isFinite(x.radiusMeters) &&
      x.radiusMeters >= 0
    );
  }) as IgnoredLocation[];
}

function writeIgnoredLocations(list: IgnoredLocation[]): void {
  const store = getConfigStore();
  const normalized = list.map((x) => ({
    name: x.name.trim(),
    latitude: x.latitude,
    longitude: x.longitude,
    radiusMeters: Math.max(0, Math.round(x.radiusMeters)),
    suppressDriveScreenshot: x.suppressDriveScreenshot ?? false,
    suppressParkRecommend: x.suppressParkRecommend ?? false,
    suppressParkDelta: x.suppressParkDelta ?? false,
  }));
  store.set('navAlert.ignoredLocations', normalized);
}

export const navCommand = new Command('nav').description('Navigation alert config helpers');

navCommand
  .command('destinations')
  .description('Manage nav destination whitelist (strict match)')
  .addCommand(
    new Command('list').description('List destination whitelist').action(() => {
      const list = readDestinations();
      if (!list.length) {
        console.log('(empty)');
        return;
      }
      for (const d of list) console.log(d);
    })
  )
  .addCommand(
    new Command('add')
      .description('Add a destination (exact string)')
      .argument('<destination>', 'Exact destination string as reported by TeslaMate')
      .action((destination: string) => {
        const list = readDestinations();
        list.push(destination);
        writeDestinations(list);
        console.log('OK');
      })
  )
  .addCommand(
    new Command('remove')
      .description('Remove a destination (exact string)')
      .argument('<destination>', 'Exact destination string')
      .action((destination: string) => {
        const list = readDestinations().filter((d) => d !== destination);
        writeDestinations(list);
        console.log('OK');
      })
  );

navCommand
  .command('thresholds')
  .description('Manage nav alert thresholds (minutes)')
  .addCommand(
    new Command('get').description('Print thresholds list').action(() => {
      console.log(JSON.stringify(readThresholds()));
    })
  )
  .addCommand(
    new Command('set')
      .description('Set thresholds, e.g. "15,10,5"')
      .argument('<csv>', 'Comma-separated minutes')
      .action((csv: string) => {
        const list = csv
          .split(',')
          .map((s) => Number(s.trim()))
          .filter((n) => Number.isFinite(n));
        writeThresholds(list);
        console.log('OK');
      })
  );

navCommand
  .command('ignore')
  .description('Manage ignored locations for routine push suppression')
  .addCommand(
    new Command('list').description('List ignored locations').action(() => {
      const list = readIgnoredLocations();
      if (!list.length) {
        console.log('(empty)');
        return;
      }
      console.log(JSON.stringify(list, null, 2));
    })
  )
  .addCommand(
    new Command('add')
      .description('Add or replace an ignored location')
      .requiredOption('--name <name>', 'Location name')
      .requiredOption('--lat <latitude>', 'Latitude')
      .requiredOption('--lng <longitude>', 'Longitude')
      .requiredOption('--radius <meters>', 'Radius in meters')
      .option('--suppress-drive-screenshot', 'Suppress drive screenshot push')
      .option('--suppress-park-recommend', 'Suppress park recommend push')
      .option('--suppress-park-delta', 'Suppress park delta push')
      .action((options: {
        name: string;
        lat: string;
        lng: string;
        radius: string;
        suppressDriveScreenshot?: boolean;
        suppressParkRecommend?: boolean;
        suppressParkDelta?: boolean;
      }) => {
        const latitude = Number(options.lat);
        const longitude = Number(options.lng);
        const radiusMeters = Number(options.radius);
        if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || !Number.isFinite(radiusMeters)) {
          throw new Error('Invalid lat/lng/radius');
        }

        const list = readIgnoredLocations().filter((x) => x.name !== options.name.trim());
        list.push({
          name: options.name.trim(),
          latitude,
          longitude,
          radiusMeters,
          suppressDriveScreenshot: !!options.suppressDriveScreenshot,
          suppressParkRecommend: !!options.suppressParkRecommend,
          suppressParkDelta: !!options.suppressParkDelta,
        });
        writeIgnoredLocations(list);
        console.log('OK');
      })
  )
  .addCommand(
    new Command('remove')
      .description('Remove an ignored location by name')
      .argument('<name>', 'Location name')
      .action((name: string) => {
        const list = readIgnoredLocations().filter((x) => x.name !== name.trim());
        writeIgnoredLocations(list);
        console.log('OK');
      })
  );
