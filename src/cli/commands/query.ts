import { Command } from 'commander';
import { executeQuery, queryToCommand } from '../../core/query-executor.js';
import type { TeslaQuery } from '../../types/query-protocol.js';
import { outputResult } from '../utils/formatters.js';
import * as fs from 'node:fs';
import * as readline from 'node:readline';

/**
 * 解析查询输入
 */
function parseQueryInput(input: string): TeslaQuery {
  const trimmed = input.trim();

  // 如果是文件路径
  if (fs.existsSync(trimmed)) {
    const content = fs.readFileSync(trimmed, 'utf-8');
    return JSON.parse(content);
  }

  // 否则当作 JSON 字符串解析
  return JSON.parse(trimmed);
}

/**
 * 验证查询协议
 */
function validateQuery(query: unknown): query is TeslaQuery {
  if (!query || typeof query !== 'object') return false;
  const q = query as Record<string, unknown>;
  if (q.version !== '1.0') return false;
  if (typeof q.type !== 'string') return false;
  return true;
}

/**
 * 从 stdin 读取输入
 */
async function readStdin(): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false,
  });

  const lines: string[] = [];
  for await (const line of rl) {
    lines.push(line);
  }
  return lines.join('\n');
}

interface QueryOptions {
  dryRun?: boolean;
  output?: 'table' | 'json' | 'summary';
}

async function queryCommand(
  jsonInput: string | undefined,
  options: QueryOptions
): Promise<void> {
  let input: string;

  // 获取输入
  if (jsonInput) {
    input = jsonInput;
  } else if (!process.stdin.isTTY) {
    input = await readStdin();
  } else {
    console.error('Error: No query input provided');
    console.error('Usage: tesla query \'{"version":"1.0","type":"drives",...}\'');
    console.error('       tesla query ./query.json');
    console.error('       echo \'{"version":"1.0",...}\' | tesla query');
    process.exit(1);
  }

  // 解析查询
  let query: TeslaQuery;
  try {
    query = parseQueryInput(input);
  } catch (error) {
    console.error('Error: Invalid JSON input');
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }

  // 验证查询
  if (!validateQuery(query)) {
    console.error('Error: Invalid query protocol');
    console.error('Query must have version: "1.0" and a valid type');
    process.exit(1);
  }

  // 覆盖输出格式
  if (options.output) {
    query.output = options.output;
  }

  // 干运行模式：只输出命令
  if (options.dryRun) {
    console.log(queryToCommand(query));
    return;
  }

  // 执行查询
  const result = await executeQuery(query);

  if (!result.success) {
    console.error('Error:', result.error);
    if (result.command) {
      console.error('Equivalent command:', result.command);
    }
    process.exit(1);
  }

  // 输出结果
  if (query.output === 'json' || query.output === 'summary') {
    outputResult(result.data, 'json');
  } else {
    outputResult(result.data, 'json');
  }
}

export const queryCommandDef = new Command('query')
  .description('Execute a structured query protocol')
  .argument('[json]', 'JSON query string or file path')
  .option('--dry-run', 'Only output the equivalent CLI command')
  .option('-o, --output <format>', 'Output format: table | json | summary', 'json')
  .action(queryCommand);
