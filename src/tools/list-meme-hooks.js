import { z } from 'zod';
import { formatPaginatedAssets, formatError } from '../utils/format.js';

const schema = {
  page: z.number().min(1).default(1).describe('Page number').optional(),
  limit: z.number().min(1).max(100).default(20).describe('Items per page (1-100)').optional(),
};

export function registerListMemeHooks(server, client) {
  server.tool(
    'list_meme_hooks',
    'List available meme hook clips (2-5 second attention grabbers prepended to shorts). Use the exact memeHookName when creating shorts.',
    schema,
    async (params) => {
      try {
        const result = await client.listMemeHooks(params);
        return { content: [{ type: 'text', text: formatPaginatedAssets(result, 'memeHooks', 'Meme Hooks') }] };
      } catch (error) {
        return { content: [{ type: 'text', text: formatError(error) }], isError: true };
      }
    }
  );
}
