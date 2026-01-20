const https = require('https');
const { kv } = require('@vercel/kv');

const API_KEY = '70f7803269df1fc25ae36ec212690aa7cb0f2af66b1625b39d1fe981d203e733';

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

function httpsRequest(url, options) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            resolve(data);
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}`));
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function getHabitStatus(habitId, targetDate) {
  const formatDate = (date) => date.toISOString().slice(0, -5) + '+00:00';
  const formattedDate = formatDate(targetDate);
  const encodedDate = encodeURIComponent(formattedDate);
  const url = `https://api.habitify.me/status/${habitId}?target_date=${encodedDate}`;

  const result = await httpsRequest(url, {
    method: 'GET',
    headers: { 'Authorization': API_KEY }
  });

  return {
    date: targetDate.toISOString().split('T')[0],
    ...result.data
  };
}

function generateWallpaper(habitsData, width, height) {
  const completedTotal = habitsData.reduce((sum, habit) => 
    sum + habit.statuses.filter(s => s.status === 'completed').length, 0);
  const totalDays = habitsData.reduce((sum, habit) => sum + habit.statuses.length, 0);
  const completionRate = totalDays > 0 ? ((completedTotal / totalDays) * 100).toFixed(0) : 0;
  
  const daysToShow = habitsData[0]?.statuses.length || 30;
  const cellSize = Math.floor(Math.min((width - 100) / daysToShow, 35));
  const cellGap = Math.max(3, Math.floor(cellSize / 8));

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Habit Calendar</title>
    <style>
        * { 
            margin: 0; 
            padding: 0; 
            box-sizing: border-box; 
        }
        html, body {
            width: ${width}px;
            height: ${height}px;
            overflow: hidden;
        }
        body {
            background: linear-gradient(180deg, #0f172a 0%, #1e293b 30%, #334155 100%);
            font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            padding: 120px 50px 100px 50px;
            color: white;
        }
        .header {
            text-align: center;
            margin-bottom: 40px;
        }
        .title {
            font-size: 52px;
            font-weight: 900;
            letter-spacing: -2px;
            margin-bottom: 24px;
            background: linear-gradient(135deg, #60a5fa, #a78bfa, #ec4899);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        .stats-row {
            display: flex;
            gap: 50px;
            justify-content: center;
        }
        .stat-item {
            text-align: center;
        }
        .stat-value {
            font-size: 64px;
            font-weight: 900;
            line-height: 1;
            background: linear-gradient(135deg, #fbbf24, #f59e0b);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        .stat-label {
            font-size: 16px;
            opacity: 0.7;
            margin-top: 8px;
            text-transform: uppercase;
            letter-spacing: 3px;
            font-weight: 600;
        }
        .habits-grid {
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: center;
            gap: 28px;
        }
        .habit-row {
            display: flex;
            align-items: center;
            gap: 16px;
        }
        .habit-name {
            font-size: 19px;
            font-weight: 700;
            width: 200px;
            flex-shrink: 0;
            text-align: right;
            opacity: 0.95;
        }
        .days-grid {
            display: grid;
            grid-template-columns: repeat(${daysToShow}, ${cellSize}px);
            gap: ${cellGap}px;
            flex: 1;
        }
        .day-cell {
            width: ${cellSize}px;
            height: ${cellSize}px;
            border-radius: 6px;
            background: rgba(255, 255, 255, 0.08);
            transition: all 0.2s ease;
        }
        .day-cell.completed {
            background: linear-gradient(135deg, #10b981, #059669);
            box-shadow: 0 0 20px rgba(16, 185, 129, 0.5);
        }
        .day-cell.in-progress {
            background: linear-gradient(135deg, #fbbf24, #f59e0b);
            box-shadow: 0 0 20px rgba(251, 191, 36, 0.5);
        }
        .day-cell.skipped {
            background: rgba(148, 163, 184, 0.15);
        }
        .habit-score {
            font-size: 17px;
            font-weight: 700;
            opacity: 0.6;
            width: 60px;
            text-align: center;
        }
        .footer {
            text-align: center;
            margin-top: 40px;
        }
        .date {
            font-size: 18px;
            opacity: 0.5;
            font-weight: 600;
            letter-spacing: 1px;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="title">🔥 Habit Calendar</div>
        <div class="stats-row">
            <div class="stat-item">
                <div class="stat-value">${completionRate}%</div>
                <div class="stat-label">Complete</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${completedTotal}</div>
                <div class="stat-label">Done</div>
            </div>
        </div>
    </div>
    
    <div class="habits-grid">
        ${habitsData.map(habit => {
            const completed = habit.statuses.filter(s => s.status === 'completed').length;
            const habitName = habit.name.length > 20 ? habit.name.substring(0, 20) + '...' : habit.name;
            return `
            <div class="habit-row">
                <div class="habit-name">${habitName}</div>
                <div class="days-grid">
                    ${habit.statuses.map(day => {
                        const statusClass = day.status === 'completed' ? 'completed' : 
                                          day.status === 'in_progress' ? 'in-progress' : 'skipped';
                        return `<div class="day-cell ${statusClass}"></div>`;
                    }).join('')}
                </div>
                <div class="habit-score">${completed}/${habit.statuses.length}</div>
            </div>
            `;
        }).join('')}
    </div>
    
    <div class="footer">
        <div class="date">${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</div>
    </div>
</body>
</html>`;
}

module.exports = async (req, res) => {
  try {
    const width = parseInt(req.query.width) || 1284;
    const height = parseInt(req.query.height) || 2778;
    const days = parseInt(req.query.days) || 30;
    
    const cachedHabitsData = await kv.get('habitsData');
    const cachedHabits = await kv.get('habits');
    
    let allHabitsData = [];
    
    if (cachedHabitsData && cachedHabits) {
      const habitsMap = {};
      cachedHabits.data.forEach(habit => {
        habitsMap[habit.id] = habit.name;
      });
      
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      
      for (const habitId of HABIT_IDS) {
        const cachedHabit = cachedHabitsData.find(h => h.id === habitId);
        let statuses = cachedHabit ? [...cachedHabit.statuses] : [];
        statuses = statuses.filter(s => s.date !== todayStr);
        
        try {
          const todayStatus = await getHabitStatus(habitId, today);
          statuses.push(todayStatus);
        } catch (error) {
          console.error(`Failed today for ${habitId}`);
        }
        
        statuses = statuses.slice(-days);
        
        allHabitsData.push({
          id: habitId,
          name: habitsMap[habitId] || 'Unknown',
          statuses: statuses
        });
      }
    } else {
      return res.status(503).send(`<!DOCTYPE html><html><body style="font-family:system-ui;display:flex;align-items:center;justify-content:center;min-height:100vh;background:linear-gradient(180deg,#0f172a,#1e293b);color:white;text-align:center;padding:40px;"><div><h1 style="font-size:64px;margin-bottom:20px;">⚠️</h1><h2>No Cache</h2><p style="margin:20px 0;">Call <a href="/api/update-cache" style="color:#60a5fa;">/api/update-cache</a> first</p></div></body></html>`);
    }
    
    const html = generateWallpaper(allHabitsData, width, height);
    
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.status(200).send(html);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send(`<html><body style="font-family:system-ui;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#0f172a;color:white;text-align:center;"><div><h1>⚠️ Error</h1><p>${error.message}</p></div></body></html>`);
  }
};
