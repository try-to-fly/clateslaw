import { Command } from 'commander';
import { chargingStatsCommand } from './charging.js';
import { drivingStatsCommand } from './driving.js';
import { periodStatsCommand } from './period.js';

export const statsCommand = new Command('stats').description('Statistics commands');

statsCommand
  .command('charging <car-id>')
  .description('Charging statistics')
  .option('-o, --output <format>', 'Output format: table | json', 'table')
  .option('-f, --from <date>', 'Start time', 'now-90d')
  .option('-t, --to <date>', 'End time', 'now')
  .option('--min-duration <minutes>', 'Minimum charge duration in minutes', '0')
  .action(chargingStatsCommand);

statsCommand
  .command('driving <car-id>')
  .description('Driving statistics')
  .option('-o, --output <format>', 'Output format: table | json', 'table')
  .option('-f, --from <date>', 'Start time', 'now-90d')
  .option('-t, --to <date>', 'End time', 'now')
  .action(drivingStatsCommand);

statsCommand
  .command('period <car-id>')
  .description('Statistics by period')
  .option('-o, --output <format>', 'Output format: table | json', 'table')
  .option('-f, --from <date>', 'Start time', 'now-1y')
  .option('-t, --to <date>', 'End time', 'now')
  .option('-p, --period <period>', 'Period: day | week | month | year', 'month')
  .action(periodStatsCommand);
