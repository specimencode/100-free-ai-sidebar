(function () {
  if (window.top === window.self) return;

  const TARGET_HOSTS = ['chatgpt.com', 'claude.ai', 'gemini.google.com', 'accounts.google.com'];
  const isTarget = TARGET_HOSTS.some(h => location.hostname.includes(h));

  let lastUrl = '';

  function report() {
    if (!isTarget) return;
    if (location.href === lastUrl) return;
    lastUrl = location.href;
    try {
      chrome.runtime.sendMessage({ action: 'iframeUrl', url: location.href });
    } catch (_) {}
  }

  report();

  const origPush = history.pushState;
  const origReplace = history.replaceState;
  history.pushState = function () {
    const r = origPush.apply(this, arguments);
    report();
    return r;
  };
  history.replaceState = function () {
    const r = origReplace.apply(this, arguments);
    report();
    return r;
  };

  window.addEventListener('popstate', report);
  window.addEventListener('hashchange', report);
  setInterval(report, 2000);

  // Anti-throttling: prevent Chrome from throttling/discarding side panel iframes.
  // ChatGPT and Gemini are sensitive to throttling and show a black screen when
  // the iframe is backgrounded. Claude is more resilient, which is why it still works.
  // These run on ALL iframes (not just target hosts) so auth redirects like
  // accounts.google.com are also kept alive.

  // 1. Override Visibility API so the page thinks it's always visible
  try {
    Object.defineProperty(document, 'hidden', {
      configurable: true,
      get: function () { return false; }
    });
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: function () { return 'visible'; }
    });
    const origHasFocus = document.hasFocus.bind(document);
    document.hasFocus = function () { return true; };
  } catch (_) {}

  // 2. Play silent audio to prevent tab throttling
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = 10;
    gain.gain.value = 0.001;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
  } catch (_) {}

  // 3. Periodic focus/visibility events to keep the page alive
  setInterval(() => {
    try {
      window.dispatchEvent(new Event('focus'));
      document.dispatchEvent(new Event('visibilitychange'));
    } catch (_) {}
  }, 30000);
})();
