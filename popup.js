// popup.js

function timeAgo(ts) {
  const diff = Date.now() - ts;
  const min = Math.floor(diff / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  return `${day}d ago`;
}

function el(tag, className, text) {
  const e = document.createElement("div");
  if (className) e.className = className;
  if (text != null) e.textContent = text;
  return e;
}

// Tab switching
document.querySelectorAll(".tab-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
    document.querySelectorAll(".panel").forEach((p) => p.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById(`${btn.dataset.tab}-panel`).classList.add("active");
  });
});

// Recently Closed 
async function loadClosed() {
  const listEl = document.getElementById("closed-list");
  const emptyEl = document.getElementById("closed-empty");
  listEl.innerHTML = "";

  const sessions = await chrome.sessions.getRecentlyClosed({ maxResults: 25 });

  if (!sessions.length) {
    emptyEl.hidden = false;
    return;
  }
  emptyEl.hidden = true;

  sessions.forEach((session) => {
    const isWindow = !!session.window;
    const sessionId = isWindow ? session.window.sessionId : session.tab.sessionId;
    const lastModified = session.lastModified * 1000;

    let title, meta, icon;
    if (isWindow) {
      const tabCount = session.window.tabs ? session.window.tabs.length : 0;
      title = `Window · ${tabCount} tab${tabCount === 1 ? "" : "s"}`;
      icon = "▣";
      meta = timeAgo(lastModified);
    } else {
      title = session.tab.title || session.tab.url;
      icon = "▢";
      meta = timeAgo(lastModified);
    }

    const item = el("div", "item");
    const iconEl = el("div", "item-icon", icon);
    const body = el("div", "item-body");
    body.appendChild(el("div", "item-title", title));
    body.appendChild(el("div", "item-meta", meta));

    const btn = document.createElement("button");
    btn.className = "restore-btn";
    btn.textContent = "Restore";
    btn.addEventListener("click", async () => {
      await chrome.sessions.restore(sessionId);
      loadClosed();
    });

    item.appendChild(iconEl);
    item.appendChild(body);
    item.appendChild(btn);
    listEl.appendChild(item);
  });
}

// --- Rescued Forms ---
async function loadForms() {
  const listEl = document.getElementById("forms-list");
  const emptyEl = document.getElementById("forms-empty");
  listEl.innerHTML = "";

  const result = await chrome.storage.local.get("formRescues");
  const rescues = result.formRescues || {};
  const entries = Object.entries(rescues).sort((a, b) => b[1].savedAt - a[1].savedAt);

  if (!entries.length) {
    emptyEl.hidden = false;
    return;
  }
  emptyEl.hidden = true;

  entries.forEach(([url, rescue]) => {
    const fieldCount = Object.keys(rescue.data).length;
    const item = el("div", "item");
    const iconEl = el("div", "item-icon", "✎");
    const body = el("div", "item-body");
    body.appendChild(el("div", "item-title", rescue.title || url));
    body.appendChild(
      el("div", "item-meta", `${fieldCount} field${fieldCount === 1 ? "" : "s"} · ${timeAgo(rescue.savedAt)}`)
    );

    const btn = document.createElement("button");
    btn.className = "restore-btn";
    btn.textContent = "Open";
    btn.addEventListener("click", () => {
      chrome.tabs.create({ url });
    });   

    item.appendChild(iconEl);
    item.appendChild(body);
    item.appendChild(btn);
    listEl.appendChild(item);
  });
}

loadClosed();
loadForms();
