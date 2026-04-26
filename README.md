# AUDHISTORY

Chrome-расширение, которое запоминает всё видео и аудио в твоём браузере и даёт вернуться к любому моменту одним кликом.

A Chrome extension that remembers every video and audio you played in your browser and lets you return to any moment in one click.

---

Закрыл вкладку с туториалом на 14:32 — открываешь AUDHISTORY, кликаешь по карточке, видео продолжается с того же места. Слушал подкаст и переключился на работу — расширение помнит таймкод. Смотрел фильм, забыл где остановился — ничего не забыл, всё в ленте.

### Зачем

В браузере уже есть история, но она помнит только адреса страниц. AUDHISTORY помнит **на какой секунде** ты остановился и **что именно** играло — превью, длительность, прогресс. История просмотров с памятью таймкодов.

### Как это работает

Расширение слушает все `<video>` и `<audio>` элементы на открытых страницах. Раз в 5 секунд сохраняет URL, заголовок, превью и текущий таймкод в локальное хранилище браузера. Клик по карточке в попапе — открывается вкладка с медиа на сохранённой секунде.

Всё хранится локально. Никаких серверов, никакой синхронизации, никакой телеметрии. Никто кроме тебя не видит что ты смотрел.

### Установка

1. Скачай репозиторий:
2. Открой в Chrome `chrome://extensions/`
3. Включи **Developer mode** в правом верхнем углу
4. Жми **Load unpacked** и выбери папку `audhistory/`
5. Иконка появится в тулбаре

Работает в Chrome, Brave, Edge и любом браузере на Chromium.

### Что попадает в историю

- Любое видео или аудио длиннее 30 секунд (короче — обычно реклама или Shorts, в ленту не идут)
- Только медиа, с которым ты реально взаимодействовал — кликнул play или досмотрел дольше 30 секунд
- Дедупликация по URL — одна страница одна запись, обновляется по мере просмотра

### Что НЕ попадает

- Защищённое DRM-видео (Netflix, некоторые стриминги). Их `<video>` элемент зашифрован, расширение видит только что страница открывалась.
- Медиа в режиме инкогнито — расширение там не работает по умолчанию.
- Сайты в чёрном списке — добавляется в настройках.
- Видео короче 30 секунд.

### Стек

- Manifest V3
- Vanilla JS, без сборщиков и фреймворков
- `chrome.storage.local` для хранения
- MutationObserver для отслеживания динамически добавляемых медиа
- Canvas API для генерации превью

Никаких зависимостей. Один разработчик может прочитать весь код за вечер.

### Структура

```
audhistory/
├── manifest.json
├── background.js       # service worker, хранилище
├── content.js          # инжектится на страницы, слушает медиа
├── popup/              # окно расширения
├── options/            # настройки
└── icons/
```

### Настройки

- Чёрный список доменов
- Минимальная длительность медиа для сохранения
- Снимать превью или нет (для экономии места)
- Стереть всё одной кнопкой

### Приватность

Всё хранится в `chrome.storage.local`. Это локальное хранилище браузера, ограниченное доменом расширения. Данные не покидают устройство. Никаких внешних запросов, никакой аналитики.

Если хочешь полностью стереть всё, что собрало расширение — открой настройки и нажми **Erase all**, или просто удали расширение, всё пропадёт вместе с ним.

### Дорожная карта

- [ ] Базовое отслеживание видео и аудио
- [ ] Лента карточек в попапе
- [ ] Возврат к таймкоду одним кликом
- [ ] Чёрный список доменов
- [ ] Экспорт истории в JSON
- [ ] Поиск по заголовку
- [ ] Группировка по доменам
- [ ] Импорт из YouTube History

### Лицензия

MIT.

### Автор

**Mark Demidov**

---

Closed a tutorial tab at 14:32 — open AUDHISTORY, click the card, video continues from the same spot. Listening to a podcast and switched to work — the extension remembers the timestamp. Watched a movie, forgot where you stopped — nothing is forgotten, it's all in the feed.

### Why

The browser already has a history, but it only remembers page URLs. AUDHISTORY remembers **the exact second** you stopped at and **what was playing** — thumbnail, duration, progress. Browsing history with timestamp memory.

### How it works

The extension listens to all `<video>` and `<audio>` elements on open pages. Every 5 seconds it saves URL, title, thumbnail and current timestamp to local browser storage. Click a card in the popup — a tab opens with the media at the saved second.

Everything is stored locally. No servers, no sync, no telemetry. Nobody but you sees what you watched.

### Installation

1. Download repository:
2. Open `chrome://extensions/` in Chrome
3. Enable **Developer mode** in the top right corner
4. Click **Load unpacked** and select the `audhistory/` folder
5. The icon appears in the toolbar

Works in Chrome, Brave, Edge and any Chromium-based browser.

### What gets tracked

- Any video or audio longer than 30 seconds (shorter is usually ads or Shorts, skipped)
- Only media you actually interacted with — clicked play or watched longer than 30 seconds
- URL-based deduplication — one page, one entry, updated as you watch

### What is NOT tracked

- DRM-protected video (Netflix, some streaming services). Their `<video>` element is encrypted, the extension only sees that the page was opened.
- Media in incognito mode — the extension doesn't run there by default.
- Sites in the blacklist — configurable in settings.
- Videos shorter than 30 seconds.

### Stack

- Manifest V3
- Vanilla JS, no bundlers or frameworks
- `chrome.storage.local` for storage
- MutationObserver to track dynamically added media
- Canvas API for thumbnail generation

Zero dependencies. One developer can read the entire codebase in an evening.

### Structure

```
audhistory/
├── manifest.json
├── background.js       # service worker, storage
├── content.js          # injected into pages, listens for media
├── popup/              # extension window
├── options/            # settings
└── icons/
```

### Settings

- Domain blacklist
- Minimum media duration to save
- Capture thumbnails or not (to save space)
- Erase everything in one click

### Privacy

Everything is stored in `chrome.storage.local`. This is the browser's local storage, scoped to the extension's domain. Data never leaves the device. No external requests, no analytics.

If you want to wipe everything the extension collected — open settings and press **Erase all**, or just uninstall the extension, everything goes with it.

### Roadmap

- [ ] Basic video and audio tracking
- [ ] Card feed in the popup
- [ ] One-click return to timestamp
- [ ] Domain blacklist
- [ ] Export history to JSON
- [ ] Search by title
- [ ] Group by domain
- [ ] Import from YouTube History

### License

MIT.

### Author

**Mark Demidov**
