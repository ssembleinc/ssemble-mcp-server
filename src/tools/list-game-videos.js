import { z } from 'zod';
import { registerAppTool } from '@modelcontextprotocol/ext-apps/server';
import { formatPaginatedAssets, formatError } from '../utils/format.js';

const schema = {
  page: z.number().min(1).default(1).describe('Page number').optional(),
  limit: z.number().min(1).max(100).default(20).describe('Items per page (1-100)').optional(),
};

export function registerListGameVideos(server, client) {
  registerAppTool(
    server,
    'list_game_videos',
    {
      title: 'List Game Videos',
      description:
        'List available gameplay videos for split-screen overlays (content top, game bottom). Use the exact gameVideoName when creating shorts.',
      inputSchema: schema,
      _meta: {
        ui: { resourceUri: 'ui://ssemble/game-videos-app.html' },
      },
    },
    async (params) => {
      try {
        const result = await client.listGameVideos(params);
        const textFallback = formatPaginatedAssets(result, 'gameVideos', 'Gameplay Overlays');

        const items = result.data?.gameVideos || [];
        const pagination = result.data?.pagination || {};
        const structuredContent = {
          gameVideos: items.map((g) => ({
            name: g.name,
            preview: g.preview || '',
            video: g.video || '',
            video_duration: g.video_duration || 0,
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
