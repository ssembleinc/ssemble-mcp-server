import { registerAppTool } from '@modelcontextprotocol/ext-apps/server';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { formatError, formatRateLimits } from '../utils/format.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const THUMB_DIR = join(__dirname, '..', 'assets', 'thumbnails');

function loadThumbnail(templateName) {
  try {
    const data = readFileSync(join(THUMB_DIR, `${templateName}.jpg`));
    return { data: data.toString('base64'), mimeType: 'image/jpeg' };
  } catch {
    return null;
  }
}

export function registerListTemplates(server, client) {
  registerAppTool(
    server,
    'list_templates',
    {
      title: 'List Templates',
      description:
        'List all available caption style templates with preview thumbnails, names, and IDs. Use the templateId when creating shorts.',
      _meta: {
        ui: { resourceUri: 'ui://ssemble/templates-app.html' },
      },
    },
    async () => {
      try {
        const result = await client.listTemplates();
        const d = result.data;
        const templates = d.templates || [];

        // Text + image content for non-app clients (Claude Code, Cursor, etc.)
        const content = [];
        content.push({
          type: 'text',
          text: `## Caption Templates (${templates.length} available)\n`,
        });

        templates.forEach((t) => {
          const isDefault = t.templateId === d.defaultTemplateId;
          const thumb = loadThumbnail(t.name);
          if (thumb) {
            content.push({ type: 'image', data: thumb.data, mimeType: thumb.mimeType });
          }
          const label = `**${t.displayName || t.name}**${isDefault ? ' _(default)_' : ''}`;
          content.push({ type: 'text', text: label });
        });

        let footer = `\nUse the \`templateId\` field when calling \`create_short\` to pick a style.`;
        footer += formatRateLimits(result.rateLimits);
        content.push({ type: 'text', text: footer });

        // Structured content for the MCP App
        const structuredContent = {
          templates: templates.map((t) => ({
            templateId: t.templateId,
            name: t.name,
            displayName: t.displayName || t.name,
            gif: t.gif || '',
            preview: t.preview || '',
          })),
          defaultTemplateId: d.defaultTemplateId,
        };

        return { content, structuredContent };
      } catch (error) {
        return { content: [{ type: 'text', text: formatError(error) }], isError: true };
      }
    }
  );
}
