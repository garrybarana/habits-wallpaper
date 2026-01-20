const https = require('https');
const { kv } = require('@vercel/kv');
const sharp = require('sharp');

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
  
  // Dark minimalist design optimized for iPhone 14 Pro Max
  // Lock screen safe zones: avoid top ~600px (clock area) and bottom ~400px
  const padding = 60;
  const startY = 650; // Start below clock
  const headerHeight = 100;
  const cellSize = 16;
  const cellGap = 4;
  const rowHeight = 65;
  const habitNameWidth = 200;
  
  // Generate minimalist dark SVG
  let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  
  <!-- Dark background -->
  <rect width="${width}" height="${height}" fill="#000000"/>
  
  <!-- Minimalist header (below clock safe zone) -->
  <text x="${padding}" y="${startY}" font-family="Arial, sans-serif" font-size="40" font-weight="700" fill="#ffffff" letter-spacing="-1">Habits</text>
  <text x="${padding}" y="${startY + 45}" font-family="Arial, sans-serif" font-size="18" font-weight="500" fill="#666666">${completionRate}% complete</text>
  
  <!-- Habits Grid -->
  ${habitsData.map((habit, habitIndex) => {
    const y = startY + headerHeight + habitIndex * rowHeight;
    const completed = habit.statuses.filter(s => s.status === 'completed').length;
    // Strip all non-ASCII characters for Sharp compatibility
    const habitName = habit.name
      .replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '') // Remove emojis
      .replace(/[^\x00-\x7F]/g, '') // Remove all non-ASCII
      .trim();
    const shortName = (habitName.length > 28 ? habitName.substring(0, 28) + '...' : habitName)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
    
    return `
  <!-- Habit name -->
  <text x="${padding}" y="${y + 24}" font-family="Arial, sans-serif" font-size="16" font-weight="500" fill="#ffffff">${shortName}</text>
  
  <!-- Days grid -->
  ${habit.statuses.map((day, dayIndex) => {
    const x = padding + habitNameWidth + dayIndex * (cellSize + cellGap);
    let fill = '#1a1a1a';
    let opacity = '1';
    
    if (day.status === 'completed') {
      fill = '#ffffff';
    } else if (day.status === 'in_progress') {
      fill = '#666666';
    }
    
    return `<rect x="${x}" y="${y + 10}" width="${cellSize}" height="${cellSize}" rx="5" fill="${fill}" opacity="${opacity}"/>`;
  }).join('')}
  
  <!-- Completion count -->
  <text x="${padding + habitNameWidth + daysToShow * (cellSize + cellGap) + 20}" y="${y + 24}" font-family="Arial, sans-serif" font-size="15" font-weight="500" fill="#666666">${completed}</text>
    `;
  }).join('')}
  
  <!-- Footer (above bottom safe zone) -->
  <text x="${padding}" y="${height - 450}" font-family="Arial, sans-serif" font-size="14" font-weight="400" fill="#333333">Updated ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</text>
  
</svg>`;
  
  return Buffer.from(svg, 'utf-8');
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
    
    // Convert SVG to PNG using sharp
    const pngBuffer = await sharp(imageBuffer)
      .png()
      .toBuffer();
    
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.status(200).send(pngBuffer);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Error generating wallpaper');
  }
};
