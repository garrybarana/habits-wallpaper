// iPhone-optimized habit wallpaper with custom dimensions
const { kv } = require('@vercel/kv');

const HABIT_IDS = [
  '1FE92BED-FEF3-4AB1-A9F9-9093B8C35B68',
  '19166B2B-9887-4615-9E0E-29B897EBADD7',
  'BF97B26A-D809-401D-A280-2216A72ED94F',
  '9CB275E2-7481-4711-B695-8CA5FDF3FC69',
  '26DC91FB-B45D-4C0C-96FE-E873E171CF51',
  '75F72DD4-A73A-41E5-B518-A38F1C02ACA6',
  '30AD6D84-AC03-43EE-9935-B340BE1ABD86',
  'B8AF262B-C7E5-4061-88A3-EABF1A090F3B'
];

function generateWallpaper(habitsData, width, height) {
  const completedTotal = habitsData.reduce((sum, habit) => 
    sum + habit.statuses.filter(s => s.status === 'completed').length, 0);
  const totalDays = habitsData.reduce((sum, habit) => sum + habit.statuses.length, 0);
  const completionRate = totalDays > 0 ? ((completedTotal / totalDays) * 100).toFixed(0) : 0;
  
  // Calculate grid dimensions
  const daysToShow = habitsData[0]?.statuses.length || 30;
  const cellSize = Math.floor(Math.min((width - 80) / daysToShow, 40));
  const cellGap = Math.max(2, Math.floor(cellSize / 10));

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=${width}, height=${height}, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Habit Streak</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            width: ${width}px;
            height: ${height}px;
            background: linear-gradient(135deg, #1e3a8a 0%, #7c3aed 50%, #db2777 100%);
            font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Arial, sans-serif;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            padding: 80px 40px;
            color: white;
            overflow: hidden;
        }
        .header {
            text-align: center;
            margin-bottom: 60px;
        }
        .title {
            font-size: 48px;
            font-weight: 800;
            letter-spacing: -1px;
            margin-bottom: 20px;
            text-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        }
        .stats-row {
            display: flex;
            gap: 40px;
            justify-content: center;
            margin-top: 20px;
        }
        .stat-item {
            text-align: center;
        }
        .stat-value {
            font-size: 56px;
            font-weight: 800;
            line-height: 1;
            text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
        }
        .stat-label {
            font-size: 18px;
            opacity: 0.9;
            margin-top: 8px;
            text-transform: uppercase;
            letter-spacing: 2px;
            font-weight: 600;
        }
        .habits-container {
            width: 100%;
            max-width: ${width - 80}px;
        }
        .habit-row {
            margin-bottom: 32px;
        }
        .habit-name {
            font-size: 22px;
            font-weight: 700;
            margin-bottom: 12px;
            text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .habit-score {
            font-size: 18px;
            opacity: 0.9;
            font-weight: 600;
        }
        .days-grid {
            display: grid;
            grid-template-columns: repeat(${daysToShow}, ${cellSize}px);
            gap: ${cellGap}px;
        }
        .day-cell {
            width: ${cellSize}px;
            height: ${cellSize}px;
            border-radius: ${Math.max(4, cellSize / 6)}px;
            background: rgba(255, 255, 255, 0.2);
            backdrop-filter: blur(10px);
            transition: all 0.3s ease;
        }
        .day-cell.completed {
            background: linear-gradient(135deg, #10b981, #059669);
            box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4);
        }
        .day-cell.in-progress {
            background: linear-gradient(135deg, #f59e0b, #d97706);
            box-shadow: 0 4px 15px rgba(245, 158, 11, 0.4);
        }
        .day-cell.skipped {
            background: rgba(255, 255, 255, 0.1);
        }
        .footer {
            margin-top: 60px;
            text-align: center;
            font-size: 16px;
            opacity: 0.8;
            font-weight: 500;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="title">🎯 Habit Streak</div>
        <div class="stats-row">
            <div class="stat-item">
                <div class="stat-value">${completionRate}%</div>
                <div class="stat-label">Complete</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${completedTotal}</div>
                <div class="stat-label">Done</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${daysToShow}</div>
                <div class="stat-label">Days</div>
            </div>
        </div>
    </div>
    
    <div class="habits-container">
        ${habitsData.map(habit => {
            const completed = habit.statuses.filter(s => s.status === 'completed').length;
            return `
            <div class="habit-row">
                <div class="habit-name">
                    <span>${habit.name}</span>
                    <span class="habit-score">${completed}/${habit.statuses.length}</span>
                </div>
                <div class="days-grid">
                    ${habit.statuses.map(day => {
                        const statusClass = day.status === 'completed' ? 'completed' : 
                                          day.status === 'in_progress' ? 'in-progress' : 'skipped';
                        return `<div class="day-cell ${statusClass}"></div>`;
                    }).join('')}
                </div>
            </div>
            `;
        }).join('')}
    </div>
    
    <div class="footer">
        ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
    </div>
</body>
</html>`;
}

module.exports = async (req, res) => {
  try {
    // Get dimensions from query params (iPhone 14 Pro Max default)
    const width = parseInt(req.query.width) || 1284;
    const height = parseInt(req.query.height) || 2778;
    const days = parseInt(req.query.days) || 30;
    
    // Get cached data from Upstash Redis
    const cachedHabits = await kv.get('habits');
    const cachedHabitsData = await kv.get('habitsData');
    
    if (!cachedHabits || !cachedHabitsData) {
      return res.status(503).send(`
        <!DOCTYPE html>
        <html><body style="font-family:system-ui;display:flex;align-items:center;justify-content:center;min-height:100vh;background:linear-gradient(135deg,#1e3a8a,#7c3aed,#db2777);color:white;text-align:center;padding:40px;">
          <div>
            <h1 style="font-size:64px;margin-bottom:20px;">⚠️</h1>
            <h2 style="margin-bottom:20px;font-size:32px;">No Cache Available</h2>
            <p style="margin-bottom:30px;font-size:20px;opacity:0.9;">Please update the cache first.</p>
            <a href="/api/update-cache" style="display:inline-block;background:white;color:#1e3a8a;padding:16px 32px;border-radius:12px;text-decoration:none;font-weight:700;font-size:18px;">Update Cache Now</a>
          </div>
        </body></html>
      `);
    }
    
    const habitsMap = {};
    cachedHabits.data.forEach(habit => {
      habitsMap[habit.id] = habit.name;
    });
    
    // Filter to requested days
    const allHabitsData = cachedHabitsData.map(habit => ({
      ...habit,
      statuses: habit.statuses.slice(-days)
    }));
    
    const html = generateWallpaper(allHabitsData, width, height);
    
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=300'); // Cache for 5 minutes
    res.status(200).send(html);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send(`<html><body style="font-family:system-ui;display:flex;align-items:center;justify-content:center;min-height:100vh;background:linear-gradient(135deg,#1e3a8a,#7c3aed,#db2777);color:white;text-align:center;"><div><h1>⚠️ Error</h1><p>Failed to load cached data</p><p style="font-size:18px;margin-top:20px;opacity:0.8;">${error.message}</p></div></body></html>`);
  }
};
