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

function generateWallpaperImage(habitsData, width, height) {
  // Calculate metrics
  const completedTotal = habitsData.reduce((sum, habit) => 
    sum + habit.statuses.filter(s => s.status === 'completed').length, 0);
  const totalDays = habitsData.reduce((sum, habit) => sum + habit.statuses.length, 0);
  const completionRate = totalDays > 0 ? ((completedTotal / totalDays) * 100).toFixed(0) : 0;
  
  const daysToShow = habitsData[0]?.statuses.length || 30;
  const cellSize = Math.floor(Math.min((width - 300) / daysToShow, 35));
  const cellGap = Math.max(3, Math.floor(cellSize / 8));
  
  const startY = 400;
  const rowHeight = 55;
  
  const dateStr = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' 
  });
  
  // Generate SVG
  let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#0f172a;stop-opacity:1" />
      <stop offset="30%" style="stop-color:#1e293b;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#334155;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="titleGradient" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#60a5fa;stop-opacity:1" />
      <stop offset="50%" style="stop-color:#a78bfa;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#ec4899;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="statGradient" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#fbbf24;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#f59e0b;stop-opacity:1" />
    </linearGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="10" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  
  <!-- Background -->
  <rect width="${width}" height="${height}" fill="url(#bgGradient)"/>
  
  <!-- Title -->
  <text x="${width/2}" y="180" font-family="-apple-system, system-ui" font-size="52" font-weight="900" text-anchor="middle" fill="url(#titleGradient)">🔥 Habit Calendar</text>
  
  <!-- Stats -->
  <text x="${width/2 - 150}" y="280" font-family="-apple-system, system-ui" font-size="64" font-weight="900" text-anchor="middle" fill="url(#statGradient)">${completionRate}%</text>
  <text x="${width/2 - 150}" y="310" font-family="-apple-system, system-ui" font-size="16" font-weight="600" text-anchor="middle" fill="rgba(255,255,255,0.7)">COMPLETE</text>
  
  <text x="${width/2 + 150}" y="280" font-family="-apple-system, system-ui" font-size="64" font-weight="900" text-anchor="middle" fill="url(#statGradient)">${completedTotal}</text>
  <text x="${width/2 + 150}" y="310" font-family="-apple-system, system-ui" font-size="16" font-weight="600" text-anchor="middle" fill="rgba(255,255,255,0.7)">DONE</text>
  
  <!-- Habits Grid -->
  ${habitsData.map((habit, habitIndex) => {
    const y = startY + habitIndex * rowHeight;
    const habitName = habit.name.length > 20 ? habit.name.substring(0, 20) + '...' : habit.name;
    const completed = habit.statuses.filter(s => s.status === 'completed').length;
    
    return `
  <text x="240" y="${y + cellSize - 8}" font-family="-apple-system, system-ui" font-size="19" font-weight="700" text-anchor="end" fill="rgba(255,255,255,0.95)">${habitName}</text>
  ${habit.statuses.map((day, dayIndex) => {
    const x = 260 + dayIndex * (cellSize + cellGap);
    let fill = 'rgba(255,255,255,0.08)';
    let glow = '';
    
    if (day.status === 'completed') {
      fill = '#10b981';
      glow = ' filter="url(#glow)"';
    } else if (day.status === 'in_progress') {
      fill = '#fbbf24';
    }
    
    return `<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" rx="6" fill="${fill}"${glow}/>`;
  }).join('')}
  <text x="${260 + daysToShow * (cellSize + cellGap) + 20}" y="${y + cellSize - 8}" font-family="-apple-system, system-ui" font-size="17" font-weight="700" fill="rgba(255,255,255,0.6)">${completed}/${habit.statuses.length}</text>
    `;
  }).join('')}
  
  <!-- Footer -->
  <text x="${width/2}" y="${height - 80}" font-family="-apple-system, system-ui" font-size="18" font-weight="600" text-anchor="middle" fill="rgba(255,255,255,0.5)">${dateStr}</text>
</svg>`;
  
  return Buffer.from(svg);
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
      return res.status(503).send('No cache available');
    }
    
    const imageBuffer = generateWallpaperImage(allHabitsData, width, height);
    
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.status(200).send(imageBuffer);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Error generating wallpaper');
  }
};
