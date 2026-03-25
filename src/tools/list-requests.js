import { z } from 'zod';
import { formatListRequestsResponse, formatError } from '../utils/format.js';

const schema = {
  page: z.number().min(1).default(1).describe('Page number').optional(),
  limit: z.number().min(1).max(100).default(20).describe('Items per page (1-100)').optional(),
  status: z.enum(['queued', 'processing', 'completed', 'failed', 'cancelled']).describe('Filter by status').optional(),
  sortBy: z.enum(['createdAt', 'updatedAt']).default('createdAt').describe('Sort field').optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc').describe('Sort direction').optional(),
};

export function registerListRequests(server, client) {
  server.tool(
    'list_requests',
    'List all short creation requests with optional status filtering, pagination, and sorting.',
    schema,
    async (params) => {
      try {
        const result = await client.listRequests(params);
        return { content: [{ type: 'text', text: formatListRequestsResponse(result) }] };
      } catch (error) {
        return { content: [{ type: 'text', text: formatError(error) }], isError: true };
      }
    }
  );
}
