# Rory Sub Bar - OBS Overlay

A live sub bar & membership progress bar overlay for OBS. Shows your member progress as a segmented bar between two milestones, with live notifications and a sub combo counter.

---

## OBS Setup

1. In OBS, add a **Browser Source**
2. Check **Local file** and point it at `index.html`
3. Set **Width: 1280** and **Height: 140**
4. Enable **"Shutdown source when not visible"** and **"Refresh browser when scene becomes active"**
5. Paste this into the **Custom CSS** box so the background is transparent on stream:
   ```css
   html, body { background: transparent !important; }
   ```

---

## Profile Picture

Drop your headshot in the same folder as `index.html`, name it `profile.jpg`.
To use a different name or URL, update the **Profile Pic** field in the control console.

---

## Live member count (YouTube Studio overlay)

The overlay draws a **static pill** directly under the bar as a placeholder for the live count.
For the exact figure, add a second OBS **Browser Source** pointing at YouTube Studio and crop it down to the members-count number, then position it on top of the static pill.

```
YouTube Studio (browser source, cropped) ──► sits over the static pill
Sub Bar overlay (this repo)              ──► bar + notifications + combo
```

No Tampermonkey / Streamer.bot required.

---

## StreamElements (notifications)

New member, returning member, and gifted membership alerts come from StreamElements in real time.

1. Go to [streamelements.com](https://streamelements.com) → click your profile picture → **Show Secrets**
2. Copy the **JWT token**
3. Paste it into the **StreamElements JWT** field in the overlay's control console

The JWT also drives the bar fill (auto-refresh every N seconds). If you prefer to drive the bar manually, leave the JWT empty and set **Static Sub Count** in the console.

---

## Control Console

Everything is configurable from the panel inside `index.html` — no code editing needed.
Colour fields accept **hex values only** (e.g. `#5ee8fc`) so they work through the OBS *Interact* window, which can't open native colour-picker popups.

In OBS, alt-drag the **bottom edge** of the browser source upward to crop out the console so only the bar shows on stream.

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

---

## Features

- **Progress bar** — segmented fill between two milestones with profile pic indicator
- **Static count pill** — fixed position under the bar, overlay YT Studio on top for the exact live figure
- **Live notifications** — shows new members, returning members, gifted memberships, and community gift events
- **Sub combo** — tracks rapid membership events in a 7-second window; escalates from white → gold (×5) → fire (×10+) with a bump animation
- **🔔 Test Notification** / **⚡ Test Combo** buttons in the console for previewing on stream

---

## Files

```
Rory_SubBar/
├── index.html     # OBS browser source — the whole overlay
└── profile.jpg    # Your headshot (add this yourself)
```
