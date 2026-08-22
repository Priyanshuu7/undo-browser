
const FORM_RESCUE_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 7; 

// Keyboard shortcut
chrome.commands.onCommand.addListener(async (command) => {
  if (command === "restore-last-window") {
    const sessions = await chrome.sessions.getRecentlyClosed({ maxResults: 25 });
    const lastWindow = sessions.find((s) => s.window);
    if (lastWindow) {
      chrome.sessions.restore(lastWindow.window.sessionId);
    } else {
      const lastTab = sessions.find((s) => s.tab);
      if (lastTab) chrome.sessions.restore(lastTab.tab.sessionId);
    }
  }
});

// Badge
async function updateBadge() {
  try {
    const sessions = await chrome.sessions.getRecentlyClosed({ maxResults: 25 });
    const count = sessions.length;
    chrome.action.setBadgeText({ text: count ? String(count) : "" });
    chrome.action.setBadgeBackgroundColor({ color: "#5B6CFF" });
  } catch (e) {
    
  }
}

chrome.windows.onRemoved.addListener(updateBadge);
chrome.tabs.onRemoved.addListener(updateBadge);
chrome.runtime.onStartup.addListener(updateBadge);
chrome.runtime.onInstalled.addListener(updateBadge);

// Cleanup 
async function cleanupOldRescues() {
  const { formRescues = {} } = await chrome.storage.local.get("formRescues");
  const now = Date.now();
  let changed = false;
  for (const key of Object.keys(formRescues)) {
    if (now - formRescues[key].savedAt > FORM_RESCUE_MAX_AGE_MS) {
      delete formRescues[key];
      changed = true;
    }
  }
  if (changed) {
    await chrome.storage.local.set({ formRescues });
  }
}

chrome.alarms.create("cleanup-rescues", { periodInMinutes: 60 * 6 });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "cleanup-rescues") cleanupOldRescues();
});


cleanupOldRescues();
updateBadge();
