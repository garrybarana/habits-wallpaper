# Habit Streak Wallpaper - Vercel Deployment

## 📁 Project Structure

```
terfadf/
├── api/
│   ├── live.js              # 🔴 Real-time data (fetches from Habitify API)
│   ├── wallpaper.js         # ⚡ Cached data (fast loading)
│   ├── update-cache.js      # 🔄 Update cache endpoint
│   └── habitify-cache.json  # 💾 Cached habit data
├── public/
│   └── index.html           # 🏠 Homepage with options
└── vercel.json              # ⚙️ Vercel config
```

## 🚀 How It Works

### Three Endpoints:

1. **`/` (Homepage)** - Choose between live or cached version
2. **`/api/live`** - Fetches real-time data (slower, always fresh)
3. **`/api/wallpaper`** - Uses cached data (faster, may be outdated)

### Caching on Vercel:

⚠️ **Important**: Vercel serverless functions are **stateless** - they can't persist files between requests!

**Current Solution:**
- Cache is stored in `api/habitify-cache.json`
- Committed to Git → deployed with your code
- To update cache: Call `/api/update-cache` then commit & push

**Workflow to Update Cache:**
```bash
# 1. Trigger cache update
curl https://habits-wallpaper.vercel.app/api/update-cache

# 2. Pull updated cache (it writes to the function's temp storage)
# NOTE: This won't work because function storage is ephemeral!

# Better workflow: Update cache locally
node getHabits.js
cp habitify-cache.json api/habitify-cache.json
git add api/habitify-cache.json
git commit -m "Update cache"
git push
```

## 📱 iOS Setup

### Option 1: Use Live Endpoint (Recommended)
- URL: `https://habits-wallpaper.vercel.app/api/live`
- Always shows latest data
- No cache updates needed
- Takes 3-5 seconds to load

### Option 2: Use Cached Endpoint
- URL: `https://habits-wallpaper.vercel.app/api/wallpaper`
- Instant loading
- Requires manual cache updates
- Good for automation/battery life

### iOS Shortcut Steps:
1. Open Shortcuts app
2. Create new shortcut
3. Add "Open URLs" → Enter your URL
4. Add "Take Screenshot"
5. Add "Set Wallpaper" → Choose Lock Screen
6. Name it "Update Habit Wallpaper"

## 🔄 Cache Update Options

### Method 1: Update Locally (Current)
```bash
# Run local script
node getHabits.js

# Copy to API folder
cp habitify-cache.json api/habitify-cache.json

# Deploy
git add api/habitify-cache.json
git commit -m "Update cache $(date)"
git push
```

### Method 2: Call Update Endpoint (Creates temp file)
```bash
curl https://habits-wallpaper.vercel.app/api/update-cache
# Returns JSON with cache stats
# NOTE: File is in temp storage, need to commit manually
```

### Method 3: Use GitHub Actions (Future)
Create `.github/workflows/update-cache.yml`:
```yaml
name: Update Cache
on:
  schedule:
    - cron: '0 0 * * *'  # Daily at midnight
  workflow_dispatch:
jobs:
  update:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: node getHabits.js
      - run: cp habitify-cache.json api/habitify-cache.json
      - run: |
          git config user.name github-actions
          git config user.email github-actions@github.com
          git add api/habitify-cache.json
          git commit -m "Auto-update cache"
          git push
```

## ⚙️ Environment Variables (Optional)

Move API key to Vercel environment variables:

1. Go to Vercel dashboard
2. Project Settings → Environment Variables
3. Add: `HABITIFY_API_KEY` = `70f7803269df1fc25ae36ec212690aa7cb0f2af66b1625b39d1fe981d203e733`
4. Update code to use: `process.env.HABITIFY_API_KEY`

## 📊 Performance

- **Live Endpoint**: 3-5 seconds (8 API calls to Habitify)
- **Cached Endpoint**: <100ms (reads JSON file)
- **Cache Freshness**: Depends on update frequency

## 🎯 Recommendations

For iPhone wallpaper automation:
- ✅ Use `/api/live` for real-time accuracy
- ✅ Set up iOS automation to run once daily
- ✅ Use cached version if battery/speed is priority
- ✅ Update cache manually when needed

## 🔗 URLs

- Homepage: https://habits-wallpaper.vercel.app
- Live: https://habits-wallpaper.vercel.app/api/live
- Cached: https://habits-wallpaper.vercel.app/api/wallpaper
- Update Cache: https://habits-wallpaper.vercel.app/api/update-cache
- 60 Days: Add `?days=60` to any endpoint
