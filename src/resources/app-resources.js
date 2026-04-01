/**
 * Registers MCP App UI resources for interactive HTML views.
 */

import { registerAppResource } from '@modelcontextprotocol/ext-apps/server';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST_DIR = join(__dirname, '..', 'apps', 'dist');

function loadHtml(filename) {
  return readFileSync(join(DIST_DIR, filename), 'utf-8');
}

const CDN_DOMAINS = ['https://cf.ssemble.com', 'https://*.ssemble.com'];

export function registerAppResources(server) {
  registerAppResource(
    server,
    'Templates Browser',
    'ui://ssemble/templates-app.html',
    {
      description: 'Interactive grid of caption style templates with GIF previews',
      _meta: {
        ui: {
          csp: {
            resourceDomains: CDN_DOMAINS,
            connectDomains: CDN_DOMAINS,
          },
        },
      },
    },
    async () => ({
      contents: [
        {
          uri: 'ui://ssemble/templates-app.html',
          mimeType: 'text/html;profile=mcp-app',
          text: loadHtml('templates-app.html'),
        },
      ],
    })
  );

  registerAppResource(
    server,
    'Music Player',
    'ui://ssemble/music-app.html',
    {
      description: 'Interactive music player with audio preview and track selection',
      _meta: {
        ui: {
          csp: {
            resourceDomains: CDN_DOMAINS,
            connectDomains: CDN_DOMAINS,
          },
        },
      },
    },
    async () => ({
      contents: [
        {
          uri: 'ui://ssemble/music-app.html',
          mimeType: 'text/html;profile=mcp-app',
          text: loadHtml('music-app.html'),
        },
      ],
    })
  );

  registerAppResource(
    server,
    'Game Videos Gallery',
    'ui://ssemble/game-videos-app.html',
    {
      description: 'Interactive gallery of gameplay overlay videos with preview images',
      _meta: {
        ui: {
          csp: {
            resourceDomains: CDN_DOMAINS,
            connectDomains: CDN_DOMAINS,
          },
        },
      },
    },
    async () => ({
      contents: [
        {
          uri: 'ui://ssemble/game-videos-app.html',
          mimeType: 'text/html;profile=mcp-app',
          text: loadHtml('game-videos-app.html'),
        },
      ],
    })
  );

  registerAppResource(
    server,
    'Meme Hooks Gallery',
    'ui://ssemble/meme-hooks-app.html',
    {
      description: 'Interactive gallery of meme hook clips with preview images',
      _meta: {
        ui: {
          csp: {
            resourceDomains: CDN_DOMAINS,
            connectDomains: CDN_DOMAINS,
          },
        },
      },
    },
    async () => ({
      contents: [
        {
          uri: 'ui://ssemble/meme-hooks-app.html',
          mimeType: 'text/html;profile=mcp-app',
          text: loadHtml('meme-hooks-app.html'),
        },
      ],
    })
  );

  registerAppResource(
    server,
    'Shorts Viewer',
    'ui://ssemble/shorts-app.html',
    {
      description: 'Interactive viewer for generated short clips with video player and viral scores',
      _meta: {
        ui: {
          csp: {
            resourceDomains: CDN_DOMAINS,
            connectDomains: CDN_DOMAINS,
          },
        },
      },
    },
    async () => ({
      contents: [
        {
          uri: 'ui://ssemble/shorts-app.html',
          mimeType: 'text/html;profile=mcp-app',
          text: loadHtml('shorts-app.html'),
        },
      ],
    })
  );
}
