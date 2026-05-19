// Long-lived port so background knows the sidebar is open (and can close it on the shortcut).
const port = chrome.runtime.connect({ name: 'sidebar' });

const iframeIds = { chat: 'chatIframe', claude: 'claudeIframe', gemini: 'geminiIframe' };
const storageKeys = { chat: 'lastChatUrl', claude: 'lastClaudeUrl', gemini: 'lastGeminiUrl' };

function getIframe(view) { return document.getElementById(iframeIds[view]); }

// --- ChatGPT-only blank-page detection ---
// ChatGPT sits behind Cloudflare and sometimes refuses to render inside an iframe
// (challenge page, frame-busting, partitioned cookies). If the content script in
// chatgpt.com hasn't reported a URL within the timeout, we assume it's blank and
// show a retry overlay.
const CHAT_LOAD_TIMEOUT_MS = 6000;
let chatLoadTimer = null;
let chatLoadedOnce = false;

const chatBlankOverlay = document.getElementById('chatBlankOverlay');

function showChatBlankOverlay() { chatBlankOverlay.classList.add('show'); }
function hideChatBlankOverlay() { chatBlankOverlay.classList.remove('show'); }

function startChatLoadWatchdog() {
  clearTimeout(chatLoadTimer);
  hideChatBlankOverlay();
  chatLoadTimer = setTimeout(() => {
    if (!chatLoadedOnce) showChatBlankOverlay();
  }, CHAT_LOAD_TIMEOUT_MS);
}

function reloadChat() {
  const iframe = getIframe('chat');
  if (!iframe) return;
  chatLoadedOnce = false;
  hideChatBlankOverlay();
  iframe.src = 'about:blank';
  setTimeout(() => {
    iframe.src = iframe.dataset.src;
    startChatLoadWatchdog();
  }, 50);
}

port.onMessage.addListener((msg) => {
  if (msg?.action === 'closeSidebar') {
    window.close();
  } else if (msg?.action === 'chatLoaded') {
    chatLoadedOnce = true;
    clearTimeout(chatLoadTimer);
    hideChatBlankOverlay();
  }
});

document.getElementById('chatReloadBtn').addEventListener('click', reloadChat);
document.getElementById('chatBlankRetryBtn').addEventListener('click', reloadChat);

// Load an iframe lazily. Always use the default data-src URL for initial load
// (saved URLs may be stale deep links that fail without session state).
function loadIframe(view) {
  const iframe = getIframe(view);
  if (!iframe || iframe.src) return;

  iframe.src = iframe.dataset.src;
  if (view === 'chat') startChatLoadWatchdog();
}

const segmented = document.querySelector('.segmented');
const tabs = document.querySelectorAll('.tab');
const views = document.querySelectorAll('.view');

function activate(view) {
  segmented.dataset.active = view;
  tabs.forEach(t => t.classList.toggle('active', t.dataset.view === view));
  views.forEach(v => v.classList.toggle('active', v.dataset.view === view));
  loadIframe(view);
}

tabs.forEach(t => t.addEventListener('click', () => activate(t.dataset.view)));

// ChatGPT is the default view on open.
loadIframe('chat');

// Preload Claude and Gemini iframes after a short delay
setTimeout(() => {
  loadIframe('claude');
  loadIframe('gemini');
}, 150);
