# Rory Sub Bar — OBS Setup

A live YouTube sub bar overlay with real-time membership and Super Chat notifications.

---

## What you need before you start

- **OBS Studio** installed on your PC
- The **`Rory_SubBar` folder** on your PC (this repo, with `index.html`, `BG.png`, `Loader.webm`, and the font files inside it)
- A **StreamElements account** linked to your YouTube channel (sign up free at streamelements.com)

---

## Step 1 — Get your StreamElements JWT token

The JWT is a long secret string that lets the overlay talk to StreamElements.

1. Go to **https://streamelements.com** and log in with the account that's linked to your YouTube channel
2. Click your **profile picture** (top-right corner)
3. Click **Account**
4. Scroll down and click **Show Secrets**
5. Find the row labelled **JWT Token** and click the copy icon next to it
6. Keep it somewhere safe — you'll paste it in Step 4

⚠️ **Never share this JWT publicly.** Anyone with it can read your SE account data.

---

## Step 2 — Add the overlay to OBS

1. Open **OBS Studio**
2. In the **Sources** panel, click the **+** button → **Browser**
3. Name it "Sub Bar" and click **OK**
4. In the window that opens:
   - Tick **Local file**
   - Click **Browse** next to it and find `index.html` inside your `Rory_SubBar` folder
   - Set **Width** to `1280`
   - Set **Height** to `700` (yes, it's bigger than you need — we'll crop it next)
   - Tick **Shutdown source when not visible**
   - Tick **Refresh browser when scene becomes active**
   - Click **OK**

You'll see the sub bar plus a big blue control console underneath.

---

## Step 3 — Crop out the control console

The console is for configuration only — viewers shouldn't see it.

1. Click the Sub Bar source once to select it in the preview
2. **Hold ALT** and drag the **bottom edge** of the red bounding box **upward** until only the bar and a bit of space below it is visible
3. Release ALT
4. The console is now hidden on stream but still there when you need it

---

## Step 4 — Paste your JWT and configure

1. Right-click the Sub Bar source → **Interact**
2. A new window opens showing the overlay with the console visible
3. In the console, paste your JWT into the **StreamElements JWT** field
4. The status dot next to it should go **connecting… → authenticating… → connected** (green)

   If it says **bad JWT** or **connection failed**, double-check you copied the whole token.

5. Fill in the rest:
   - **Start Milestone** — the sub count at the left end of the bar (e.g. `30000`)
   - **End Milestone** — the sub count at the right end (e.g. `40000`)
   - **Next Goal** — label text for your next goal (e.g. `35000`)
   - Leave **YouTube API Key** and **YouTube Channel ID** empty (the JWT handles everything)
   - **Auto-refresh** — leave at `600` (10 minutes)
6. Close the Interact window. Settings are saved automatically.

---

## Step 5 — Test it

1. Right-click the Sub Bar source → **Interact** again
2. Click **🔔 Test Notification** — a test message should pop up on the overlay
3. Click **⚡ Test Combo** a few times rapidly — the combo counter should escalate

To test a **real** event end-to-end:

1. Go to **streamelements.com** → **Streaming Tools** → **Activity Feed**
2. Click the **Emulate** button at the top
3. Pick **New Subscriber** (or Tip, Super Chat, etc.) and click send
4. The notification should appear on your OBS overlay within a second or two

---

## What the notifications look like

- **New member / sub** → `Username just subscribed!`
- **Gifted membership** → `Gifter gifted a membership to Receiver!`
- **Community gift bundle** → `Gifter gifted 5 memberships to the community!`
- **Super Chat** → `Username sent a Super Chat: message`
- **Donation** → `Username donated £5!`

Multiple subs within 7 seconds trigger a **combo counter**:
- ×2–4: white
- ×5–9: gold
- ×10+: fire

---

## Troubleshooting

| Symptom | Fix |
|--------|-----|
| Status dot stays on **no JWT** | JWT field is empty — re-paste it |
| Status dot shows **bad JWT** | Token is wrong or expired — regenerate in SE Account → Show Secrets |
| Status dot shows **connection failed** | No internet, or a firewall is blocking `realtime.streamelements.com` |
| Sub count shows 0 | JWT is connected but your SE account isn't reading subs — fall back to the YouTube API fields in the console |
| Loader webm doesn't fill | Wait up to 10 minutes for the next auto-refresh, or click **↻ Refresh** in the console |
| Console won't go away | Alt-drag the bottom edge of the source upward in OBS (see Step 3) |
| Need to see the console again | Alt-drag the bottom edge back down, or right-click → **Interact** |

---

## Optional — YouTube API fallback

If you ever want to drive the sub count from YouTube's public API instead of StreamElements (for example if SE goes down):

1. Go to **https://console.cloud.google.com** → create a new project
2. Search for **YouTube Data API v3** → click **Enable**
3. Go to **Credentials** → **Create Credentials** → **API Key** → copy the key
4. Find your **YouTube Channel ID** — on YouTube, go to your channel → Settings → Advanced → Channel ID (starts with `UC`)
5. Paste both into the matching fields in the overlay's console

The overlay will use this if the JWT is empty or not returning data.

---

## Files in this folder

```
Rory_SubBar/
├── index.html              # The overlay — this is what OBS loads
├── BG.png                  # Background pill graphic
├── Loader.webm             # Animated fill
├── Third Rail.ttf          # Milestone font
├── Eurostile BoldItalic.ttf # Notification font
└── README.md               # This file
```
