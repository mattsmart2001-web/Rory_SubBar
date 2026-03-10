// ==UserScript==
// @name         YT Studio Sub Count → Streamer.bot
// @namespace    rory-subbar
// @version      1.1
// @description  Reads exact subscriber count from YouTube Studio and forwards to Streamer.bot
// @match        https://studio.youtube.com/*
// @grant        GM_xmlhttpRequest
// @connect      127.0.0.1
// ==/UserScript==

(function () {
  'use strict';

  const SB_HTTP_PORT = 7474;           // Streamer.bot HTTP server port (Settings → Servers/Clients → HTTP Server)
  const SB_ACTION    = 'Sub Count Update'; // Must match the action name in Streamer.bot exactly
  const POLL_MS      = 15000;          // Re-check every 15 seconds as a fallback

  let lastSent = null;

  // ── Parse a raw text string into a subscriber count ─────────────
  function parseCount(raw) {
    const s = raw.trim();

    // Exact number: "34,247" or "34247"
    const plain = s.replace(/[,\s]/g, '');
    if (/^\d{3,9}$/.test(plain)) {
      const n = parseInt(plain, 10);
      if (n >= 100) return n;
    }

    // Abbreviated: "34.2K", "1.5M"
    const abbr = s.match(/^([\d]+(?:\.[\d]+)?)\s*([KkMm])$/);
    if (abbr) {
      const mult = abbr[2].toUpperCase() === 'K' ? 1000 : 1000000;
      const n = Math.round(parseFloat(abbr[1]) * mult);
      if (n >= 100) return n;
    }

    return null;
  }

  // ── Find the subscriber count in the Studio DOM ──────────────────
  // YouTube Studio uses custom elements (yt-formatted-string, ytcp-*)
  // so we match on full textContent rather than direct text nodes only.
  function findSubCount() {
    for (const el of document.querySelectorAll('*')) {
      const text = el.textContent.trim();

      // Only target leaf-ish elements whose entire text is "Subscribers"
      if (!/^subscribers?$/i.test(text)) continue;

      // Skip ancestor elements that contain a child matching the same text
      // (we want the innermost element, not its wrappers)
      if (Array.from(el.children).some(c => /^subscribers?$/i.test(c.textContent.trim()))) continue;

      // Walk up several levels looking for a container that also holds the count
      let node = el;
      for (let lvl = 0; lvl < 6; lvl++) {
        node = node.parentElement;
        if (!node) break;

        for (const c of node.querySelectorAll('*')) {
          if (c === el || c.contains(el) || c.children.length > 0) continue;
          const n = parseCount(c.textContent);
          if (n !== null) return n;
        }
      }
    }

    return null;
  }

  // ── Send to Streamer.bot HTTP API ────────────────────────────────
  function send(count) {
    if (count === lastSent) return;
    lastSent = count;
    console.log(`[SubBar] Sending sub count ${count.toLocaleString()} → Streamer.bot`);

    GM_xmlhttpRequest({
      method:  'POST',
      url:     `http://127.0.0.1:${SB_HTTP_PORT}/DoAction`,
      headers: { 'Content-Type': 'application/json' },
      data:    JSON.stringify({
        action: { name: SB_ACTION },
        args:   { subCount: String(count) }
      }),
      onerror: () => console.warn('[SubBar] Could not reach Streamer.bot — is it running?')
    });
  }

  // ── Check and send ───────────────────────────────────────────────
  function check() {
    const count = findSubCount();
    if (count !== null) {
      send(count);
    } else {
      console.log('[SubBar] Sub count not found in DOM — waiting for dashboard content');
    }
  }

  // Watch for DOM updates (Studio loads content dynamically)
  let debounce = null;
  new MutationObserver(() => {
    clearTimeout(debounce);
    debounce = setTimeout(check, 500);
  }).observe(document.body, { childList: true, subtree: true });

  // Periodic fallback poll
  setInterval(check, POLL_MS);

  // Initial check after the page has had time to render
  setTimeout(check, 3000);
})();
