// Make clicking the toolbar icon open the side panel (the reliable MV3 path).
chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {});
  reinjectContentScripts();
});
chrome.runtime.onStartup?.addListener(() => {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {});
});
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {});

async function reinjectContentScripts() {
  const tabs = await chrome.tabs.query({});
  for (const tab of tabs) {
    if (!tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://') || tab.url.startsWith('edge://') || tab.url.startsWith('about:')) continue;
    try {
      await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['content.js'] });
    } catch (_) {}
  }
}

// --- Sidebar open/close tracking (long-lived port from sidebar.js) ---
let sidebarPort = null;

chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== 'sidebar') return;
  sidebarPort = port;
  port.onDisconnect.addListener(() => {
    if (sidebarPort === port) sidebarPort = null;
  });
});

// --- Toggle shortcut ---
chrome.commands.onCommand.addListener(async (command, tab) => {
  if (command !== 'toggle-sidebar') return;

  if (sidebarPort) {
    try { sidebarPort.postMessage({ action: 'closeSidebar' }); } catch (_) {}
    return;
  }

  try {
    if (tab?.id) {
      await chrome.sidePanel.open({ tabId: tab.id });
      return;
    }
    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (activeTab?.id) {
      await chrome.sidePanel.open({ tabId: activeTab.id });
    } else {
      const win = await chrome.windows.getCurrent();
      await chrome.sidePanel.open({ windowId: win.id });
    }
  } catch (e) {
    console.log('[AI Sidebar] sidePanel.open failed:', e.message);
  }
});

// --- Persist iframe URLs from content scripts ---
const URL_KEY = {
  'chatgpt.com':       'lastChatUrl',
  'claude.ai':         'lastClaudeUrl',
  'gemini.google.com': 'lastGeminiUrl'
};

chrome.runtime.onMessage.addListener((msg) => {
  if (msg?.action !== 'iframeUrl' || !msg.url) return;
  try {
    const host = new URL(msg.url).hostname;
    const key = URL_KEY[host];
    if (key) {
      chrome.storage.local.set({ [key]: msg.url });
      console.log('[AI Sidebar] saved', key, '=', msg.url);
    }
    // Signal to sidebar that chatgpt.com actually rendered, so it can dismiss
    // its blank-page overlay.
    if (host === 'chatgpt.com' && sidebarPort) {
      try { sidebarPort.postMessage({ action: 'chatLoaded' }); } catch (_) {}
    }
  } catch (_) {}
});
