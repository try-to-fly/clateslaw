import { Command } from 'commander';
import { chargeDetailCommand } from './charge.js';
import { driveDetailCommand } from './drive.js';

export const detailCommand = new Command('detail').description('Detail commands');

detailCommand
  .command('charge <charge-id>')
  .description('Charge session details')
  .option('-o, --output <format>', 'Output format: table | json', 'table')
  .action(chargeDetailCommand);

detailCommand
  .command('drive <drive-id>')
  .description('Drive session details')
  .option('-o, --output <format>', 'Output format: table | json', 'table')
  .action(driveDetailCommand);
