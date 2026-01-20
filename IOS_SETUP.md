# iOS Shortcut Setup Guide

## 📱 Set Up iPhone Wallpaper Automation

### Method 1: Manual Screenshot (Recommended for iPhone 14 Pro Max)

1. **Open Safari** on your iPhone
2. Go to: `https://habits-wallpaper.vercel.app/api/wallpaper`
3. Take a screenshot: **Volume Up + Side Button**
4. Crop the screenshot to remove status bar
5. Go to **Settings** → **Wallpaper** → **Add New Wallpaper**
6. Select your screenshot

### Method 2: iOS Shortcut with Screenshot

Since iOS doesn't allow direct HTML-to-wallpaper, create this shortcut:

#### Step-by-Step:

1. **Open Shortcuts app**

2. **Tap + (New Shortcut)**

3. **Add these actions:**

   **Action 1: Open URLs**
   - URL: `https://habits-wallpaper.vercel.app/api/wallpaper`
   - Show: `Safari`

   **Action 2: Wait**
   - Duration: `2 seconds`

   **Action 3: Take Screenshot**
   
   **Action 4: Crop Image**
   - Position: `Custom`
   - Remove top and bottom bars

   **Action 5: Set Wallpaper**
   - Show Preview: `Off` (for automation)
   - Wallpaper: `Lock Screen` or `Both`

4. **Name it:** "Update Habit Wallpaper"

5. **Test:** Run the shortcut manually first

### Method 3: Automated with Personal Automation

1. **Go to Shortcuts** → **Automation** tab

2. **Create Personal Automation**

3. **Choose trigger:**
   - ⏰ **Time of Day** (e.g., 8:00 AM daily)
   - OR 🔌 **Charger** (when connected)
   - OR 📍 **Arrive** (at home/work)

4. **Add your "Update Habit Wallpaper" shortcut**

5. **Disable "Ask Before Running"** (iOS may require confirmation first time)

### Method 4: Using Scriptable App (Advanced)

If you have **Scriptable** app installed:

1. Create new script in Scriptable:

```javascript
// Habit Wallpaper Script
let url = "https://habits-wallpaper.vercel.app/api/wallpaper";
let webview = new WebView();
await webview.loadURL(url);
await webview.waitForLoad();

// Wait for content to render
await new Promise(resolve => setTimeout(resolve, 2000));

// Take screenshot
let image = await webview.getScreenshot();

// Set as wallpaper
Photos.save(image);

// Show completion
let alert = new Alert();
alert.title = "Wallpaper Updated";
alert.message = "Screenshot saved to Photos. Set it manually or use Shortcuts.";
alert.addAction("OK");
await alert.present();
```

2. Run from Shortcuts or automation

## 🔄 Refresh Data

To update your habit data:

1. **On your computer**, run: `node getHabits.js`
2. **Commit and push** the updated cache: 
   ```bash
   git add api/habitify-cache.json
   git commit -m "Update habit data"
   git push
   ```
3. **Vercel auto-deploys** in 1-2 minutes
4. **Run your iPhone shortcut** to get the latest wallpaper

## ⚙️ Troubleshooting

**Shortcut doesn't run automatically?**
- Make sure "Ask Before Running" is disabled
- Check automation trigger settings
- Test manually first

**Wallpaper looks wrong?**
- Adjust crop settings in screenshot action
- Try portrait/landscape orientation
- Use `?days=7` for smaller view: `https://habits-wallpaper.vercel.app/api/wallpaper?days=7`

**Need different timeframe?**
- 7 days: `?days=7`
- 60 days: `?days=60`
- 90 days: `?days=90`

## 📱 Optimized for iPhone 14 Pro Max

The wallpaper is designed for:
- Resolution: 1290 x 2796 pixels
- Lock screen display
- Dynamic Island compatible
- Always-on display compatible
