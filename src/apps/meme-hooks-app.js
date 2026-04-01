import { App } from '@modelcontextprotocol/ext-apps';

const appEl = document.getElementById('app');
const app = new App({ name: 'Ssemble Meme Hooks', version: '1.0.0' });

let selectedName = null;
let cachedData = null;

function render(data) {
  if (!data || !data.memeHooks) {
    appEl.innerHTML = '<div class="loading">No meme hook data received.</div>';
    return;
  }

  cachedData = data;
  const { memeHooks, pagination } = data;

  let html = `<h2>Meme Hooks (${pagination.totalCount} clips)</h2>`;
  html += '<div class="grid">';

  memeHooks.forEach((h) => {
    const isSelected = selectedName === h.name;
    const classes = ['card'];
    if (isSelected) classes.push('selected');

    const imgSrc = h.preview || '';
    const imgTag = imgSrc
      ? `<img src="${imgSrc}" alt="${h.name}" loading="lazy" />`
      : `<div class="placeholder">No preview</div>`;

    const dur = h.video_duration ? `${Math.round(h.video_duration)}s` : '';

    html += `<div class="${classes.join(' ')}" data-name="${h.name}">
      ${imgTag}
      <div class="card-label">${h.name}${dur ? `<span class="duration-badge">${dur}</span>` : ''}</div>
    </div>`;
  });

  html += '</div>';

  if (selectedName) {
    const sel = memeHooks.find((h) => h.name === selectedName);
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
        text: `User selected meme hook: "${card.dataset.name}". Use this exact memeHookName when creating shorts with memeHook: true.`,
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
    const result = await app.callServerTool({ name: 'list_meme_hooks', arguments: { page, limit: 20 } });
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
