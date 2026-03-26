#!/usr/bin/env node

/**
 * Stdio transport — entry point for local usage via npx or Claude Desktop/Code config.
 * Reads SSEMBLE_API_KEY from environment variable.
 */

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createSsembleMcpServer } from '../index.js';

const apiKey = process.env.SSEMBLE_API_KEY;
if (!apiKey) {
  console.error('Error: SSEMBLE_API_KEY environment variable is required.');
  console.error('Get your API key at https://app.ssemble.com/api-keys');
  process.exit(1);
}

const baseUrl = process.env.SSEMBLE_API_BASE_URL;
const server = createSsembleMcpServer(apiKey, baseUrl);
const transport = new StdioServerTransport();

await server.connect(transport);
