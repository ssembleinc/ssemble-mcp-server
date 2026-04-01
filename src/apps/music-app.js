import { App } from '@modelcontextprotocol/ext-apps';

const appEl = document.getElementById('app');
const app = new App({ name: 'Ssemble Music', version: '1.0.0' });

let currentAudio = null;
let currentTrackName = null;
let selectedTrackName = null;
let animFrameId = null;
let cachedData = null;

function formatDuration(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function safeId(name) {
  return name.replace(/[^a-zA-Z0-9]/g, '-');
}

function render(data) {
  if (!data || !data.music) {
    appEl.innerHTML = '<div class="loading">No music data received.</div>';
    return;
  }

  cachedData = data;
  const { music, pagination } = data;

  let html = `<h2>Background Music (${pagination.totalCount} tracks)</h2>`;

  music.forEach((track) => {
    const isPlaying = currentTrackName === track.name && currentAudio && !currentAudio.paused;
    const isSelected = selectedTrackName === track.name;
    const classes = ['track'];
    if (isPlaying) classes.push('playing');
    if (isSelected) classes.push('selected');
    const hasUrl = !!track.url;

    html += `<div class="${classes.join(' ')}" data-name="${track.name}" data-url="${track.url || ''}">
      <button class="play-btn" data-name="${track.name}" data-url="${track.url || ''}" ${!hasUrl ? 'disabled' : ''}>
        ${isPlaying ? '&#9646;&#9646;' : '&#9654;'}
      </button>
      <div class="track-info">
        <div class="track-name">${track.name}</div>
        <div class="track-duration">${formatDuration(track.duration)}</div>
        <div class="progress-bar">
          <div class="progress-fill" id="progress-${safeId(track.name)}"></div>
        </div>
      </div>
    </div>`;
  });

  if (pagination.totalPages > 1) {
    html += `<div class="pagination">
      <button id="prev-btn" ${pagination.page <= 1 ? 'disabled' : ''}>Previous</button>
      <span class="page-info">Page ${pagination.page} / ${pagination.totalPages}</span>
      <button id="next-btn" ${pagination.page >= pagination.totalPages ? 'disabled' : ''}>Next</button>
    </div>`;
  }

  appEl.innerHTML = html;

  appEl.querySelectorAll('.play-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      togglePlay(btn.dataset.name, btn.dataset.url);
    });
  });

  appEl.querySelectorAll('.track').forEach((el) => {
    el.addEventListener('click', () => {
      selectedTrackName = el.dataset.name;
      render(cachedData);
      app.updateModelContext({
        text: `User selected music track: "${el.dataset.name}". Use this exact musicName when creating shorts.`,
      });
    });
  });

  const prevBtn = document.getElementById('prev-btn');
  const nextBtn = document.getElementById('next-btn');
  if (prevBtn) prevBtn.addEventListener('click', () => loadPage(pagination.page - 1));
  if (nextBtn) nextBtn.addEventListener('click', () => loadPage(pagination.page + 1));

  updateProgress();
}

function togglePlay(trackName, url) {
  if (currentTrackName === trackName && currentAudio) {
    if (currentAudio.paused) {
      currentAudio.play();
    } else {
      currentAudio.pause();
    }
    render(cachedData);
    return;
  }

  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
    cancelAnimationFrame(animFrameId);
  }

  if (!url) return;

  currentTrackName = trackName;
  currentAudio = new Audio(url);
  currentAudio.play();
  currentAudio.addEventListener('ended', () => {
    currentTrackName = null;
    currentAudio = null;
    cancelAnimationFrame(animFrameId);
    render(cachedData);
  });

  render(cachedData);
}

function updateProgress() {
  if (currentAudio && currentTrackName && !currentAudio.paused) {
    const pct = (currentAudio.currentTime / currentAudio.duration) * 100;
    const bar = document.getElementById(`progress-${safeId(currentTrackName)}`);
    if (bar) bar.style.width = `${pct}%`;
    animFrameId = requestAnimationFrame(updateProgress);
  }
}

async function loadPage(page) {
  appEl.innerHTML = '<div class="loading">Loading...</div>';
  try {
    const result = await app.callServerTool({ name: 'list_music', arguments: { page, limit: 20 } });
    const data = result.structuredContent || null;
    if (data) render(data);
  } catch (err) {
    appEl.innerHTML = `<div class="loading">Error: ${err.message}</div>`;
  }
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
