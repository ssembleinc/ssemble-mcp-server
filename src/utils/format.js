/**
 * Response formatting utilities for AI readability.
 * Converts API responses into markdown that AI assistants can present clearly.
 */

export function formatRateLimits(rateLimits) {
  if (!rateLimits || !rateLimits.hourlyRemaining) return '';
  return `\n\n---\nRate limits: ${rateLimits.hourlyRemaining}/${rateLimits.hourlyLimit} hourly, ${rateLimits.dailyRemaining}/${rateLimits.dailyLimit} daily`;
}

export function formatCreateShortResponse(result) {
  const d = result.data;
  let text = `## Short Creation Submitted\n\n`;
  text += `- **Request ID**: \`${d.requestId}\`\n`;
  text += `- **Status**: ${d.status}\n`;
  text += `- **Credits Used**: ${d.creditsUsed}\n`;
  text += `- **Estimated Completion**: ${d.estimatedCompletionTime}\n`;
  text += `\nProcessing takes 5-30 minutes. Use \`get_status\` with request ID \`${d.requestId}\` to check progress.`;

  if (d.timeAdjustment) {
    text += `\n\n**Note**: ${d.timeAdjustment.message}\n`;
    text += `- Original: ${d.timeAdjustment.original.start}s - ${d.timeAdjustment.original.end}s\n`;
    text += `- Adjusted: ${d.timeAdjustment.adjusted.start}s - ${d.timeAdjustment.adjusted.end}s\n`;
    text += `- Video duration: ${d.timeAdjustment.videoDuration}s\n`;
  }

  text += formatRateLimits(result.rateLimits);
  return text;
}

export function formatStatusResponse(result) {
  const d = result.data;
  const progressBar = makeProgressBar(d.progress || 0);

  let text = `## Request Status: \`${d._id}\`\n\n`;
  text += `- **Status**: ${d.status}\n`;
  text += `- **Step**: ${d.step}\n`;
  text += `- **Progress**: ${progressBar} ${d.progress || 0}%\n`;
  if (d.stepMessage) {
    text += `- **Message**: ${d.stepMessage}\n`;
  }
  if (d.failureReason) {
    text += `- **Failure Reason**: ${d.failureReason}\n`;
  }

  if (d.status === 'completed') {
    text += `\nUse \`get_shorts\` with request ID \`${d._id}\` to retrieve the generated clips.`;
  }

  text += formatRateLimits(result.rateLimits);
  return text;
}

export function formatShortsResponse(result) {
  const d = result.data;

  if (d.status !== 'completed' && d.status !== 'TASK_COMPLETE') {
    return `Request \`${d._id}\` is not yet completed (status: ${d.status}). Use \`get_status\` to check progress.`;
  }

  let text = `## Generated Shorts for "${d.title || 'Untitled'}"\n\n`;
  text += `- **Source**: ${d.url || 'uploaded file'}\n`;
  text += `- **Time Range**: ${d.start}s - ${d.end}s\n`;
  text += `- **Language**: ${d.language}\n`;
  text += `- **Template**: ${d.template}\n\n`;

  const shorts = d.shorts || [];
  if (shorts.length === 0) {
    text += `No shorts were generated.\n`;
    return text;
  }

  // Sort by viral_score descending
  const sorted = [...shorts].sort((a, b) => (b.viral_score || 0) - (a.viral_score || 0));

  text += `| # | Title | Duration | Viral Score | Video URL |\n`;
  text += `|---|-------|----------|-------------|----------|\n`;

  sorted.forEach((short, i) => {
    const title = (short.title || 'Untitled').substring(0, 40);
    const duration = short.duration ? `${short.duration}s` : 'N/A';
    const score = short.viral_score != null ? short.viral_score : 'N/A';
    const url = short.video_url || (short.error ? 'Error' : 'Processing...');
    text += `| ${i + 1} | ${title} | ${duration} | ${score} | ${url} |\n`;
  });

  text += `\n**${sorted.length} clips generated**, sorted by viral score.`;
  text += formatRateLimits(result.rateLimits);
  return text;
}

