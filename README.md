# Habitify Wallpaper

Transform your Habitify habit tracking data into a beautiful mobile wallpaper!

## 🚀 Quick Start

### 1. Fetch Your Habit Data
```bash
node getHabits.js
```

### 2. Generate Wallpaper
```bash
node generateHabitWallpaper.js 30
```

### 3. Deploy to Vercel
```bash
npm install -g vercel
vercel
```

## 📱 iOS Shortcut Setup

1. **Get your Vercel URL** after deployment (e.g., `https://your-app.vercel.app`)

2. **Create iOS Shortcut**:
   - Open Shortcuts app
   - Tap **+** → New Shortcut
   - Add these actions in order:
     1. **Get Contents of URL**
        - URL: `https://your-app.vercel.app/api/wallpaper`
     2. **Quick Look** (optional - to preview)
     3. **Take Screenshot** or **Save to Photo Album**
     4. **Set Wallpaper**
   
3. **Name it**: "Update Habit Wallpaper"

4. **Add to Home Screen** or set up automation

## 🔄 Automation Ideas

Set up automations in iOS Shortcuts to run daily:
- ⏰ Every morning at 8 AM
- 🏠 When arriving home
- 🔌 When connected to charger at night

## 📊 API Endpoints

- `/api/wallpaper` - Default 30-day view
- `/api/wallpaper?days=60` - 60-day view
- `/api/wallpaper?days=90` - 90-day view

## 🎨 Features

- ✅ Works offline using cached data
- 📱 Optimized for iPhone (iPhone 14 Pro Max tested)
- 🎯 Shows completion percentage ring
- 📊 Visual streak indicators per habit
- 🔄 Auto-updates when data is refreshed

## 📂 Project Structure

```
terfadf/
├── api/
│   └── wallpaper.js          # Vercel serverless function
├── habitify-cache.json        # Cached habit data
├── getHabits.js               # Fetch habits from API
├── generateHabitWallpaper.js  # Generate desktop wallpaper
├── index.html                 # Landing page
├── package.json               # Node.js config
└── vercel.json               # Vercel config
```

## 🔑 Environment Variables

If deploying with sensitive data, add to Vercel:
- `API_KEY` - Your Habitify API key

## 📝 Notes

- Cache file must exist for Vercel deployment to work
- Data updates by re-running `getHabits.js` locally, then redeploying
- Or set up a cron job to auto-update

## 🛠️ Customization

Edit `api/wallpaper.js` to:
- Change colors
- Adjust layout
- Add more stats
- Customize for different screen sizes

## 📱 iPhone Models Supported

- iPhone 14 Pro Max ✅
- iPhone 14 Pro ✅
- iPhone 14 ✅
- All modern iPhones with iOS 14+

## 🤝 Contributing

Feel free to customize and share improvements!

## 📄 License

MIT
