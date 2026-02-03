import { Command } from 'commander';
import { carsCommand } from './commands/cars.js';
import { carCommand } from './commands/car.js';
import { chargesCommand } from './commands/charges.js';
import { drivesCommand } from './commands/drives.js';

const program = new Command();

program
  .name('tesla')
  .description('Tesla Service CLI')
  .version('1.0.0');

program
  .command('cars')
  .description('List all vehicles')
  .option('-o, --output <format>', 'Output format: table | json', 'table')
  .action(carsCommand);

program
  .command('car <id>')
  .description('Get vehicle overview')
  .option('-o, --output <format>', 'Output format: table | json', 'table')
  .action(carCommand);

program
  .command('charges <car-id>')
  .description('Get charge records')
  .option('-o, --output <format>', 'Output format: table | json', 'table')
  .option('-f, --from <date>', 'Start time', 'now-90d')
  .option('-t, --to <date>', 'End time', 'now')
  .option('-l, --limit <number>', 'Record limit', '50')
  .action(chargesCommand);

program
  .command('drives <car-id>')
  .description('Get drive records')
  .option('-o, --output <format>', 'Output format: table | json', 'table')
  .option('-f, --from <date>', 'Start time', 'now-90d')
  .option('-t, --to <date>', 'End time', 'now')
  .option('-l, --limit <number>', 'Record limit', '50')
  .action(drivesCommand);

export { program };
