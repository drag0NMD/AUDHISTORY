const STORAGE_KEY = 'audhistory_entries';
const SETTINGS_KEY = 'audhistory_settings';
const MAX_ENTRIES = 200;

function urlToId(url) {
  try {
    const u = new URL(url);
    const base = u.origin + u.pathname;
    let h = 0;
    for (let i = 0; i < base.length; i++) {
      h = Math.imul(31, h) + base.charCodeAt(i) | 0;
    }
    return String(Math.abs(h));
  } catch {
    return url;
  }
}

function getUrlBase(url) {
  try {
    const u = new URL(url);
    return u.origin + u.pathname;
  } catch {
    return url;
  }
}

async function getEntries() {
  const r = await chrome.storage.local.get(STORAGE_KEY);
  return r[STORAGE_KEY] || [];
}

async function saveEntries(entries) {
  await chrome.storage.local.set({ [STORAGE_KEY]: entries });
}

async function getSettings() {
  const r = await chrome.storage.local.get(SETTINGS_KEY);
  return r[SETTINGS_KEY] || { blacklist: [], minDuration: 30, captureThumb: true };
}

async function upsertEntry(data) {
  const settings = await getSettings();

  if (settings.blacklist.includes(data.domain)) return;
  if (!data.duration || data.duration < settings.minDuration) return;

  const entries = await getEntries();
  const id = urlToId(data.url);
  const idx = entries.findIndex(e => e.id === id);
  const now = Date.now();

  if (idx >= 0) {
    const entry = entries[idx];
    entry.currentTime = data.currentTime;
    entry.duration = data.duration;
    entry.lastUpdated = now;
    if (data.title) entry.title = data.title;
    if (data.thumbnail && settings.captureThumb) entry.thumbnail = data.thumbnail;
    if (data.favicon) entry.favicon = data.favicon;
    entries.splice(idx, 1);
    entries.unshift(entry);
  } else {
    entries.unshift({
      id,
      url: data.url,
      title: data.title || '',
      favicon: data.favicon || '',
      thumbnail: settings.captureThumb ? (data.thumbnail || null) : null,
      type: data.type,
      currentTime: data.currentTime,
      duration: data.duration,
      domain: data.domain,
      lastUpdated: now,
      firstSeen: now,
    });
  }

  if (entries.length > MAX_ENTRIES) entries.splice(MAX_ENTRIES);

  await saveEntries(entries);
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'MEDIA_UPDATE') {
    upsertEntry(msg.data).catch(console.error);
    return false;
  }

  if (msg.type === 'GET_ENTRY') {
    const base = getUrlBase(msg.url);
    getEntries()
      .then(entries => {
        const entry = entries.find(e => getUrlBase(e.url) === base) || null;
        sendResponse({ entry });
      })
      .catch(() => sendResponse({ entry: null }));
    return true;
  }

  if (msg.type === 'GET_ENTRIES') {
    getEntries()
      .then(entries => sendResponse({ entries }))
      .catch(() => sendResponse({ entries: [] }));
    return true;
  }

  if (msg.type === 'DELETE_ENTRY') {
    getEntries()
      .then(async entries => {
        await saveEntries(entries.filter(e => e.id !== msg.id));
        sendResponse({ ok: true });
      })
      .catch(() => sendResponse({ ok: false }));
    return true;
  }

  if (msg.type === 'CLEAR_ALL') {
    saveEntries([])
      .then(() => sendResponse({ ok: true }))
      .catch(() => sendResponse({ ok: false }));
    return true;
  }
});
