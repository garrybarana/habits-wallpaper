# Habitify Wallpaper Generator

Transform your Habitify habit tracking data into a beautiful, auto-updating mobile wallpaper!

🚀 **Live**: https://habits-wallpaper.vercel.app

## ✨ Features

- 🎯 **Real-time Updates**: Fetches live data from Habitify with Vercel KV caching
- 📱 **iPhone Optimized**: Perfect for all iPhone models (14 Pro Max tested)
- 🎨 **Beautiful Design**: Circular progress rings and visual streak indicators
- ⚡ **Fast**: Cached data for instant loading
- 🔄 **Auto-refresh**: Updates automatically without manual intervention

## 📊 API Endpoints

| Endpoint | Description |
|----------|-------------|
| `/` | Homepage with setup instructions |
| `/api/live` | Real-time data (fetches from Habitify API) |
| `/api/wallpaper-image` | Cached wallpaper (default 30 days) |

**Query Parameters:**
- `?days=60` - Show 60-day view
- `?days=90` - Show 90-day view

## 📱 iOS Setup

### Option 1: Direct URL (Simplest)
1. Open Safari on iPhone
2. Go to: `https://habits-wallpaper.vercel.app/api/wallpaper-image`
3. Take screenshot
4. Set as wallpaper in Settings

### Option 2: iOS Shortcut (Automated)
1. Open **Shortcuts** app
2. Create new shortcut with these actions:
   - **Get Contents of URL**: `https://habits-wallpaper.vercel.app/api/wallpaper-image`
   - **Set Wallpaper**: Choose Lock Screen or Both
3. Set up automation to run daily (e.g., 8 AM)

## 🔧 Local Development

```bash
# Install dependencies
npm install

# Fetch habit data locally
node getHabits.js

# Deploy to Vercel
vercel
```

## 📂 Project Structure

```
terfadf/
├── api/
│   ├── live.js              # Real-time data endpoint
│   ├── wallpaper-image.mjs  # Main wallpaper generator
│   └── habitify-cache.json  # Cached habit data
├── public/
│   └── index.html           # Landing page
├── getHabits.js             # Data fetcher
└── vercel.json              # Vercel config
```

## 🔑 Environment Variables

Required in Vercel Dashboard:
- `KV_REST_API_URL` - Upstash Redis URL (for caching)
- `KV_REST_API_TOKEN` - Upstash Redis token

## 🎨 Customization

Edit `api/wallpaper-image.mjs` to:
- Change colors and theme
- Adjust layout spacing
- Modify habit display order
- Customize for different screen sizes

## 📝 How It Works

1. Data is fetched from Habitify API
2. Stored in Vercel KV (Upstash Redis) for 12-hour cache
3. Wallpaper generated dynamically as PNG image
4. Served at custom URL that updates automatically

## 🚀 Deploy Your Own

1. Fork this repo
2. Set up Vercel KV in your Vercel project
3. Add environment variables
4. Deploy to Vercel
5. Use your custom URL in iOS Shortcut
- iPhone 14 ✅
- All modern iPhones with iOS 14+

## 🤝 Contributing

Feel free to customize and share improvements!

## 📄 License

MIT
