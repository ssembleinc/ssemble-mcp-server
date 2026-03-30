import { z } from 'zod';
import { formatCreateShortResponse, formatError } from '../utils/format.js';

const SUPPORTED_LANGUAGES = [
  'en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh',
  'ar', 'hi', 'tr', 'pl', 'nl', 'sv', 'no', 'da', 'fi', 'cs',
];

const schema = {
  url: z.string().describe('YouTube video URL').optional(),
  fileUrl: z.string().url().describe('Public video file URL (alternative to url)').optional(),
  start: z.number().min(0).describe('Start time in seconds (>= 0)'),
  end: z.number().min(1).describe('End time in seconds (> start, max 1200s window)'),
  preferredLength: z.enum(['under30sec', 'under60sec', 'under90sec', 'under3min', 'under5min', 'under10min'])
    .default('under60sec').describe('Target clip duration').optional(),
  language: z.enum(SUPPORTED_LANGUAGES).default('en').describe('Spoken language (ISO 639-1)').optional(),
  captionLanguage: z.enum(SUPPORTED_LANGUAGES).describe('Caption language if different from spoken').optional(),
  templateId: z.string().regex(/^[0-9a-fA-F]{24}$/).describe('Caption template ID from list_templates (24-char hex)').optional(),
  noClipping: z.boolean().default(false).describe('Skip AI clipping, process entire range as one clip').optional(),
  hookTitle: z.boolean().default(false).describe('Add animated hook title at start').optional(),
  memeHook: z.boolean().default(false).describe('Prepend a meme hook clip (2-5s attention grabber)').optional(),
  memeHookName: z.string().describe('Exact meme hook name from list_meme_hooks (case-sensitive)').optional(),
  gameVideo: z.boolean().default(false).describe('Add split-screen gameplay overlay').optional(),
  gameVideoName: z.string().describe('Exact game video name from list_game_videos (case-sensitive)').optional(),
  ctaEnabled: z.boolean().default(false).describe('Show call-to-action text overlay').optional(),
  ctaText: z.string().max(200).describe('CTA text (max 200 chars, required when ctaEnabled=true)').optional(),
  music: z.boolean().default(false).describe('Add background music').optional(),
  musicName: z.string().describe('Exact track name from list_music (case-sensitive)').optional(),
  musicVolume: z.number().min(0).max(100).default(10).describe('Music volume 0-100').optional(),
  layout: z.enum(['auto', 'fill', 'fit', 'square']).default('auto').describe('Video framing layout').optional(),
  webhookUrl: z.string().url().describe('Optional webhook URL for completion/failure notifications. Receives a POST with results when processing finishes.').optional(),
};

export function registerCreateShort(server, client) {
  server.tool(
    'create_short',
    'Create AI-generated short-form video clips from a YouTube video or uploaded file. Returns a request ID instantly. Processing takes 5-30 minutes. Costs 1 credit.',
    schema,
    async (params) => {
      if (!params.url && !params.fileUrl) {
        return { content: [{ type: 'text', text: formatError({ message: 'Either url or fileUrl is required', code: 'invalid_request' }) }], isError: true };
      }
      if (params.url && params.fileUrl) {
        return { content: [{ type: 'text', text: formatError({ message: 'Provide either url or fileUrl, not both', code: 'invalid_request' }) }], isError: true };
      }
      if (params.start >= params.end) {
        return { content: [{ type: 'text', text: formatError({ message: 'Start time must be less than end time', code: 'invalid_request' }) }], isError: true };
      }
      if ((params.end - params.start) > 1200) {
        return { content: [{ type: 'text', text: formatError({ message: 'Time window exceeds maximum of 1200 seconds (20 minutes)', code: 'invalid_request' }) }], isError: true };
      }
      if (params.ctaEnabled && !params.ctaText) {
        return { content: [{ type: 'text', text: formatError({ message: 'ctaText is required when ctaEnabled is true', code: 'invalid_request' }) }], isError: true };
      }

      try {
        const result = await client.createShort(params);
        return { content: [{ type: 'text', text: formatCreateShortResponse(result) }] };
      } catch (error) {
        return { content: [{ type: 'text', text: formatError(error) }], isError: true };
      }
    }
  );
}
