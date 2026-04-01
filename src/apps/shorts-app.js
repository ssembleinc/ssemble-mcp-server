import { App } from '@modelcontextprotocol/ext-apps';

const appEl = document.getElementById('app');
const app = new App({ name: 'Ssemble Shorts', version: '1.0.0' });

function scoreClass(score) {
  if (score >= 80) return 'high';
  if (score >= 50) return 'medium';
  return 'low';
}

function render(data) {
  if (!data || !data.shorts) {
    appEl.innerHTML = '<div class="loading">No shorts data received.</div>';
    return;
  }

  const { shorts, title, url, start, end, language, template } = data;

  if (shorts.length === 0) {
    appEl.innerHTML = '<div class="no-clips">No clips were generated for this request.</div>';
    return;
  }

  // Sort by viral score descending
  const sorted = [...shorts].sort((a, b) => (b.viral_score || 0) - (a.viral_score || 0));

  let html = `<h2>Generated Shorts${title ? ` — ${title}` : ''}</h2>`;
  html += '<div class="source-info">';
  if (url) html += `Source: ${url}<br>`;
  if (start != null && end != null) html += `Time range: ${start}s – ${end}s &nbsp;|&nbsp; `;
  if (language) html += `Language: ${language} &nbsp;|&nbsp; `;
  if (template) html += `Template: ${template}`;
  html += '</div>';

  html += '<div class="clips-grid">';

  sorted.forEach((clip, i) => {
    const score = clip.viral_score != null ? clip.viral_score : 0;
    const cls = scoreClass(score);

    if (clip.error && !clip.video_url) {
      html += `<div class="clip-card">
        <div class="clip-error">Clip failed to generate</div>
        <div class="clip-body">
          <div class="clip-title">${clip.title || 'Untitled'}</div>
        </div>
      </div>`;
      return;
    }

    html += `<div class="clip-card">
      <video src="${clip.video_url}" preload="metadata" controls playsinline></video>
      <div class="clip-body">
        <div class="clip-meta">
          <span class="rank">#${i + 1}</span>
          ${clip.duration ? `<span class="badge badge-duration">${Math.round(clip.duration)}s</span>` : ''}
          <span class="badge badge-score ${cls}">Viral: ${score}</span>
        </div>
        <div class="viral-bar"><div class="viral-fill ${cls}" style="width:${score}%"></div></div>
        <div class="clip-title">${clip.title || 'Untitled'}</div>
        ${clip.description ? `<div class="clip-desc">${clip.description}</div>` : ''}
        <div class="clip-actions">
          <button class="btn btn-primary download-btn" data-url="${clip.video_url}" data-title="${(clip.title || 'short').replace(/"/g, '')}">Download</button>
        </div>
      </div>
    </div>`;
  });

  html += '</div>';
  appEl.innerHTML = html;

  // Download buttons
  appEl.querySelectorAll('.download-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const videoUrl = btn.dataset.url;
      app.openLink({ url: videoUrl }).catch(() => {
        // Fallback: anchor tag click
        const a = document.createElement('a');
        a.href = videoUrl;
        a.target = '_blank';
        a.rel = 'noopener';
        document.body.appendChild(a);
        a.click();
        a.remove();
      });
    });
  });

}

app.ontoolresult = (result) => {
  const data = result.structuredContent || null;
  if (data) {
    render(data);
  } else {
    appEl.innerHTML = '<div class="loading">No structured data available.</div>';
  }
};

app.connect();
