#!/usr/bin/env node
import 'dotenv/config';
import { program } from './cli/index.js';

program.parse();
