# Rory Sub Bar — OBS Overlay

A YouTube subscriber progress bar overlay for OBS. Shows your live sub count
as a segmented progress bar between two milestones, with a profile pic indicator
and countdown to the next milestone.

## OBS Setup

1. In OBS, add a **Browser Source**
2. Check **Local file** and point it to `index.html`
3. Set **Width: 1280** and **Height: 110**
4. Enable **"Shutdown source when not visible"** and **"Refresh browser when scene becomes active"**

> **Transparent background:** In the Browser Source properties, paste the following
> into the *Custom CSS* box to make the overlay background transparent:
> ```css
> body { background-color: rgba(0, 0, 0, 0) !important; }
> ```

## Profile Picture

Drop your headshot image in the same folder as `index.html` and name it
`profile.jpg` (or update `profilePicUrl` in the config to any other path or URL).

## Configuration

Edit the `CONFIG` block near the bottom of `index.html`:

<!-- CONFIG_TABLE_START -->
| Key | Default | Description |
|-----|---------|-------------|
| `currentSubs` | `324582` | Current sub count (manual fallback) |
| `startMilestone` | `300000` | Left end of bar  (e.g. 300000) |
| `endMilestone` | `400000` | Right end of bar (e.g. 400000) |
| `nextMilestone` | `325000` | Next milestone to hit |
| `profilePicUrl` | `'profile.jpg'` | Path to your headshot image (local or URL) |
| `date` | `'08/10/2025'` | Shown bottom-left  (MM/DD/YYYY) |
| `youtubeChannelId` | `''` | e.g.  'UCxxxxxxxxxxxxxxxxxxxxxx' |
| `youtubeApiKey` | `''` | Your API key |
| `refreshSeconds` | `60` | How often to pull a fresh count |
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
