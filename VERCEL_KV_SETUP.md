# Upstash Redis Setup Guide (Vercel KV Alternative)

## 🚀 Quick Setup

### 1. Create Upstash Redis Database

1. Go to [Vercel Dashboard](https://vercel.com/dashboard) → **Storage** tab
2. Scroll to **Marketplace Database Providers**
3. Click on **Upstash** → "Serverless DB (Redis, Vector, Queue, Search)"
4. Click **Add Integration** or go directly to [Upstash Dashboard](https://console.upstash.com)
5. Sign in with GitHub (or create account)
6. Click **Create Database**
7. Choose:
   - Name: `habits-cache`
   - Type: **Regional** (free tier)
   - Region: Closest to you
   - TLS: Enabled
8. Click **Create**

### 2. Connect to Your Project

**Option A: Via Vercel Integration**
1. In Upstash dashboard, go to your database
2. Click **Vercel Integration**
3. Connect to your project: `habits-wallpaper`
4. Environment variables auto-added:
   - `KV_REST_API_URL`
   - `KV_REST_API_TOKEN`

**Option B: Manual Setup**
1. In Upstash database page, go to **REST API** tab
2. Copy the credentials
3. Go to Vercel → Your Project → **Settings** → **Environment Variables**
4. Add:
   - `KV_REST_API_URL` = `https://your-db.upstash.io`
   - `KV_REST_API_TOKEN` = `your-token`
   - `KV_REST_API_READ_ONLY_TOKEN` = `your-readonly-token`

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

## 🎯 Benefits of Upstash Redis

✅ **Persistent Storage** - Data survives between function invocations
✅ **Fast** - Redis-based, <10ms response time  
✅ **Free Tier** - 10,000 commands/day, 256MB storage
✅ **Auto-Expiration** - Cache expires after 24 hours (configurable)
✅ **No Git Commits** - No need to commit JSON files
✅ **Global Replication** - Available worldwide (paid tiers)

## 📊 Storage Details

### What's Stored:
- `habits` - List of your habits from Habitify
- `habitsData` - 30 days of status for each habit
- `lastUpdated` - Timestamp of last cache update

### Size Estimate:
- ~50KB per cache update
- 10,000 commands/day = ~100 cache reads + 1 update daily
- Well within free tier limits (10x more than old Vercel KV!)

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
1. Go to [Upstash Console](https://console.upstash.com)
2. Select `habits-cache` database
3. Go to **REST API** tab → Copy credentials
4. Add to Vercel Environment Variables:
   - `KV_REST_API_URL`
   - `KV_REST_API_TOKEN`
5. Redeploy from Vercel dashboard

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
