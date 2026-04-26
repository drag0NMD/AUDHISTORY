function formatTime(seconds) {
  const s = Math.floor(seconds || 0);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = String(s % 60).padStart(2, '0');
  const mm = String(m).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildCard(entry) {
  const pct = entry.duration > 0 ? Math.min(100, (entry.currentTime / entry.duration) * 100).toFixed(1) : 0;

  let thumbHtml;
  if (entry.type === 'video' && entry.thumbnail) {
    thumbHtml = `<img src="${entry.thumbnail}" alt="" loading="lazy">`;
  } else {
    thumbHtml = `<span class="audio-icon">${entry.type === 'video' ? '▶' : '◈'}</span>`;
  }

  const card = document.createElement('div');
  card.className = 'card';
  card.dataset.id   = entry.id;
  card.dataset.url  = entry.url;
  card.dataset.time = entry.currentTime;

  card.innerHTML = `
    <div class="card-body">
      <div class="card-thumb">${thumbHtml}</div>
      <div class="card-info">
        <div class="card-title">${escapeHtml(entry.title || entry.url)}</div>
        <div class="card-domain">${escapeHtml(entry.domain)}</div>
      </div>
      <button class="card-delete" title="Удалить">✕</button>
    </div>
    <div class="card-footer">
      <div class="progress-wrap">
        <div class="progress-bar">
          <div class="progress-fill" style="width:${pct}%"></div>
        </div>
        <span class="progress-text">${formatTime(entry.currentTime)} / ${formatTime(entry.duration)}</span>
      </div>
    </div>
  `;

  return card;
}

let allEntries = [];

function render(entries) {
  const feed = document.getElementById('feed');
  document.getElementById('count').textContent = `[${entries.length} записей]`;

  feed.innerHTML = '';

  if (entries.length === 0) {
    feed.innerHTML = '<div class="empty">// нет отслеженных медиа</div>';
    return;
  }

  const frag = document.createDocumentFragment();
  entries.forEach(e => frag.appendChild(buildCard(e)));
  feed.appendChild(frag);
}

function filterEntries(q) {
  if (!q) return allEntries;
  const low = q.toLowerCase();
  return allEntries.filter(e =>
    (e.title || '').toLowerCase().includes(low) ||
    (e.domain || '').toLowerCase().includes(low)
  );
}

async function load() {
  // Читаем storage напрямую — sendMessage к service worker в MV3 может упасть если воркер спит
  const r = await chrome.storage.local.get('audhistory_entries');
  allEntries = r.audhistory_entries || [];
  render(allEntries);
}

document.getElementById('search').addEventListener('input', e => {
  render(filterEntries(e.target.value.trim()));
});

document.getElementById('settings-btn').addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
});

document.getElementById('clear-all').addEventListener('click', async () => {
  if (!confirm('Удалить все записи?')) return;
  await chrome.storage.local.set({ audhistory_entries: [] });
  allEntries = [];
  render([]);
});

document.getElementById('export-json').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(allEntries, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `audhistory_${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
});

document.getElementById('feed').addEventListener('click', async e => {
  const del = e.target.closest('.card-delete');
  if (del) {
    e.stopPropagation();
    const card = del.closest('.card');
    const { id } = card.dataset;
    allEntries = allEntries.filter(entry => entry.id !== id);
    await chrome.storage.local.set({ audhistory_entries: allEntries });
    render(filterEntries(document.getElementById('search').value.trim()));
    return;
  }

  const card = e.target.closest('.card');
  if (!card) return;

  const url = card.dataset.url;
  const currentTime = parseFloat(card.dataset.time) || 0;

  const tabs = await chrome.tabs.query({});
  const match = tabs.find(t => t.url === url || t.url?.startsWith(url.split('#')[0]));

  if (match) {
    await chrome.tabs.update(match.id, { active: true });
    await chrome.windows.update(match.windowId, { focused: true });
    return;
  }

  let openUrl = url;
  if (currentTime > 5) {
    try {
      const u = new URL(url);
      if (u.hostname.includes('youtube.com')) {
        u.searchParams.set('t', String(Math.floor(currentTime)));
        openUrl = u.toString();
      } else {
        openUrl = url.split('#')[0] + '#t=' + Math.floor(currentTime);
      }
    } catch { /* некорректный URL — открываем как есть */ }
  }

  await chrome.tabs.create({ url: openUrl });
});

load();
