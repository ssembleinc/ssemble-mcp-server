import { z } from 'zod';
import { formatDeleteResponse, formatError } from '../utils/format.js';

const schema = {
  requestId: z.string().regex(/^[0-9a-fA-F]{24}$/).describe('The request ID to delete (24-char hex). This action is irreversible and credits are NOT refunded.'),
};

export function registerDeleteRequest(server, client) {
  server.tool(
    'delete_request',
    'Permanently delete a short creation request and all generated videos. Credits are NOT refunded. This action is irreversible.',
    schema,
    async ({ requestId }) => {
      try {
        const result = await client.deleteRequest(requestId);
        return { content: [{ type: 'text', text: formatDeleteResponse(result) }] };
      } catch (error) {
        return { content: [{ type: 'text', text: formatError(error) }], isError: true };
      }
    }
  );
}
