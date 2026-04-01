import { App } from '@modelcontextprotocol/ext-apps';

const appEl = document.getElementById('app');
const app = new App({ name: 'Ssemble Game Videos', version: '1.0.0' });

let selectedName = null;
let cachedData = null;

function formatDuration(seconds) {
  if (!seconds) return '';
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function render(data) {
  if (!data || !data.gameVideos) {
    appEl.innerHTML = '<div class="loading">No game video data received.</div>';
    return;
  }

  cachedData = data;
  const { gameVideos, pagination } = data;

  let html = `<h2>Gameplay Overlays (${pagination.totalCount} videos)</h2>`;
  html += '<div class="grid">';

  gameVideos.forEach((g) => {
    const isSelected = selectedName === g.name;
    const classes = ['card'];
    if (isSelected) classes.push('selected');

    const imgSrc = g.preview || '';
    const imgTag = imgSrc
      ? `<img src="${imgSrc}" alt="${g.name}" loading="lazy" />`
      : `<div class="placeholder">No preview</div>`;

    const duration = g.video_duration ? formatDuration(g.video_duration) : '';

    html += `<div class="${classes.join(' ')}" data-name="${g.name}">
      ${imgTag}
      <div class="card-label">${g.name}</div>
      ${duration ? `<div class="card-meta">${duration}</div>` : ''}
    </div>`;
  });

  html += '</div>';

  if (selectedName) {
    const sel = gameVideos.find((g) => g.name === selectedName);
    if (sel) {
      html += `<div class="selected-info">Selected: <strong>${sel.name}</strong></div>`;
    }
  }

  if (pagination.totalPages > 1) {
    html += `<div class="pagination">
      <button id="prev-btn" ${pagination.page <= 1 ? 'disabled' : ''}>Previous</button>
      <span class="page-info">Page ${pagination.page} / ${pagination.totalPages}</span>
      <button id="next-btn" ${pagination.page >= pagination.totalPages ? 'disabled' : ''}>Next</button>
    </div>`;
  }

  appEl.innerHTML = html;

  appEl.querySelectorAll('.card').forEach((card) => {
    card.addEventListener('click', () => {
      selectedName = card.dataset.name;
      render(cachedData);
      app.updateModelContext({
        text: `User selected game video: "${card.dataset.name}". Use this exact gameVideoName when creating shorts with gameVideo: true.`,
      });
    });
  });

  const prevBtn = document.getElementById('prev-btn');
  const nextBtn = document.getElementById('next-btn');
  if (prevBtn) prevBtn.addEventListener('click', () => loadPage(pagination.page - 1));
  if (nextBtn) nextBtn.addEventListener('click', () => loadPage(pagination.page + 1));
}

async function loadPage(page) {
  appEl.innerHTML = '<div class="loading">Loading...</div>';
  try {
    const result = await app.callServerTool({ name: 'list_game_videos', arguments: { page, limit: 20 } });
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
