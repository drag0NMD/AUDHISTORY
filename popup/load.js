async function load() {
  // Читаем storage напрямую — sendMessage к service worker в MV3 может упасть если воркер спит
  const r = await chrome.storage.local.get('audhistory_entries');
  allEntries = r.audhistory_entries || [];
  render(allEntries);
}
