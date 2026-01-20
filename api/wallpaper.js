const fs = require('fs');
const path = require('path');

// Hardcoded cache data (since Vercel serverless can't read files easily)
let CACHE_DATA = null;
try {
  CACHE_DATA = require('./habitify-cache.json');
} catch (e) {
  console.error('Could not load cache:', e);
}

// Load cached data
function loadCache() {
  try {
    if (CACHE_DATA) {
      console.log('Cache loaded successfully, keys:', Object.keys(CACHE_DATA));
      return CACHE_DATA;
    }
    console.error('CACHE_DATA is null or undefined');
  } catch (error) {
    console.error('Error loading cache:', error);
  }
  return null;
}

// Generate mobile wallpaper HTML
function generateMobileWallpaper(cache, days = 30) {
  console.log('generateMobileWallpaper called, cache:', cache ? 'exists' : 'null');
  
  if (!cache) {
    console.error('No cache data');
    return generateErrorPage('No cache data available');
  }
  
  if (!cache.habitStatus) {
    console.error('No habitStatus in cache');
    return generateErrorPage('No habitStatus in cache');
  }
  
  if (!cache.habits) {
    console.error('No habits in cache');
    return generateErrorPage('No habits in cache');
  }

  // Get habit names
  const habitsMap = {};
  if (cache.habits && cache.habits.data) {
    cache.habits.data.forEach(habit => {
      habitsMap[habit.id] = habit.name;
    });
  }

  // Organize status data by habit
  const habitData = {};
  Object.keys(cache.habitStatus).forEach(key => {
    const [habitId, date] = key.split('_');
    if (!habitData[habitId]) {
      habitData[habitId] = [];
    }
    habitData[habitId].push(cache.habitStatus[key]);
  });

  // Get last N days for each habit
  const habitsArray = Object.keys(habitData).map(habitId => {
    const statuses = habitData[habitId]
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(-days);
    
    return {
      id: habitId,
      name: habitsMap[habitId] || 'Unknown Habit',
      statuses: statuses
    };
  });

  return generateHTML(habitsArray);
}

function generateHTML(habitsData) {
  const completedTotal = habitsData.reduce((sum, habit) => 
    sum + habit.statuses.filter(s => s.status === 'completed').length, 0);
  const totalDays = habitsData.reduce((sum, habit) => sum + habit.statuses.length, 0);
  const completionRate = totalDays > 0 ? ((completedTotal / totalDays) * 100).toFixed(0) : 0;

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
    <title>Habit Streak</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        
        .container {
            background: rgba(255, 255, 255, 0.98);
            border-radius: 30px;
            padding: 30px 20px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            width: 100%;
            max-width: 500px;
        }
        
        .header {
            text-align: center;
            margin-bottom: 25px;
        }
        
        h1 {
            color: #2d3748;
            font-size: 24px;
            margin-bottom: 8px;
        }
        
        .completion-ring {
            width: 120px;
            height: 120px;
            margin: 20px auto;
            position: relative;
        }
        
        .ring-bg {
            width: 100%;
            height: 100%;
            border-radius: 50%;
            background: conic-gradient(
                #48bb78 0% ${completionRate}%,
                #e2e8f0 ${completionRate}% 100%
            );
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 20px rgba(72, 187, 120, 0.3);
        }
        
        .ring-inner {
            width: 90px;
            height: 90px;
            border-radius: 50%;
            background: white;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-direction: column;
        }
        
        .percentage {
            font-size: 32px;
            font-weight: bold;
            color: #2d3748;
        }
        
        .percentage-label {
            font-size: 11px;
            color: #718096;
            margin-top: -5px;
        }
        
        .habits-grid {
            display: flex;
            flex-direction: column;
            gap: 12px;
            margin-top: 20px;
        }
        
        .habit-row {
            background: #f7fafc;
            padding: 12px;
            border-radius: 12px;
        }
        
        .habit-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
        }
        
        .habit-name {
            font-size: 13px;
            font-weight: 600;
            color: #2d3748;
            flex: 1;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        
        .habit-count {
            font-size: 11px;
            color: #718096;
            margin-left: 10px;
        }
        
        .days-strip {
            display: flex;
            gap: 3px;
            overflow-x: auto;
            padding: 2px 0;
            scrollbar-width: none;
        }
        
        .days-strip::-webkit-scrollbar {
            display: none;
        }
        
        .day-dot {
            min-width: 8px;
            width: 8px;
            height: 8px;
            border-radius: 2px;
            flex-shrink: 0;
        }
        
        .day-dot.completed {
            background: #48bb78;
        }
        
        .day-dot.in-progress {
            background: #ecc94b;
        }
        
        .day-dot.skipped {
            background: #cbd5e0;
        }
        
        .stats {
            display: flex;
            justify-content: space-around;
            margin-top: 25px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
        }
        
        .stat {
            text-align: center;
        }
        
        .stat-value {
            font-size: 20px;
            font-weight: bold;
            color: #2d3748;
        }
        
        .stat-label {
            font-size: 10px;
            color: #718096;
            margin-top: 2px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .timestamp {
            text-align: center;
            font-size: 10px;
            color: #a0aec0;
            margin-top: 15px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎯 Habit Streak</h1>
            <div class="completion-ring">
                <div class="ring-bg">
                    <div class="ring-inner">
                        <div class="percentage">${completionRate}%</div>
                        <div class="percentage-label">Complete</div>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="habits-grid">
            ${habitsData.map(habit => {
                const completed = habit.statuses.filter(s => s.status === 'completed').length;
                return `
                <div class="habit-row">
                    <div class="habit-header">
                        <div class="habit-name">${habit.name}</div>
                        <div class="habit-count">${completed}/${habit.statuses.length}</div>
                    </div>
                    <div class="days-strip">
                        ${habit.statuses.map(day => {
                            const statusClass = day.status === 'completed' ? 'completed' : 
                                              day.status === 'in_progress' ? 'in-progress' : 'skipped';
                            return `<div class="day-dot ${statusClass}"></div>`;
                        }).join('')}
                    </div>
                </div>`;
            }).join('')}
        </div>
        
        <div class="stats">
            <div class="stat">
                <div class="stat-value">${completedTotal}</div>
                <div class="stat-label">Completed</div>
            </div>
            <div class="stat">
                <div class="stat-value">${habitsData.length}</div>
                <div class="stat-label">Habits</div>
            </div>
            <div class="stat">
                <div class="stat-value">${habitsData[0]?.statuses.length || 0}</div>
                <div class="stat-label">Days</div>
            </div>
        </div>
        
        <div class="timestamp">
            Updated: ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </div>
    </div>
</body>
</html>`;
}

function generateErrorPage(message = 'No cached data available') {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Error</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            color: white;
            text-align: center;
        }
        h1 { font-size: 48px; margin-bottom: 20px; }
        p { font-size: 18px; }
    </style>
</head>
<body>
    <div>
        <h1>⚠️</h1>
        <p>${message}</p>
        <p style="font-size: 14px; margin-top: 10px;">Please run the data fetch first</p>
    </div>
</body>
</html>`;
}

module.exports = (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const cache = loadCache();
    const html = generateMobileWallpaper(cache, days);
    
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=300'); // Cache for 5 minutes
    res.status(200).send(html);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send(generateErrorPage());
  }
};
