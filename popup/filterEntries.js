function filterEntries(q) {
  if (!q) return allEntries;
  const low = q.toLowerCase();
  return allEntries.filter(e =>
    (e.title || '').toLowerCase().includes(low) ||
    (e.domain || '').toLowerCase().includes(low)
  );
}
