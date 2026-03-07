#!/usr/bin/env node
/**
 * Reads the CONFIG block from index.html and rewrites the config table
 * in README.md between the <!-- CONFIG_TABLE_START --> / <!-- CONFIG_TABLE_END --> markers.
 *
 * Run manually:  node scripts/update-readme.js
 * Runs automatically via .githooks/pre-commit on every commit.
 */

const fs   = require('fs');
const path = require('path');

const root    = path.resolve(__dirname, '..');
const htmlPath = path.join(root, 'index.html');
const readmePath = path.join(root, 'README.md');

// ── 1. Extract the CONFIG block from index.html ──────────────────────────────
const html = fs.readFileSync(htmlPath, 'utf8');
const configMatch = html.match(/const CONFIG = \{([\s\S]*?)\};/);

if (!configMatch) {
  console.error('update-readme: Could not find CONFIG block in index.html');
  process.exit(1);
}

// ── 2. Parse each "  key: value,   // comment" line ─────────────────────────
const rows = [];
for (const line of configMatch[1].split('\n')) {
  // Match:  key:   value,   // optional comment
  const m = line.match(/^\s+(\w+):\s+(.+?),?\s*(?:\/\/\s*(.*))?$/);
  if (!m) continue;
  const key     = m[1].trim();
  const value   = m[2].trim().replace(/,$/, '');
  const comment = (m[3] || '').trim();
  // Skip comment-only or separator lines
  if (!key || key.startsWith('//')) continue;
  rows.push({ key, value, comment });
}

if (rows.length === 0) {
  console.error('update-readme: No config keys parsed from CONFIG block');
  process.exit(1);
}

// ── 3. Build markdown table ──────────────────────────────────────────────────
let table = '| Key | Default | Description |\n';
table    += '|-----|---------|-------------|\n';
for (const { key, value, comment } of rows) {
  table += `| \`${key}\` | \`${value}\` | ${comment} |\n`;
}

// ── 4. Splice into README between markers ────────────────────────────────────
const START = '<!-- CONFIG_TABLE_START -->';
const END   = '<!-- CONFIG_TABLE_END -->';

let readme = fs.readFileSync(readmePath, 'utf8');

if (!readme.includes(START) || !readme.includes(END)) {
  console.error('update-readme: Markers not found in README.md — nothing updated');
  process.exit(1);
}

readme = readme.replace(
  new RegExp(`${START}[\\s\\S]*?${END}`),
  `${START}\n${table}${END}`
);

fs.writeFileSync(readmePath, readme);
console.log(`update-readme: README.md config table updated (${rows.length} keys)`);
