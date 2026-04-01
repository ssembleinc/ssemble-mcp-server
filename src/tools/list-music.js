import { z } from 'zod';
import { registerAppTool } from '@modelcontextprotocol/ext-apps/server';
import { formatPaginatedAssets, formatError } from '../utils/format.js';

const schema = {
  page: z.number().min(1).default(1).describe('Page number').optional(),
  limit: z.number().min(1).max(100).default(20).describe('Items per page (1-100)').optional(),
};

export function registerListMusic(server, client) {
  registerAppTool(
    server,
    'list_music',
    {
      title: 'List Music',
      description:
        'List available background music tracks with names and durations. Use the exact musicName when creating shorts.',
      inputSchema: schema,
      _meta: {
        ui: { resourceUri: 'ui://ssemble/music-app.html' },
      },
    },
    async (params) => {
      try {
        const result = await client.listMusic(params);
        const textFallback = formatPaginatedAssets(result, 'music', 'Background Music');

        // Structured content for the MCP App
        const items = result.data?.music || [];
        const pagination = result.data?.pagination || {};
        const structuredContent = {
          music: items.map((t) => ({
            name: t.name,
            duration: t.duration,
            url: t.url || '',
          })),
          pagination: {
            page: pagination.page || 1,
            totalPages: pagination.totalPages || 1,
            totalCount: pagination.totalCount || items.length,
          },
        };

        return {
          content: [{ type: 'text', text: textFallback }],
          structuredContent,
        };
      } catch (error) {
        return { content: [{ type: 'text', text: formatError(error) }], isError: true };
      }
    }
  );
}
