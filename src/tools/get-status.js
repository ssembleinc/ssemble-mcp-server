import { z } from 'zod';
import { formatStatusResponse, formatError } from '../utils/format.js';

const schema = {
  requestId: z.string().regex(/^[0-9a-fA-F]{24}$/).describe('The request ID from create_short (24-char hex)'),
};

export function registerGetStatus(server, client) {
  server.tool(
    'get_status',
    'Check processing status and progress of a short creation request. Returns status (queued/processing/completed/failed), progress percentage, and current step.',
    schema,
    async ({ requestId }) => {
      try {
        const result = await client.getStatus(requestId);
        return { content: [{ type: 'text', text: formatStatusResponse(result) }] };
      } catch (error) {
        return { content: [{ type: 'text', text: formatError(error) }], isError: true };
      }
    }
  );
}
