import Table from 'cli-table3';
import chalk from 'chalk';
import type { Car, CarOverview } from '../../types/car.js';
import type { ChargeRecord } from '../../types/charge.js';
import type { DriveRecord } from '../../types/drive.js';

export type OutputFormat = 'table' | 'json';

export function outputResult<T>(data: T, format: OutputFormat): void {
  if (format === 'json') {
    console.log(JSON.stringify(data, null, 2));
  }
}

export function formatCarsTable(cars: Car[]): void {
  const table = new Table({
    head: ['ID', 'Name', 'Model', 'VIN', 'Efficiency'],
    style: { head: ['cyan'] },
  });

  for (const car of cars) {
    table.push([car.id, car.name, car.model, car.vin, car.efficiency]);
  }

  console.log(table.toString());
}

export function formatCarOverviewTable(carId: number, overview: CarOverview): void {
  const stateColors: Record<string, (s: string) => string> = {
    online: chalk.green,
    charging: chalk.yellow,
    driving: chalk.blue,
    asleep: chalk.gray,
    offline: chalk.red,
    updating: chalk.magenta,
  };

  const colorFn = stateColors[overview.state] || chalk.white;

  const table = new Table();
  table.push(
    { 'Car ID': carId },
    { 'State': colorFn(overview.state) },
    { 'Battery': `${overview.battery_level}%` },
    { 'Range': `${overview.range_km.toFixed(1)} km` },
    { 'Odometer': `${overview.odometer_km.toFixed(1)} km` },
    { 'Software': overview.software_version },
    { 'Last Update': overview.last_update }
  );

  console.log(table.toString());
}

export function formatChargesTable(charges: ChargeRecord[]): void {
  const table = new Table({
    head: ['ID', 'Start', 'Location', 'Added (kWh)', 'Battery', 'Duration', 'Cost'],
    style: { head: ['cyan'] },
  });

  for (const c of charges) {
    const start = new Date(c.start_date).toLocaleString();
    const battery = `${c.start_battery_level}% → ${c.end_battery_level}%`;
    const duration = `${c.duration_min} min`;
    const cost = c.cost !== null ? `$${c.cost.toFixed(2)}` : '-';

    table.push([c.id, start, c.location, c.charge_energy_added.toFixed(2), battery, duration, cost]);
  }

  console.log(table.toString());
}

export function formatDrivesTable(drives: DriveRecord[]): void {
  const table = new Table({
    head: ['ID', 'Start', 'Route', 'Distance', 'Duration', 'Max Speed', 'Elevation'],
    style: { head: ['cyan'] },
  });

  for (const d of drives) {
    const start = new Date(d.start_date).toLocaleString();
    const route = `${d.start_location} → ${d.end_location}`;
    const distance = `${d.distance.toFixed(1)} km`;
    const duration = `${d.duration_min} min`;
    const speed = `${d.speed_max} km/h`;
    const elevation = d.ascent !== null && d.descent !== null
      ? `↑${d.ascent}m ↓${d.descent}m`
      : '-';

    table.push([d.id, start, route, distance, duration, speed, elevation]);
  }

  console.log(table.toString());
}
