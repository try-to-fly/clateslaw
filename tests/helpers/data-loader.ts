import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const DATA_DIR = join(process.cwd(), 'data');

export function loadJson<T>(relativePath: string): T | null {
  const fullPath = join(DATA_DIR, relativePath);
  if (!existsSync(fullPath)) {
    return null;
  }
  const content = readFileSync(fullPath, 'utf-8');
  return JSON.parse(content) as T;
}

export function loadJsonOrThrow<T>(relativePath: string): T {
  const data = loadJson<T>(relativePath);
  if (data === null) {
    throw new Error(`File not found: ${relativePath}`);
  }
  return data;
}

export function getCarDataPath(carId: number, subPath: string): string {
  return `cars/car-${carId}/${subPath}`;
}

export function loadCarData<T>(carId: number, subPath: string): T | null {
  return loadJson<T>(getCarDataPath(carId, subPath));
}

export function loadCarDataOrThrow<T>(carId: number, subPath: string): T {
  return loadJsonOrThrow<T>(getCarDataPath(carId, subPath));
}
