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
