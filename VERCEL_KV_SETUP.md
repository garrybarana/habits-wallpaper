# Vercel KV Setup Guide

## 🚀 Quick Setup

### 1. Create Vercel KV Database

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click on **Storage** tab
3. Click **Create Database**
4. Select **KV (Redis)**
5. Choose a name: `habits-cache`
6. Select region closest to you
7. Click **Create**

### 2. Connect to Your Project

1. In the KV database page, click **Connect Project**
2. Select your project: `habits-wallpaper`
3. Click **Connect**
4. Vercel will automatically add environment variables:
   - `KV_URL`
   - `KV_REST_API_URL`
   - `KV_REST_API_TOKEN`
   - `KV_REST_API_READ_ONLY_TOKEN`

### 3. Deploy

The code is already updated to use Vercel KV. Just push:

```bash
git add .
git commit -m "Add Vercel KV integration"
git push
```

Vercel will automatically redeploy with KV connected!

## 📋 How to Use

### First Time Setup

1. **Update the cache** (call this once):
   ```bash
   curl https://habits-wallpaper.vercel.app/api/update-cache
   ```

2. **View cached wallpaper**:
   - https://habits-wallpaper.vercel.app/api/wallpaper
   - Loads instantly from KV cache

3. **View live wallpaper**:
   - https://habits-wallpaper.vercel.app/api/live
   - Fetches real-time from Habitify (slower)

### Daily Workflow

**Option A: Automatic with GitHub Actions**
```yaml
# .github/workflows/update-cache.yml
name: Update Cache Daily
on:
  schedule:
    - cron: '0 8 * * *'  # 8 AM daily
  workflow_dispatch:
jobs:
  update:
    runs-on: ubuntu-latest
    steps:
      - name: Update KV Cache
        run: |
          curl -X GET "https://habits-wallpaper.vercel.app/api/update-cache"
```

**Option B: Manual Update**
```bash
# Call whenever you want to refresh
curl https://habits-wallpaper.vercel.app/api/update-cache
```

**Option C: iOS Shortcut**
Create a shortcut that calls the update endpoint before viewing:
1. "Get Contents of URL" → https://habits-wallpaper.vercel.app/api/update-cache
2. Wait 5 seconds
3. "Open URLs" → https://habits-wallpaper.vercel.app/api/wallpaper
4. Take Screenshot
5. Set Wallpaper

## 🎯 Benefits of Vercel KV

✅ **Persistent Storage** - Data survives between function invocations
✅ **Fast** - Redis-based, <10ms response time
✅ **Free Tier** - 256MB storage, 3000 commands/day
✅ **Auto-Expiration** - Cache expires after 24 hours
✅ **No Git Commits** - No need to commit JSON files
✅ **Edge Caching** - Available at all Vercel edge locations

## 📊 Storage Details

### What's Stored:
- `habits` - List of your habits from Habitify
- `habitsData` - 30 days of status for each habit
- `lastUpdated` - Timestamp of last cache update

### Size Estimate:
- ~50KB per cache update
- 3000 commands/day = ~30 cache reads + 1 update daily
- Well within free tier limits

## 🔄 Cache Behavior

- **TTL**: 24 hours (auto-expires)
- **Update**: Call `/api/update-cache` anytime
- **Fallback**: If no cache, shows error with update link
- **Live Mode**: `/api/live` bypasses cache completely

## 🛠️ Troubleshooting

### "No Cache Available" Error
```bash
# Update the cache first
curl https://habits-wallpaper.vercel.app/api/update-cache
```

### Check Cache Status
```bash
# Add this endpoint to check cache age
curl https://habits-wallpaper.vercel.app/api/cache-info
```

### KV Not Connected
1. Go to Vercel Dashboard → Storage
2. Select `habits-cache` database
3. Click "Connect Project"
4. Select your project
5. Redeploy

## 🔗 Endpoints

- **Homepage**: https://habits-wallpaper.vercel.app
- **Live**: https://habits-wallpaper.vercel.app/api/live (real-time)
- **Cached**: https://habits-wallpaper.vercel.app/api/wallpaper (from KV)
- **Update**: https://habits-wallpaper.vercel.app/api/update-cache
- **60 Days**: Add `?days=60` to any endpoint

## 💡 Recommendations

**For iOS Wallpaper:**
- Use `/api/wallpaper` (cached) for instant loading
- Set up daily automation to call `/api/update-cache` at 8 AM
- Cache updates in ~5 seconds, wallpaper loads in <100ms

**For Real-Time:**
- Use `/api/live` if you need latest data immediately
- Takes 3-5 seconds but always current
- No cache setup needed
