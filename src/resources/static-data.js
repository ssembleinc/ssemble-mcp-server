/**
 * MCP Resources — static reference data for AI context.
 */

const SUPPORTED_LANGUAGES = {
  en: 'English', es: 'Spanish', fr: 'French', de: 'German', it: 'Italian',
  pt: 'Portuguese', ru: 'Russian', ja: 'Japanese', ko: 'Korean', zh: 'Chinese',
  ar: 'Arabic', hi: 'Hindi', tr: 'Turkish', pl: 'Polish', nl: 'Dutch',
  sv: 'Swedish', no: 'Norwegian', da: 'Danish', fi: 'Finnish', cs: 'Czech',
};

const PREFERRED_LENGTHS = {
  under30sec: 'Under 30 seconds — quick hook clips',
  under60sec: 'Under 60 seconds (default) — standard TikTok/Reels length',
  under90sec: 'Under 90 seconds — extended shorts',
  under3min: 'Under 3 minutes — YouTube Shorts max',
  under5min: 'Under 5 minutes — longer highlight clips',
  under10min: 'Under 10 minutes — full segment extraction',
};

const LAYOUTS = {
  auto: 'Automatic — AI detects best framing based on speaker position',
  fill: 'Fill — crop to fill 9:16 vertical frame',
  fit: 'Fit — fit entire frame with bars if needed',
  square: 'Square — 1:1 aspect ratio',
};

export function registerResources(server) {
  server.resource(
    'supported-languages',
    'ssemble://supported-languages',
    'List of supported language codes and names for video transcription and captions',
    async () => {
      let text = '## Supported Languages\n\n';
      text += '| Code | Language |\n|------|----------|\n';
      for (const [code, name] of Object.entries(SUPPORTED_LANGUAGES)) {
        text += `| ${code} | ${name} |\n`;
      }
      text += '\nUse the 2-letter code in the `language` or `captionLanguage` parameter.';
      return { contents: [{ uri: 'ssemble://supported-languages', mimeType: 'text/markdown', text }] };
    }
  );

  server.resource(
    'preferred-lengths',
    'ssemble://preferred-lengths',
    'Available clip duration options for the preferredLength parameter',
    async () => {
      let text = '## Preferred Length Options\n\n';
      text += '| Value | Description |\n|-------|-------------|\n';
      for (const [value, desc] of Object.entries(PREFERRED_LENGTHS)) {
        text += `| \`${value}\` | ${desc} |\n`;
      }
      text += '\nDefault: `under60sec`';
      return { contents: [{ uri: 'ssemble://preferred-lengths', mimeType: 'text/markdown', text }] };
    }
  );

  server.resource(
    'layouts',
    'ssemble://layouts',
    'Available video layout/framing options',
    async () => {
      let text = '## Layout Options\n\n';
      text += '| Value | Description |\n|-------|-------------|\n';
      for (const [value, desc] of Object.entries(LAYOUTS)) {
        text += `| \`${value}\` | ${desc} |\n`;
      }
      text += '\nDefault: `auto`';
      return { contents: [{ uri: 'ssemble://layouts', mimeType: 'text/markdown', text }] };
    }
  );
}
