const https = require('https');
const { kv } = require('@vercel/kv');
const { createCanvas } = require('canvas');

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
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  
  // Background gradient
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, '#0f172a');
  gradient.addColorStop(0.3, '#1e293b');
  gradient.addColorStop(1, '#334155');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  
  // Calculate metrics
  const completedTotal = habitsData.reduce((sum, habit) => 
    sum + habit.statuses.filter(s => s.status === 'completed').length, 0);
  const totalDays = habitsData.reduce((sum, habit) => sum + habit.statuses.length, 0);
  const completionRate = totalDays > 0 ? ((completedTotal / totalDays) * 100).toFixed(0) : 0;
  
  const daysToShow = habitsData[0]?.statuses.length || 30;
  const cellSize = Math.floor(Math.min((width - 300) / daysToShow, 35));
  const cellGap = Math.max(3, Math.floor(cellSize / 8));
  
  // Title
  ctx.fillStyle = '#ec4899';
  ctx.font = 'bold 52px -apple-system, system-ui';
  ctx.textAlign = 'center';
  ctx.fillText('🔥 Habit Calendar', width / 2, 180);
  
  // Stats
  ctx.fillStyle = '#fbbf24';
  ctx.font = 'bold 64px -apple-system, system-ui';
  ctx.fillText(`${completionRate}%`, width / 2 - 150, 280);
  ctx.fillText(`${completedTotal}`, width / 2 + 150, 280);
  
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.font = '600 16px -apple-system, system-ui';
  ctx.fillText('COMPLETE', width / 2 - 150, 310);
  ctx.fillText('DONE', width / 2 + 150, 310);
  
  // Habits grid
  const startY = 400;
  const rowHeight = 55;
  
  habitsData.forEach((habit, habitIndex) => {
    const y = startY + habitIndex * rowHeight;
    
    // Habit name
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.font = 'bold 19px -apple-system, system-ui';
    ctx.textAlign = 'right';
    const habitName = habit.name.length > 20 ? habit.name.substring(0, 20) + '...' : habit.name;
    ctx.fillText(habitName, 240, y + cellSize - 8);
    
    // Days grid
    habit.statuses.forEach((day, dayIndex) => {
      const x = 260 + dayIndex * (cellSize + cellGap);
      
      // Draw cell
      ctx.beginPath();
      ctx.roundRect(x, y, cellSize, cellSize, 6);
      
      if (day.status === 'completed') {
        ctx.fillStyle = '#10b981';
        ctx.fill();
        ctx.shadowColor = 'rgba(16, 185, 129, 0.5)';
        ctx.shadowBlur = 20;
      } else if (day.status === 'in_progress') {
        ctx.fillStyle = '#fbbf24';
        ctx.fill();
      } else {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.fill();
      }
      ctx.shadowBlur = 0;
    });
    
    // Score
    const completed = habit.statuses.filter(s => s.status === 'completed').length;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = 'bold 17px -apple-system, system-ui';
    ctx.textAlign = 'left';
    ctx.fillText(`${completed}/${habit.statuses.length}`, 260 + daysToShow * (cellSize + cellGap) + 20, y + cellSize - 8);
  });
  
  // Footer date
  const dateStr = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' 
  });
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.font = '600 18px -apple-system, system-ui';
  ctx.textAlign = 'center';
  ctx.fillText(dateStr, width / 2, height - 80);
  
  return canvas.toBuffer('image/png');
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
    
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.status(200).send(imageBuffer);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Error generating wallpaper');
  }
};
