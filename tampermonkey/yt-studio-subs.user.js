// ==UserScript==
// @name         YT Studio Sub Count → Streamer.bot
// @namespace    rory-subbar
// @version      1.6
// @description  Reads exact subscriber count from YouTube Studio and forwards to Streamer.bot
// @match        https://studio.youtube.com/*
// @include      *://studio.youtube.com/*
// @grant        GM_xmlhttpRequest
// @grant        unsafeWindow
// @grant        window.onurlchange
// @connect      127.0.0.1
// @connect      googleapis.com
// @run-at       document-start
// ==/UserScript==

(function () {
  'use strict';

  console.log('[SubBar] Script loaded v1.6');

  const SB_HTTP_PORT = 7474;           // Streamer.bot HTTP server port
  const SB_ACTION    = 'Sub Count Update'; // Must match action name in Streamer.bot exactly
  const POLL_MS      = 15000;

  // ── YouTube Data API v3 (optional but gives EXACT counts) ────────
  // Without this, Studio only shows "35.5K" and we can only send ~35500.
  //
  // How to get an API key (free, takes ~2 min):
  //   1. Go to https://console.cloud.google.com/
  //   2. Create a project (or pick an existing one)
  //   3. Enable "YouTube Data API v3" in APIs & Services → Library
  //   4. Create an API key in APIs & Services → Credentials
  //   5. Paste it below
  //
  // Channel ID is auto-detected from the Studio URL (no need to set it).
  const YT_API_KEY = '';  // ← paste your key here, e.g. 'AIzaSy...'
  const YT_API_MS  = 60 * 1000; // poll interval — 60 s uses only ~1440/10000 daily quota units

  // ────────────────────────────────────────────────────────────────

  let lastSent  = null;
  let lastExact = false;  // was the last sent value an exact (non-abbreviated) count?

  // ── Send to Streamer.bot ─────────────────────────────────────────
  // exact=true means the value is a genuine integer, not rounded from "35.5K"
  function send(count, exact = false) {
    if (count === lastSent) return;
    // Don't overwrite an exact value with an approximate one
    if (!exact && lastExact && Math.abs(count - lastSent) < 200) return;
    lastSent  = count;
    lastExact = !!exact;
    console.log(`[SubBar] Sending sub count ${count.toLocaleString()} (${exact ? 'exact' : 'approx'}) → Streamer.bot`);
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

  // ── YouTube Data API v3 ──────────────────────────────────────────
  // Returns exact subscriber count. Channel ID is read from the Studio URL.
  function getChannelId() {
    const m = location.href.match(/studio\.youtube\.com\/channel\/(UC[\w-]+)/);
    return m ? m[1] : null;
  }

  function fetchYtApiCount() {
    if (!YT_API_KEY) return;
    const channelId = getChannelId();
    if (!channelId) {
      console.log('[SubBar] YT API: channel ID not found in URL yet — will retry');
      return;
    }
    GM_xmlhttpRequest({
      method: 'GET',
      url:    `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${channelId}&key=${YT_API_KEY}`,
      onload: function (resp) {
        try {
          const data  = JSON.parse(resp.responseText);
          const raw   = data?.items?.[0]?.statistics?.subscriberCount;
          const count = parseInt(raw, 10);
          if (!isNaN(count) && count >= 100) {
            // YouTube Data API v3 rounds subscriber counts (e.g. 35569 → 35500).
            // Send as approximate so the DOM scrape can override with the real value.
            console.log(`[SubBar] YT API count: ${count.toLocaleString()} (approx — YouTube rounds this)`);
            send(count, false);
          } else {
            console.warn('[SubBar] YT API: unexpected response', data);
          }
        } catch (err) {
          console.warn('[SubBar] YT API parse error', err);
        }
      },
      onerror: () => console.warn('[SubBar] YT API request failed — check your API key and quota')
    });
  }

  // ── Deep-search an object for a subscriber count value ───────────
  // YouTube Studio API responses nest the count under various keys.
  function deepFindSubCount(obj, depth) {
    if (depth > 12 || !obj || typeof obj !== 'object') return null;
    for (const [k, v] of Object.entries(obj)) {
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
  // Returns { n, exact } or null.
  // exact=true only when DOM shows a plain integer ("1,234"), not an abbreviation ("1.2K").
  function parseCount(raw) {
    const s = raw.trim();
    const plain = s.replace(/[,\s]/g, '');
    if (/^\d{3,9}$/.test(plain)) {
      const n = parseInt(plain, 10);
      if (n >= 100) return { n, exact: true };
    }
    const abbr = s.match(/^([\d]+(?:\.[\d]+)?)\s*([KkMm])$/);
    if (abbr) {
      const mult = abbr[2].toUpperCase() === 'K' ? 1000 : 1000000;
      const n = Math.round(parseFloat(abbr[1]) * mult);
      if (n >= 100) return { n, exact: false };
    }
    return null;
  }

  function domCheck() {
    // Pass 1 — handle combined elements like "35,569\nSubscribers" or "35,569 Subscribers"
    // YouTube Studio often renders the count and label in a single node.
    for (const el of document.querySelectorAll('*')) {
      if (el.children.length > 0) continue;  // leaf nodes only
      const text = el.textContent.trim();
      // Match "35,569 Subscribers", "35,569\nSubscribers", "35.5K Subscribers", etc.
      const m = text.match(/^([\d,.\s]+(?:[KkMm])?)\s*[\n\r]+\s*subscribers?$|^([\d,.\s]+(?:[KkMm])?)\s+subscribers?$/i);
      if (m) {
        const raw = (m[1] || m[2]).trim();
        const result = parseCount(raw);
        if (result) {
          console.log(`[SubBar] domCheck combined: "${text}" → ${result.n} (${result.exact ? 'exact' : 'approx'})`);
          send(result.n, result.exact);
          return;
        }
      }
    }

    // Pass 2 — split layout: separate "Subscribers" label with a sibling count element
    for (const el of document.querySelectorAll('*')) {
      const text = el.textContent.trim();
      if (!/^subscribers?$/i.test(text)) continue;
      if (Array.from(el.children).some(c => /^subscribers?$/i.test(c.textContent.trim()))) continue;

      let node = el;
      for (let lvl = 0; lvl < 4; lvl++) {
        node = node.parentElement;
        if (!node) break;
        for (const c of node.querySelectorAll('*')) {
          if (c === el || c.contains(el) || c.children.length > 0) continue;
          const result = parseCount(c.textContent);
          if (result !== null) {
            console.log(`[SubBar] domCheck split: found ${result.n} (${result.exact ? 'exact' : 'approx'})`);
            send(result.n, result.exact);
            return;
          }
        }
      }
    }
  }

  function init() {
    injectFetchHook();

    // YouTube Data API v3 — exact counts, highest priority
    if (YT_API_KEY) {
      fetchYtApiCount();
      setInterval(fetchYtApiCount, YT_API_MS);
    } else {
      console.log('[SubBar] No YT_API_KEY set — falling back to DOM/Studio API (may show rounded counts). See script header for setup instructions.');
    }

    // Listen for data relayed from the page context (Studio internal API — approximate)
    unsafeWindow.addEventListener('_subbar_data', function (e) {
      try {
        const data  = JSON.parse(e.detail);
        const count = deepFindSubCount(data, 0);
        // Studio internal API rounds to nearest 100 — only use when no exact value exists
        if (count !== null && !lastExact) send(count, false);
      } catch (_) {}
    });

    // Periodic DOM fallback poll
    setInterval(domCheck, POLL_MS);
    setTimeout(domCheck, 4000);
    setTimeout(domCheck, 9000);
  }

  // Run on initial load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Re-run on SPA URL changes — also retry YT API if channel ID wasn't in URL at startup
  window.onurlchange = function () {
    if (YT_API_KEY) fetchYtApiCount();
    setTimeout(domCheck, 4000);
    setTimeout(domCheck, 9000);
  };
})();
