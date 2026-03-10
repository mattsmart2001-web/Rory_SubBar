// ==UserScript==
// @name         YT Studio Sub Count → Streamer.bot
// @namespace    rory-subbar
// @version      1.3
// @description  Reads exact subscriber count from YouTube Studio and forwards to Streamer.bot
// @match        https://studio.youtube.com/*
// @include      *://studio.youtube.com/*
// @grant        GM_xmlhttpRequest
// @grant        unsafeWindow
// @grant        window.onurlchange
// @connect      127.0.0.1
// @run-at       document-start
// ==/UserScript==

(function () {
  'use strict';

  console.log('[SubBar] Script loaded v1.3');

  const SB_HTTP_PORT = 7474;           // Streamer.bot HTTP server port
  const SB_ACTION    = 'Sub Count Update'; // Must match action name in Streamer.bot exactly
  const POLL_MS      = 15000;

  let lastSent = null;

  // ── Send to Streamer.bot ─────────────────────────────────────────
  // exact=true means DOM-sourced precise value; always send over a rounded API value
  function send(count, exact) {
    if (count === lastSent) return;
    // Don't overwrite an exact value with a rounded one (API rounds to nearest 100)
    if (!exact && lastSent !== null && Math.abs(count - lastSent) < 200) return;
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

  // ── Deep-search an object for a subscriber count value ───────────
  // YouTube Studio API responses nest the count under various keys.
  function deepFindSubCount(obj, depth) {
    if (depth > 12 || !obj || typeof obj !== 'object') return null;
    for (const [k, v] of Object.entries(obj)) {
      // Key names seen in Studio API responses
      if (/^subscriber_?count$/i.test(k) && (typeof v === 'string' || typeof v === 'number')) {
        const n = parseInt(String(v).replace(/\D/g, ''), 10);
        if (n >= 100) return n;
      }
      const found = deepFindSubCount(v, depth + 1);
      if (found !== null) return found;
    }
    return null;
  }

  // ── Inject a page-context fetch interceptor ──────────────────────
  // Tampermonkey runs in a sandboxed scope; to hook window.fetch we
  // must inject a <script> into the actual page and communicate back
  // via a CustomEvent.
  function injectFetchHook() {
    const injected = document.createElement('script');
    injected.textContent = `(function () {
    var _fetch = window.fetch;
    window.fetch = async function () {
      var res = await _fetch.apply(this, arguments);
      var url = typeof arguments[0] === 'string'
        ? arguments[0]
        : (arguments[0] && arguments[0].url) || '';
      // Only inspect Studio's own API calls
      if (url.indexOf('/youtubei/') !== -1) {
        res.clone().json().then(function (data) {
          window.dispatchEvent(new CustomEvent('_subbar_data', { detail: JSON.stringify(data) }));
        }).catch(function () {});
      }
      return res;
    };
  })();`;
    (document.head || document.documentElement).appendChild(injected);
    injected.remove();
  }

  // ── Fallback: DOM scrape ─────────────────────────────────────────
  function parseCount(raw) {
    const s = raw.trim();
    const plain = s.replace(/[,\s]/g, '');
    if (/^\d{3,9}$/.test(plain)) {
      const n = parseInt(plain, 10);
      if (n >= 100) return n;
    }
    const abbr = s.match(/^([\d]+(?:\.[\d]+)?)\s*([KkMm])$/);
    if (abbr) {
      const mult = abbr[2].toUpperCase() === 'K' ? 1000 : 1000000;
      const n = Math.round(parseFloat(abbr[1]) * mult);
      if (n >= 100) return n;
    }
    return null;
  }

  function domCheck() {
    for (const el of document.querySelectorAll('*')) {
      const text = el.textContent.trim();
      if (!/^subscribers?$/i.test(text)) continue;
      if (Array.from(el.children).some(c => /^subscribers?$/i.test(c.textContent.trim()))) continue;

      let node = el;
      for (let lvl = 0; lvl < 8; lvl++) {
        node = node.parentElement;
        if (!node) break;
        for (const c of node.querySelectorAll('*')) {
          if (c === el || c.contains(el) || c.children.length > 0) continue;
          const n = parseCount(c.textContent);
          if (n !== null) { send(n, true); return; }
        }
      }
    }
  }

  function init() {
    injectFetchHook();

    // Listen for data relayed from the page context
    // Must use unsafeWindow — TM's sandboxed `window` is separate from the real page window
    unsafeWindow.addEventListener('_subbar_data', function (e) {
      try {
        const data = JSON.parse(e.detail);
        const count = deepFindSubCount(data, 0);
        // API values are rounded to nearest 100 — only use as fallback if DOM hasn't sent yet
        if (count !== null && lastSent === null) send(count);
      } catch (_) {}
    });

    // Periodic DOM fallback poll
    setInterval(domCheck, POLL_MS);
    // Staggered checks — give the page time to render the exact number
    setTimeout(domCheck, 4000);
    setTimeout(domCheck, 9000);
  }

  // Run on initial load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Re-run on SPA URL changes (YouTube Studio navigates without full page reloads)
  window.onurlchange = function () {
    setTimeout(domCheck, 4000);
    setTimeout(domCheck, 9000);
  };
})();
