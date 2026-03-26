#!/usr/bin/env node

/**
 * Streamable HTTP transport — entry point for remote deployment.
 * Runs an Express server that handles MCP protocol via HTTP.
 * Supports per-request API keys for multi-tenant usage.
 */

import express from 'express';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createSsembleMcpServer } from '../index.js';

const app = express();
app.use(express.json());

const SERVER_CARD = {
  serverInfo: {
    name: 'ssemble-ai-clipping',
    version: '1.0.0',
  },
  capabilities: {
    tools: true,
    resources: true,
    prompts: true,
  },
  authentication: {
    required: true,
    schemes: ['api_key'],
    instructions: 'Pass your Ssemble API key via the X-Ssemble-API-Key header or set SSEMBLE_API_KEY env var on the server.',
  },
};

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', server: 'ssemble-mcp', version: '1.0.0' });
});

// Smithery auto-discovery
app.get('/.well-known/mcp/server-card.json', (_req, res) => {
  res.json(SERVER_CARD);
});

// MCP endpoint — stateless mode (each request is independent)
app.all('/mcp', async (req, res) => {
  const apiKey = req.headers['x-ssemble-api-key'] || process.env.SSEMBLE_API_KEY || null;
  const baseUrl = process.env.SSEMBLE_API_BASE_URL;

  // Log MCP requests (tool calls) for usage tracking
  if (req.body?.method === 'tools/call') {
    const keyPrefix = apiKey ? apiKey.slice(0, 20) + '...' : 'no-key';
    const toolName = req.body?.params?.name || 'unknown';
    console.log(`[MCP] tool=${toolName} key=${keyPrefix} ip=${req.ip} time=${new Date().toISOString()}`);
  }

  try {
    const server = createSsembleMcpServer(apiKey, baseUrl);
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined, // stateless
    });

    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    if (!res.headersSent) {
      res.status(500).json({
        error: {
          code: 'internal_error',
          message: 'MCP server error',
        },
      });
    }
  }
});

const port = parseInt(process.env.MCP_PORT || '3100', 10);
app.listen(port, () => {
  console.log(`Ssemble MCP Server (HTTP) listening on port ${port}`);
  console.log(`  MCP endpoint: http://localhost:${port}/mcp`);
  console.log(`  Health check: http://localhost:${port}/health`);
  console.log(`  Server card:  http://localhost:${port}/.well-known/mcp/server-card.json`);
});
