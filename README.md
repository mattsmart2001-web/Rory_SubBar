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
| `currentSubs` | `324582` |  |
| `startMilestone` | `300000` |  |
| `endMilestone` | `400000` |  |
| `nextMilestone` | `325000` |  |
| `profilePicUrl` | `'profile.jpg'` |  |
| `date` | `'08/10/2025'` |  |
| `youtubeChannelId` | `''` |  |
| `youtubeApiKey` | `''` |  |
| `refreshSeconds` | `60` |  |
<!-- CONFIG_TABLE_END -->

## YouTube Live Sub Count (optional)

Fill in `youtubeChannelId` and `youtubeApiKey` to have the bar auto-update
every `refreshSeconds`. Without these, update `currentSubs` manually and
reload the browser source.

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
