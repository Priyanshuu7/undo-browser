
(function () {
  const STORAGE_KEY = "formRescues";
  const SNAPSHOT_DEBOUNCE_MS = 1500;
  const pageKey = location.href;

  let debounceTimer = null;

  function isSensitive(el) {
    const type = (el.type || "").toLowerCase();
    if (type === "password") return true;
    const autocomplete = (el.autocomplete || "").toLowerCase();
    if (autocomplete.includes("cc-") || autocomplete.includes("credit")) return true;
    const name = (el.name || el.id || "").toLowerCase();
    if (/password|credit|card|cvv|ssn|social.?security/.test(name)) return true;
    return false;
  }

  function collectFormData() {
    const data = {};
    const fields = document.querySelectorAll("input, textarea, select");
    let hasContent = false;

    fields.forEach((el, idx) => {
      if (isSensitive(el)) return;
      if (el.type === "hidden" || el.type === "submit" || el.type === "button") return;

      const key = el.name || el.id || `field_${idx}`;
      let value;
      if (el.type === "checkbox" || el.type === "radio") {
        value = el.checked;
      } else {
        value = el.value;
      }

      if (value !== "" && value !== false && value != null) {
        data[key] = { value, type: el.type || el.tagName.toLowerCase() };
        hasContent = true;
      }
    });

    return hasContent ? data : null;
  }

  async function saveSnapshot() {
    const data = collectFormData();
    if (!data) return;

    const result = await chrome.storage.local.get(STORAGE_KEY);
    const rescues = result[STORAGE_KEY] || {};
    rescues[pageKey] = {
      data,
      title: document.title,
      savedAt: Date.now(),
    };
    await chrome.storage.local.set({ [STORAGE_KEY]: rescues });
  }

  function scheduleSnapshot() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(saveSnapshot, SNAPSHOT_DEBOUNCE_MS);
  }

  document.addEventListener("input", scheduleSnapshot, true);
  document.addEventListener("change", scheduleSnapshot, true);

  // Clear the rescue once the user actually submits the form successfully
  document.addEventListener(
    "submit",
    async () => {
      const result = await chrome.storage.local.get(STORAGE_KEY);
      const rescues = result[STORAGE_KEY] || {};
      delete rescues[pageKey];
      await chrome.storage.local.set({ [STORAGE_KEY]: rescues });
    },
    true
  );

  // --- On load: check if we have a rescue for this exact page ---
  async function checkForRescue() {
    const result = await chrome.storage.local.get(STORAGE_KEY);
    const rescues = result[STORAGE_KEY] || {};
    const rescue = rescues[pageKey];
    if (!rescue) return;

    // Don't offer to restore if the current form already has the same values
    showRestoreBanner(rescue);
  }

  function showRestoreBanner(rescue) {
    const banner = document.createElement("div");
    banner.style.cssText = `
      position: fixed; top: 0; left: 0; right: 0; z-index: 2147483647;
      background: #1f2430; color: #fff; font-family: -apple-system, sans-serif;
      font-size: 14px; padding: 10px 16px; display: flex; align-items: center;
      justify-content: center; gap: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    `;
    banner.innerHTML = `
      <span>We saved unsaved form data from earlier on this page.</span>
      <button id="undo-restore-btn" style="background:#5B6CFF;color:#fff;border:none;
        padding:6px 12px;border-radius:6px;cursor:pointer;font-size:13px;">Restore</button>
      <button id="undo-dismiss-btn" style="background:transparent;color:#aaa;border:none;
        padding:6px 12px;cursor:pointer;font-size:13px;">Dismiss</button>
    `;
    document.body.prepend(banner);

    document.getElementById("undo-restore-btn").addEventListener("click", () => {
      restoreData(rescue.data);
      banner.remove();
    });
    document.getElementById("undo-dismiss-btn").addEventListener("click", () => {
      banner.remove();
    });
  }

  function restoreData(data) {
    Object.entries(data).forEach(([key, { value, type }]) => {
      const el = document.querySelector(`[name="${key}"], #${CSS.escape(key)}`);
      if (!el) return;
      if (type === "checkbox" || type === "radio") {
        el.checked = value;
      } else {
        el.value = value;
      }
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
    });
  }

  // Wait a tick so the page's own JS has initialized fields first
  setTimeout(checkForRescue, 500);
})();
