import { z } from 'zod';
import { formatShortsResponse, formatError } from '../utils/format.js';

const schema = {
  requestId: z.string().regex(/^[0-9a-fA-F]{24}$/).describe('The request ID from create_short (24-char hex)'),
};

export function registerGetShorts(server, client) {
  server.tool(
    'get_shorts',
    'Retrieve all generated short clips for a completed request. Returns video URLs, AI-generated titles, descriptions, viral scores, and durations sorted by viral score.',
    schema,
    async ({ requestId }) => {
      try {
        const result = await client.getShorts(requestId);
        return { content: [{ type: 'text', text: formatShortsResponse(result) }] };
      } catch (error) {
        return { content: [{ type: 'text', text: formatError(error) }], isError: true };
      }
    }
  );
}
