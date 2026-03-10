// ==UserScript==
// @name         YT Studio Sub Count → Streamer.bot
// @namespace    rory-subbar
// @version      1.0
// @description  Reads exact subscriber count from YouTube Studio and forwards to Streamer.bot
// @match        https://studio.youtube.com/*
// @grant        GM_xmlhttpRequest
// @connect      127.0.0.1
// ==/UserScript==

(function () {
  'use strict';

  const SB_HTTP_PORT = 7474;          // Streamer.bot HTTP server port (Settings → Servers/Clients → HTTP Server)
  const SB_ACTION    = 'Sub Count Update'; // Must match the action name in Streamer.bot exactly
  const POLL_MS      = 15000;         // Re-check every 15 seconds as a fallback

  let lastSent = null;

  // ── Find the subscriber count in the Studio DOM ──────────────────
  // YouTube Studio is a SPA — the count appears next to a "Subscribers" label.
  // We walk elements looking for that label then find the adjacent number.
  function findSubCount() {
    const allEls = document.querySelectorAll('*');

    for (const el of allEls) {
      // Target elements whose direct text content is "Subscribers"
      const directText = Array.from(el.childNodes)
        .filter(n => n.nodeType === Node.TEXT_NODE)
        .map(n => n.textContent.trim())
        .join('');

      if (!/^subscribers?$/i.test(directText)) continue;

      // Search the containing block for a sibling number
      const container = el.parentElement?.parentElement || el.parentElement;
      if (!container) continue;

      for (const c of container.querySelectorAll('*')) {
        if (c === el || c.contains(el) || c.children.length > 0) continue;
        const t = c.textContent.trim().replace(/[,\s]/g, '');
        if (/^\d{3,9}$/.test(t)) {
          const n = parseInt(t, 10);
          if (n >= 100) return n;
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
    if (count !== null) send(count);
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