export function formatListRequestsResponse(result) {
  const d = result.data;
  const requests = d.requests || [];
  const p = d.pagination;

  if (requests.length === 0) {
    return `No requests found.${formatRateLimits(result.rateLimits)}`;
  }

  let text = `## Your Requests (Page ${p.page}/${p.totalPages}, ${p.totalCount} total)\n\n`;
  text += `| # | Request ID | Status | Progress | Created | Duration |\n`;
  text += `|---|-----------|--------|----------|---------|----------|\n`;

  requests.forEach((req, i) => {
    const created = req.createdAt ? new Date(req.createdAt).toLocaleDateString() : 'N/A';
    const duration = req.duration ? `${req.duration}s` : 'N/A';
    text += `| ${(p.page - 1) * p.limit + i + 1} | \`${req.requestId}\` | ${req.status} | ${req.progress || 0}% | ${created} | ${duration} |\n`;
  });

  if (p.totalPages > 1) {
    text += `\nPage ${p.page} of ${p.totalPages}. Use \`page\` parameter to browse more.`;
  }

  text += formatRateLimits(result.rateLimits);
  return text;
}

export function formatTemplatesResponse(result) {
  const d = result.data;
  const templates = d.templates || [];

  let text = `## Caption Templates (${templates.length} available)\n\n`;
  text += `| Template ID | Name | Default |\n`;
  text += `|-------------|------|--------|\n`;

  templates.forEach((t) => {
    const isDefault = t.templateId === d.defaultTemplateId ? 'Yes' : '';
    text += `| \`${t.templateId}\` | ${t.displayName || t.name} | ${isDefault} |\n`;
  });

  text += `\nDefault template: **${d.defaultTemplateName}** (\`${d.defaultTemplateId}\`)`;
  text += `\nUse \`templateId\` when calling \`create_short\`.`;
  text += formatRateLimits(result.rateLimits);
  return text;
}

export function formatPaginatedAssets(result, assetKey, assetLabel) {
  const d = result.data;
  const items = d[assetKey] || [];
  const p = d.pagination;

  if (items.length === 0) {
    return `No ${assetLabel} found.${formatRateLimits(result.rateLimits)}`;
  }

  const hasUrl = items.some((item) => item.url);
  const hasDuration = items[0]?.duration != null;

  let text = `## ${assetLabel} (Page ${p.page}/${p.totalPages}, ${p.totalCount} total)\n\n`;
  text += `| # | Name |${hasDuration ? ' Duration |' : ''}${hasUrl ? ' Listen |' : ''}\n`;
  text += `|---|------|${hasDuration ? '----------|' : ''}${hasUrl ? '--------|' : ''}\n`;

  items.forEach((item, i) => {
    const num = (p.page - 1) * p.limit + i + 1;
    const durationCol = hasDuration ? ` ${Math.round(item.duration)}s |` : '';
    const listenCol = hasUrl ? ` ${item.url ? `[▶ Play](${item.url})` : ''} |` : '';
    text += `| ${num} | ${item.name} |${durationCol}${listenCol}\n`;
  });

  if (p.totalPages > 1) {
    text += `\nPage ${p.page} of ${p.totalPages}. Use \`page\` parameter to browse more.`;
  }

  text += `\nUse the exact \`name\` value when calling \`create_short\`.`;
  text += formatRateLimits(result.rateLimits);
  return text;
}

export function formatDeleteResponse(result) {
  let text = `Request successfully deleted. Credits are NOT refunded.`;
  text += formatRateLimits(result.rateLimits);
  return text;
}

export function formatError(error) {
  if (error instanceof Error && error.code) {
    let text = `**Error**: ${error.message} (${error.code})`;
    if (error.details) {
      text += `\n\n**Details**: ${JSON.stringify(error.details, null, 2)}`;
    }

    // Add helpful guidance based on error code
    const helpLinks = {
      missing_api_key: '\n\n**Get your API key**: https://app.ssemble.com/api-keys\n**Setup guide**: https://www.npmjs.com/package/@ssemble/mcp-server',
      invalid_api_key: '\n\n**Get a valid API key**: https://app.ssemble.com/api-keys\nAPI keys start with `sk_ssemble_` and are 43 characters long.',
      subscription_required: '\n\n**Subscribe to a plan**: https://app.ssemble.com/pricing\nAn active subscription is required to use the API.',
      insufficient_credits: '\n\n**Get credits**: https://app.ssemble.com/pricing\nEach short creation costs 1 credit.',
      user_not_found: '\n\n**Create an account**: https://app.ssemble.com\nThen generate an API key at https://app.ssemble.com/api-keys',
    };

    if (helpLinks[error.code]) {
      text += helpLinks[error.code];
    }

    if (error.rateLimits?.hourlyRemaining) {
      text += formatRateLimits(error.rateLimits);
    }
    return text;
  }
  return `**Error**: ${error.message || String(error)}`;
}

function makeProgressBar(percent) {
  const filled = Math.round(percent / 10);
  const empty = 10 - filled;
  return '[' + '='.repeat(filled) + ' '.repeat(empty) + ']';
}
