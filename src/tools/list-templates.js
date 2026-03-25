import { formatTemplatesResponse, formatError } from '../utils/format.js';

export function registerListTemplates(server, client) {
  server.tool(
    'list_templates',
    'List all available caption style templates with IDs and names. Use the templateId when creating shorts.',
    {},
    async () => {
      try {
        const result = await client.listTemplates();
        return { content: [{ type: 'text', text: formatTemplatesResponse(result) }] };
      } catch (error) {
        return { content: [{ type: 'text', text: formatError(error) }], isError: true };
      }
    }
  );
}
