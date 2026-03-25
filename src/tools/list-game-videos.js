import { z } from 'zod';
import { formatPaginatedAssets, formatError } from '../utils/format.js';

const schema = {
  page: z.number().min(1).default(1).describe('Page number').optional(),
  limit: z.number().min(1).max(100).default(20).describe('Items per page (1-100)').optional(),
};

export function registerListGameVideos(server, client) {
  server.tool(
    'list_game_videos',
    'List available gameplay videos for split-screen overlays (content top, game bottom). Use the exact gameVideoName when creating shorts.',
    schema,
    async (params) => {
      try {
        const result = await client.listGameVideos(params);
        return { content: [{ type: 'text', text: formatPaginatedAssets(result, 'gameVideos', 'Gameplay Overlays') }] };
      } catch (error) {
        return { content: [{ type: 'text', text: formatError(error) }], isError: true };
      }
    }
  );
}
