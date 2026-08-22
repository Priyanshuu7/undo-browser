# Undo — Browser Safety Net

A Chrome extension that layers a proper "undo" history across the browser actions Chrome doesn't cover well:

- **Closed windows** — not just the last tab. `Ctrl/Cmd+Shift+Z` restores your last closed window instantly.
- **Closed tabs** — browsable history beyond Chrome's native menu, in a searchable popup.
- **Form data rescue** — the standout feature. While you type into any form, it's auto-saved locally (debounced, excludes password/card fields). If the tab crashes or you navigate away before submitting, revisiting that exact URL shows a banner offering to restore what you typed.

## Load it locally (unpacked)

1. Open `chrome://extensions`
2. Turn on **Developer mode** (top right)
3. Click **Load unpacked**
4. Select this folder (`undo-browser/`)
5. Pin the extension from the toolbar puzzle-piece icon for quick access

## Try it out

- **Window restore:** open a few tabs in a new window, close the window, press `Ctrl/Cmd+Shift+Z` (or open the popup → Recently Closed → Restore).
- **Form rescue:** go to any page with a text form (e.g. a search box, a contact form), type something, then close the tab. Reopen the same URL — you'll see the "restore unsaved form data" banner at the top.

## What's intentionally NOT included (v1)

- **Cookie-clearing undo** — Chrome doesn't expose cookie values before deletion in a way that can be safely snapshotted without constantly reading all site cookies. This is a genuine limitation of the platform, not an oversight — worth exploring as a "warn before clearing" feature instead in a future version.

## File structure

```
manifest.json    — MV3 config, permissions, keyboard shortcut
background.js    — service worker: badge count, cleanup, shortcut handling
content.js       — runs on every page: form snapshotting + restore banner
popup.html/.css/.js — the toolbar popup UI
icons/           — extension icon (generated)
```

## Notes on privacy

- Everything is stored **locally** via `chrome.storage.local` — nothing leaves the browser.
- Password fields, credit card fields, and anything with `ssn`/`cvv`/etc. in the field name are explicitly excluded from snapshots.
- Rescued form data auto-expires after 7 days.
