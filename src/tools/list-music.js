import { z } from 'zod';
import { formatPaginatedAssets, formatError } from '../utils/format.js';

const schema = {
  page: z.number().min(1).default(1).describe('Page number').optional(),
  limit: z.number().min(1).max(100).default(20).describe('Items per page (1-100)').optional(),
};

export function registerListMusic(server, client) {
  server.tool(
    'list_music',
    'List available background music tracks with names and durations. Use the exact musicName when creating shorts.',
    schema,
    async (params) => {
      try {
        const result = await client.listMusic(params);
        return { content: [{ type: 'text', text: formatPaginatedAssets(result, 'music', 'Background Music') }] };
      } catch (error) {
        return { content: [{ type: 'text', text: formatError(error) }], isError: true };
      }
    }
  );
}
