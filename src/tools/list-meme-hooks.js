import { z } from 'zod';
import { registerAppTool } from '@modelcontextprotocol/ext-apps/server';
import { formatPaginatedAssets, formatError } from '../utils/format.js';

const schema = {
  page: z.number().min(1).default(1).describe('Page number').optional(),
  limit: z.number().min(1).max(100).default(20).describe('Items per page (1-100)').optional(),
};

export function registerListMemeHooks(server, client) {
  registerAppTool(
    server,
    'list_meme_hooks',
    {
      title: 'List Meme Hooks',
      description:
        'List available meme hook clips (2-5 second attention grabbers prepended to shorts). Use the exact memeHookName when creating shorts.',
      inputSchema: schema,
      _meta: {
        ui: { resourceUri: 'ui://ssemble/meme-hooks-app.html' },
      },
    },
    async (params) => {
      try {
        const result = await client.listMemeHooks(params);
        const textFallback = formatPaginatedAssets(result, 'memeHooks', 'Meme Hooks');

        const items = result.data?.memeHooks || [];
        const pagination = result.data?.pagination || {};
        const structuredContent = {
          memeHooks: items.map((h) => ({
            name: h.name,
            preview: h.preview || '',
            video: h.video || '',
            video_duration: h.video_duration || 0,
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
