/**
 * MCP Prompts — pre-built workflow templates.
 */

export function registerPrompts(server) {
  server.prompt(
    'create-viral-short',
    'Guided workflow for creating an optimized viral short from a YouTube video',
    [
      { name: 'url', description: 'YouTube video URL', required: true },
      { name: 'style', description: 'Style preference: engaging, educational, funny, dramatic', required: false },
    ],
    ({ url, style }) => {
      const styleHint = style ? `\nThe user prefers a **${style}** style.` : '';
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `I want to create viral short-form clips from this YouTube video: ${url}${styleHint}

Please help me by:
1. First, use \`list_templates\` to show me available caption styles
2. Use \`list_music\` to suggest background music options
3. Ask me which template and music I prefer
4. Then use \`create_short\` with my choices (use start: 0, end: 600 for the first 10 minutes, or ask me for a specific time range)
5. After submitting, remind me to check back with \`get_status\` in a few minutes`,
            },
          },
        ],
      };
    }
  );

  server.prompt(
    'batch-process-videos',
    'Template for processing multiple YouTube videos into shorts',
    [
      { name: 'urls', description: 'Comma-separated YouTube URLs', required: true },
    ],
    ({ urls }) => {
      const urlList = urls.split(',').map((u) => u.trim()).filter(Boolean);
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `I want to create shorts from these ${urlList.length} videos:
${urlList.map((u, i) => `${i + 1}. ${u}`).join('\n')}

Please:
1. Submit each video using \`create_short\` with default settings (start: 0, end: 600, preferredLength: under60sec)
2. Track all request IDs
3. After all are submitted, list the request IDs so I can check on them later with \`get_status\``,
            },
          },
        ],
      };
    }
  );
}
