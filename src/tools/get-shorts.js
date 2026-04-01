import { z } from 'zod';
import { registerAppTool } from '@modelcontextprotocol/ext-apps/server';
import { formatShortsResponse, formatError } from '../utils/format.js';

const schema = {
  requestId: z.string().regex(/^[0-9a-fA-F]{24}$/).describe('The request ID from create_short (24-char hex)'),
};

export function registerGetShorts(server, client) {
  registerAppTool(
    server,
    'get_shorts',
    {
      title: 'Get Shorts',
      description:
        'Retrieve all generated short clips for a completed request. Returns video URLs, AI-generated titles, descriptions, viral scores, and durations sorted by viral score.',
      inputSchema: schema,
      _meta: {
        ui: { resourceUri: 'ui://ssemble/shorts-app.html' },
      },
    },
    async ({ requestId }) => {
      try {
        const result = await client.getShorts(requestId);
        const textFallback = formatShortsResponse(result);
        const d = result.data;

        const structuredContent = {
          title: d.title || '',
          url: d.url || '',
          start: d.start,
          end: d.end,
          language: d.language || '',
          template: d.template || '',
          shorts: (d.shorts || []).map((s) => ({
            title: s.title || '',
            description: s.description || '',
            duration: s.duration || 0,
            viral_score: s.viral_score != null ? s.viral_score : 0,
            video_url: s.video_url || '',
            error: !!s.error,
          })),
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
