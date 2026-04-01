import { App } from '@modelcontextprotocol/ext-apps';

const appEl = document.getElementById('app');
const app = new App({ name: 'Ssemble Templates', version: '1.0.0' });

let selectedTemplateId = null;
let cachedData = null;

function render(data) {
  if (!data || !data.templates) {
    appEl.innerHTML = '<div class="loading">No template data received.</div>';
    return;
  }

  cachedData = data;
  const { templates, defaultTemplateId } = data;

  let html = `<h2>Caption Templates (${templates.length})</h2>`;
  html += '<div class="grid">';

  templates.forEach((t) => {
    const isDefault = t.templateId === defaultTemplateId;
    const isSelected = t.templateId === selectedTemplateId;
    const classes = ['card'];
    if (isDefault && !isSelected) classes.push('default');
    if (isSelected) classes.push('selected');

    const imgSrc = t.preview || t.gif || '';
    const imgTag = imgSrc
      ? `<img src="${imgSrc}" alt="${t.displayName}" loading="lazy" />`
      : `<div class="placeholder">No preview</div>`;

    html += `<div class="${classes.join(' ')}" data-id="${t.templateId}" data-name="${t.name}">
      ${imgTag}
      <div class="card-label">
        ${t.displayName}${isDefault ? '<span class="badge">default</span>' : ''}
      </div>
    </div>`;
  });

  html += '</div>';

  if (selectedTemplateId) {
    const sel = templates.find((t) => t.templateId === selectedTemplateId);
    if (sel) {
      html += `<div class="selected-info">
        Selected: <strong>${sel.displayName}</strong> — templateId: <code>${sel.templateId}</code>
      </div>`;
    }
  }

  appEl.innerHTML = html;

  appEl.querySelectorAll('.card').forEach((card) => {
    card.addEventListener('click', () => {
      selectedTemplateId = card.dataset.id;
      render(cachedData);
      app.updateModelContext({
        text: `User selected template: ${card.dataset.name} (templateId: ${card.dataset.id}). Use this templateId when creating shorts.`,
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
