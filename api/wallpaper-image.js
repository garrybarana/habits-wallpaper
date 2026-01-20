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
  
  // iPhone 14 Pro Max optimized sizing
  const containerWidth = width - 100; // 50px padding each side
  const containerTop = 240;
  const containerHeight = height - containerTop - 180;
  const dotSize = 12;
  const dotGap = 5;
  const rowHeight = 100;
  
  const timestamp = new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  
  // Generate SVG with /api/live design
  let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
    </linearGradient>
    <filter id="shadow">
      <feGaussianBlur in="SourceAlpha" stdDeviation="15"/>
      <feOffset dx="0" dy="15" result="offsetblur"/>
      <feFlood flood-color="#000000" flood-opacity="0.25"/>
      <feComposite in2="offsetblur" operator="in"/>
      <feMerge>
        <feMergeNode/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  
  <!-- Background Gradient -->
  <rect width="${width}" height="${height}" fill="url(#bgGradient)"/>
  
  <!-- Main Container -->
  <rect x="50" y="${containerTop}" width="${containerWidth}" height="${containerHeight}" rx="35" fill="rgba(255,255,255,0.98)" filter="url(#shadow)"/>
  
  <!-- Live Badge -->
  <rect x="${width/2 - 110}" y="${containerTop + 40}" width="220" height="30" rx="15" fill="#48bb78"/>
  <circle cx="${width/2 - 80}" cy="${containerTop + 55}" r="5" fill="white" opacity="0.9">
    <animate attributeName="opacity" values="1;0.3;1" dur="1.5s" repeatCount="indefinite"/>
  </circle>
  <text x="${width/2 - 60}" y="${containerTop + 60}" font-family="Arial, sans-serif" font-size="15" font-weight="600" fill="white" text-anchor="start">SMART: Cache + Today</text>
  
  <!-- Title -->
  <text x="${width/2}" y="${containerTop + 120}" font-family="Arial, sans-serif" font-size="32" font-weight="700" fill="#2d3748" text-anchor="middle">Habit Streak</text>
  
  <!-- Completion Ring -->
  <circle cx="${width/2}" cy="${containerTop + 230}" r="70" fill="none" stroke="#e2e8f0" stroke-width="18"/>
  <circle cx="${width/2}" cy="${containerTop + 230}" r="70" fill="none" stroke="#48bb78" stroke-width="18" 
    stroke-dasharray="${2 * Math.PI * 70}" 
    stroke-dashoffset="${2 * Math.PI * 70 * (1 - completionRate / 100)}"
    transform="rotate(-90 ${width/2} ${containerTop + 230})"
    stroke-linecap="round"/>
  <circle cx="${width/2}" cy="${containerTop + 230}" r="52" fill="white"/>
  <text x="${width/2}" y="${containerTop + 242}" font-family="Arial, sans-serif" font-size="42" font-weight="700" fill="#2d3748" text-anchor="middle">${completionRate}%</text>
  <text x="${width/2}" y="${containerTop + 265}" font-family="Arial, sans-serif" font-size="15" fill="#718096" text-anchor="middle">Complete</text>
  
  <!-- Habits Grid -->
  ${habitsData.map((habit, habitIndex) => {
    const y = containerTop + 360 + habitIndex * rowHeight;
    const completed = habit.statuses.filter(s => s.status === 'completed').length;
    const habitName = habit.name.length > 25 ? habit.name.substring(0, 25) + '...' : habit.name;
    
    return `
  <!-- Habit Row Background -->
  <rect x="70" y="${y}" width="${containerWidth - 40}" rx="15" height="80" fill="#f7fafc"/>
  
  <!-- Habit Name -->
  <text x="90" y="${y + 32}" font-family="Arial, sans-serif" font-size="17" font-weight="600" fill="#2d3748">${habitName}</text>
  
  <!-- Habit Count -->
  <text x="${width - 90}" y="${y + 32}" font-family="Arial, sans-serif" font-size="15" fill="#718096" text-anchor="end">${completed}/${habit.statuses.length}</text>
  
  <!-- Days Strip -->
  ${habit.statuses.map((day, dayIndex) => {
    const x = 90 + dayIndex * (dotSize + dotGap);
    let fill = '#cbd5e0';
    
    if (day.status === 'completed') {
      fill = '#48bb78';
    } else if (day.status === 'in_progress') {
      fill = '#ecc94b';
    }
    
    return `<rect x="${x}" y="${y + 52}" width="${dotSize}" height="${dotSize}" rx="3" fill="${fill}"/>`;
  }).join('')}
    `;
  }).join('')}
  
  <!-- Stats Section -->
  <line x1="70" x2="${width - 70}" y1="${containerTop + 360 + habitsData.length * rowHeight + 30}" y2="${containerTop + 360 + habitsData.length * rowHeight + 30}" stroke="#e2e8f0" stroke-width="2"/>
  
  <!-- Stats -->
  <text x="${width/2 - 200}" y="${containerTop + 360 + habitsData.length * rowHeight + 80}" font-family="Arial, sans-serif" font-size="28" font-weight="700" fill="#2d3748" text-anchor="middle">${completedTotal}</text>
  <text x="${width/2 - 200}" y="${containerTop + 360 + habitsData.length * rowHeight + 105}" font-family="Arial, sans-serif" font-size="13" fill="#718096" text-anchor="middle" letter-spacing="1">COMPLETED</text>
  
  <text x="${width/2}" y="${containerTop + 360 + habitsData.length * rowHeight + 80}" font-family="Arial, sans-serif" font-size="28" font-weight="700" fill="#2d3748" text-anchor="middle">${habitsData.length}</text>
  <text x="${width/2}" y="${containerTop + 360 + habitsData.length * rowHeight + 105}" font-family="Arial, sans-serif" font-size="13" fill="#718096" text-anchor="middle" letter-spacing="1">HABITS</text>
  
  <text x="${width/2 + 200}" y="${containerTop + 360 + habitsData.length * rowHeight + 80}" font-family="Arial, sans-serif" font-size="28" font-weight="700" fill="#2d3748" text-anchor="middle">${daysToShow}</text>
  <text x="${width/2 + 200}" y="${containerTop + 360 + habitsData.length * rowHeight + 105}" font-family="Arial, sans-serif" font-size="13" fill="#718096" text-anchor="middle" letter-spacing="1">DAYS</text>
  
  <!-- Timestamp -->
  <text x="${width/2}" y="${containerTop + 360 + habitsData.length * rowHeight + 145}" font-family="Arial, sans-serif" font-size="13" fill="#a0aec0" text-anchor="middle">29 cached + today live - ${timestamp}</text>
  
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
