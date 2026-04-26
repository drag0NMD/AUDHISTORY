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
