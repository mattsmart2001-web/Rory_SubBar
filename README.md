# Rory Sub Bar — OBS Overlay

A YouTube membership progress bar overlay for OBS. Shows your live member count as a segmented bar between two milestones, with live notifications and a sub combo counter.

---

## OBS Setup

1. In OBS, add a **Browser Source**
2. Check **Local file** and point it at `index.html`
3. Set **Width: 1280** and **Height: 110**
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

## Live Sub Count Setup

The exact member count flows like this:

```
YouTube Studio  →  Tampermonkey script  →  Streamer.bot  →  OBS overlay
```

### 1 — Install Tampermonkey

Install the [Tampermonkey](https://www.tampermonkey.net/) browser extension, then:

1. Open Tampermonkey → **Create a new script**
2. Delete the placeholder and paste the full contents of `tampermonkey/yt-studio-subs.user.js`
3. Save (Ctrl+S)

The script runs on `studio.youtube.com`, reads your exact member count from the page, and sends it to Streamer.bot every time it changes (plus a fallback every 15 seconds).

### 2 — Set up Streamer.bot

1. In Streamer.bot, go to **Settings → Servers/Clients → HTTP Server** and make sure it's enabled on port **7474**
2. Also enable the **WebSocket Server** on port **8080**
3. Create an action named exactly **`Sub Count Update`**
4. Add a **C# Execute Code** sub-action with this code:

```csharp
int count = int.Parse(args["subCount"].ToString());
CPH.SendWebsocketMessage("{\"type\":\"subCount\",\"count\":" + count + "}", true);
```

That broadcasts the count over WebSocket to the overlay.

### 3 — Connect StreamElements (for notifications)

Member join/gift notifications come from StreamElements in real time.

1. Go to [streamelements.com](https://streamelements.com) → your profile → **Show Secrets**
2. Copy your **JWT token**
3. Paste it into the **StreamElements JWT** field in the control console

---

## Control Console

Everything is configurable from the panel inside `index.html` — no code editing needed.
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
- **Live notifications** — shows new members, returning members, gifted memberships, and community gift events
- **Sub combo** — tracks rapid membership events in a 7-second window; escalates from white → gold (×5) → fire (×10+) with a bump animation
- **🔔 Test Notification** / **⚡ Test Combo** buttons in the console for previewing on stream

---

## Files

```
Rory_SubBar/
├── index.html                          # OBS browser source — the whole overlay
├── profile.jpg                         # Your headshot (add this yourself)
└── tampermonkey/
    └── yt-studio-subs.user.js          # Tampermonkey script — reads Studio sub count → Streamer.bot
```
