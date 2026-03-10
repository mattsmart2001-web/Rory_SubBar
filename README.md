# Rory Sub Bar - OBS Overlay

A live sub bar & membership progress bar overlay for OBS. Shows your live member count as a segmented bar between two milestones, with live notifications and a sub combo counter.

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

## Full Setup

The exact member count flows like this:

```
YouTube Studio  →  Tampermonkey script  →  Streamer.bot  →  OBS overlay
                                                ↑
                                      (YouTube account connected
                                       for membership events)
```

---

### Step 1 — Install Streamer.bot

1. Download and install [Streamer.bot](https://streamer.bot)
2. Run it — it lives in the system tray while streaming

**Connect your YouTube account:**

1. In Streamer.bot, go to **Platforms → YouTube**
2. Click **Connect** and sign in with your Google account
3. The status should show your channel name in green

**Enable the servers the overlay needs:**

1. Go to **Settings → Servers/Clients → HTTP Server**
   - Check **Auto Start** and set port to **7474**
2. Go to **Settings → Servers/Clients → WebSocket Server**
   - Check **Auto Start** and set port to **8080**
3. Click **Save** on each

---

### Step 2 — Create the Sub Count action

This action receives the count from Tampermonkey and forwards it to the overlay.

1. In Streamer.bot, go to **Actions** and click **+** to create a new action
2. Name it exactly: **`Sub Count Update`**
3. In the sub-actions panel, click **+** → **Core → C# → Execute Code**
4. Paste this code and click **Save**:

```csharp
int count = int.Parse(args["subCount"].ToString());
CPH.SendWebsocketMessage("{\"type\":\"subCount\",\"count\":" + count + "}", true);
```

---

### Step 3 — Install the Tampermonkey script

The script runs in your browser on YouTube Studio and feeds the exact member count to Streamer.bot.

1. Install the [Tampermonkey](https://www.tampermonkey.net/) browser extension
2. Open Tampermonkey → **Create a new script**
3. Delete the placeholder and paste the full contents of `tampermonkey/yt-studio-subs.user.js`
4. Save (Ctrl+S)

From now on, keep a YouTube Studio tab open while streaming — the script will push the count to Streamer.bot automatically whenever it changes.

---

### Step 4 — Connect StreamElements (for notifications)

New member, returning member, and gifted membership alerts come from StreamElements in real time.

1. Go to [streamelements.com](https://streamelements.com) → click your profile picture → **Show Secrets**
2. Copy the **JWT token**
3. Paste it into the **StreamElements JWT** field in the overlay's control console

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
