# Rory Sub Bar — OBS Overlay

A YouTube subscriber progress bar overlay for OBS. Shows your live sub count
as a segmented progress bar between two milestones, with a profile pic indicator
and countdown to the next milestone.

## OBS Setup

1. In OBS, add a **Browser Source**
2. Check **Local file** and point it to `index.html`
3. Set **Width: 1280** and **Height: 110**
4. Enable **"Shutdown source when not visible"** and **"Refresh browser when scene becomes active"**

> **Transparent background:** The HTML file has a dark page background so it's
> visible when testing in Safari/Chrome. In OBS, add this to the Browser Source
> *Custom CSS* box to restore transparency (so only the rounded bar shows on stream):
> ```css
> html, body { background: transparent !important; }
> ```

## Profile Picture

Drop your headshot image in the same folder as `index.html` and name it
`profile.jpg` (or update `profilePicUrl` in the config to any other path or URL).

## Configuration

Edit the `CONFIG` block near the bottom of `index.html`:

<!-- CONFIG_TABLE_START -->
| Key | Default | Description |
|-----|---------|-------------|
| `startMilestone` | `30000` | Left end of bar |
| `endMilestone` | `40000` | Right end of bar |
| `nextMilestone` | `35000` | Next milestone label |
| `profilePicUrl` | `'profile.jpg'` | Local filename or URL |
| `barColor` | `'#5ee8fc'` | Bar fill colour |
| `trackColor` | `'#2c3d5e'` | Unfilled slot colour |
| `pillColor` | `'#2d3f6e'` | Background pill colour |
| `subCountColor` | `'#5ee8fc'` | Sub counter number colour |
| `streamElementsJwt` | `''` | SE JWT — positions the bar |
| `refreshSeconds` | `60` | Auto-refresh interval |
| `staticSubCount` | `0` | Static subscriber count shown under bar |
<!-- CONFIG_TABLE_END -->

## Getting an Exact Sub Count (OAuth — recommended)

YouTube's public API rounds subscriber counts to 3 significant figures
(e.g. 34,686 → 34,600). Authenticating as the channel owner returns the
exact number. This is a one-time setup.

### Step 1 — Create OAuth credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com) → **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. Application type: **TVs and Limited Input devices**
4. Name it anything (e.g. "Sub Bar")
5. Copy the **Client ID** and **Client Secret** into the console

### Step 2 — Enable the YouTube Data API

In Google Cloud Console → **APIs & Services** → **Library**, search for
**YouTube Data API v3** and enable it.

### Step 3 — Connect in the console

1. Paste your Client ID and Client Secret into the bottom row of the control console
2. Click **Connect YT Account**
3. Visit the URL shown and enter the code — takes about 10 seconds
4. The badge turns **● Connected ✓** and the bar starts showing exact counts

The refresh token is saved to `localStorage` — you only need to do this once per browser/device.

---

## Approximate Count (API key — no auth needed)

Fill in `youtubeChannelId` and `youtubeApiKey` for a count that updates
automatically but rounds to the nearest ~100. Useful as a fallback.

**Get an API key:**
1. [Google Cloud Console](https://console.cloud.google.com) → **Credentials** → **Create API Key**
2. Restrict it to **YouTube Data API v3**

**Find your Channel ID:**
YouTube Studio → **Customization** → **Basic info** → Channel URL / ID at the bottom.

**Get an API key:**
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Enable **YouTube Data API v3**
3. Create an API key under *Credentials*
4. Paste it into `youtubeApiKey` in the config

**Find your Channel ID:**
- Go to your YouTube channel → click **Customize channel** → **Basic info**
- Your channel ID is listed at the bottom

## Auto-updating README

The config table above is kept in sync automatically. A git pre-commit hook
runs `scripts/update-readme.js` which parses `index.html` and rewrites the
table whenever you commit — so the docs always reflect the current defaults.

**Install the hook once after cloning:**
```bash
git config core.hooksPath .githooks
```

## File Structure

```
Rory_SubBar/
├── index.html            # OBS browser source overlay
├── profile.jpg           # Your headshot (add this yourself)
├── scripts/
│   └── update-readme.js  # Regenerates config table in README
└── .githooks/
    └── pre-commit        # Runs update-readme.js before each commit
```
