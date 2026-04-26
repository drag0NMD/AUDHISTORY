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
