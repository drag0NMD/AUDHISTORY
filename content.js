(() => {
  const THROTTLE_MS = 5000;
  const SCREENSHOT_INTERVAL_MS = 30000;
  const MIN_DURATION = 30;

  const tracked = new WeakMap();

  function captureThumb(video) {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 320;
      canvas.height = 180;
      canvas.getContext('2d').drawImage(video, 0, 0, 320, 180);
      return canvas.toDataURL('image/jpeg', 0.6);
    } catch {
      // Cross-origin or DRM-protected video — skip silently
      return null;
    }
  }

  function getFavicon() {
    const el = document.querySelector('link[rel~="icon"]');
    return el?.href || '';
  }

  function sendUpdate(el, state) {
    chrome.runtime.sendMessage({
      type: 'MEDIA_UPDATE',
      data: {
        url: location.href,
        title: document.title,
        favicon: getFavicon(),
        thumbnail: state.thumbnail,
        type: el.tagName === 'VIDEO' ? 'video' : 'audio',
        currentTime: el.currentTime,
        duration: el.duration,
        domain: location.hostname,
      },
    }).catch(() => {});
  }

  function attachListeners(el) {
    if (tracked.has(el)) return;

    const state = {
      lastSave: 0,
      lastScreenshot: 0,
      thumbnail: null,
      userPlayed: false,
      totalPlayed: 0,
      playStart: null,
    };
    tracked.set(el, state);

    el.addEventListener('play', () => {
      // navigator.userActivation.isActive is true only when play was triggered by a user gesture
      if (navigator.userActivation?.isActive) {
        state.userPlayed = true;
      }
      state.playStart = Date.now();
    });

    const onStop = () => {
      if (state.playStart !== null) {
        state.totalPlayed += (Date.now() - state.playStart) / 1000;
        state.playStart = null;
      }
    };

    el.addEventListener('pause', onStop);
    el.addEventListener('ended', onStop);

    el.addEventListener('timeupdate', () => {
      if (!el.duration || el.duration < MIN_DURATION) return;

      const liveTotal = state.totalPlayed + (state.playStart ? (Date.now() - state.playStart) / 1000 : 0);
      if (!state.userPlayed && liveTotal < 30) return;

      const now = Date.now();
      if (now - state.lastSave < THROTTLE_MS) return;
      state.lastSave = now;

      if (el.tagName === 'VIDEO' && now - state.lastScreenshot > SCREENSHOT_INTERVAL_MS) {
        state.thumbnail = captureThumb(el);
        state.lastScreenshot = now;
      }

      sendUpdate(el, state);
    });
  }

  function scanMedia() {
    document.querySelectorAll('video, audio').forEach(attachListeners);
  }

  scanMedia();

  const observer = new MutationObserver(scanMedia);
  observer.observe(document.documentElement, { childList: true, subtree: true });

  // SPA navigation — intercept pushState
  const _push = history.pushState.bind(history);
  history.pushState = (...args) => {
    _push(...args);
    setTimeout(scanMedia, 500);
  };
  window.addEventListener('popstate', () => setTimeout(scanMedia, 500));

  // On page load: seek to saved position for non-YouTube pages
  // YouTube handles #t= natively; for others content.js does the seek
  if (!location.hostname.includes('youtube.com')) {
    chrome.runtime.sendMessage({ type: 'GET_ENTRY', url: location.href }, (res) => {
      if (!res?.entry?.currentTime || res.entry.currentTime < 5) return;
      const t = res.entry.currentTime;

      const trySeek = () => {
        const media = document.querySelector('video, audio');
        if (media && media.readyState >= 2 && media.duration > t) {
          media.currentTime = t;
        }
      };

      // Try immediately, then retry after a short delay for slow loaders
      setTimeout(trySeek, 1500);
      setTimeout(trySeek, 4000);
    });
  }
})();
