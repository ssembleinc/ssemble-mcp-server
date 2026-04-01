/**
 * Ssemble MCP Server — factory function.
 * Creates and configures the McpServer with all tools, resources, and prompts.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { SsembleClient } from './api/client.js';

// Tools
import { registerCreateShort } from './tools/create-short.js';
import { registerGetStatus } from './tools/get-status.js';
import { registerGetShorts } from './tools/get-shorts.js';
import { registerListRequests } from './tools/list-requests.js';
import { registerDeleteRequest } from './tools/delete-request.js';
import { registerListTemplates } from './tools/list-templates.js';
import { registerListMusic } from './tools/list-music.js';
import { registerListGameVideos } from './tools/list-game-videos.js';
import { registerListMemeHooks } from './tools/list-meme-hooks.js';

// Resources & Prompts
import { registerResources } from './resources/static-data.js';
import { registerAppResources } from './resources/app-resources.js';
import { registerPrompts } from './prompts/workflows.js';

export function createSsembleMcpServer(apiKey, baseUrl) {
  const server = new McpServer({
    name: 'ssemble-ai-clipping',
    version: '1.0.0',
  });

  // Client is created lazily — allows MCP initialize/discovery without an API key.
  // Tools will get a clear error if key is missing when they actually call the API.
  const client = new SsembleClient(apiKey, baseUrl, { lazy: true });

  // Register all 9 tools
  registerCreateShort(server, client);
  registerGetStatus(server, client);
  registerGetShorts(server, client);
  registerListRequests(server, client);
  registerDeleteRequest(server, client);
  registerListTemplates(server, client);
  registerListMusic(server, client);
  registerListGameVideos(server, client);
  registerListMemeHooks(server, client);

  // Register resources
  registerResources(server);
  registerAppResources(server);

  // Register prompts
  registerPrompts(server);

  return server;
}
