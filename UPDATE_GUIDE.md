# 📱 Habit Wallpaper - Update Guide

## 🔄 How to Update Your Wallpaper with Latest Data

Your wallpaper shows **cached data**, not live data. To see changes from your Habitify app:

### Method 1: Quick Update (Windows)

**Double-click:** `update-wallpaper.bat`

This script will:
1. ✅ Fetch latest data from Habitify API
2. ✅ Copy cache to API folder
3. ✅ Commit and push to GitHub
4. ✅ Vercel auto-deploys (1-2 minutes)

### Method 2: Manual Commands

```bash
# 1. Fetch latest data
node getHabits.js

# 2. Copy to API folder
copy habitify-cache.json api\habitify-cache.json

# 3. Deploy
git add api/habitify-cache.json
git commit -m "Update habit data"
git push
```

### Method 3: Scheduled Auto-Update

Set up Windows Task Scheduler to run `update-wallpaper.bat` automatically:

**Daily at 8 PM:**
1. Open **Task Scheduler**
2. Create Basic Task
3. Name: "Update Habit Wallpaper"
4. Trigger: Daily at 8:00 PM
5. Action: Start Program
   - Program: `D:\Web-Apps\terfadf\update-wallpaper.bat`
   - Start in: `D:\Web-Apps\terfadf`

---

## 🤖 Alternative: Live API (No Cache)

If you want real-time data without manual updates, I can modify the Vercel function to fetch live data from Habitify API on each request.

**Pros:**
- ✅ Always shows latest data
- ✅ No manual updates needed

**Cons:**
- ❌ Uses your Habitify API quota on each wallpaper load
- ❌ Slower load time (1-2 seconds)
- ❌ Needs to store API key in Vercel environment variables

Let me know if you want the live API version!

---

## 📊 Current Workflow

```
Habitify App → [Manual Update] → Cache File → Vercel → iPhone Wallpaper
   (phone)         (computer)      (git)      (deploy)    (shortcut)
```

**Update frequency:** Whenever you run the update script

**Alternative Live API Workflow:**

```
Habitify App → Vercel API → iPhone Wallpaper
   (phone)      (live fetch)   (shortcut)
```

**Update frequency:** Real-time (every wallpaper refresh)
