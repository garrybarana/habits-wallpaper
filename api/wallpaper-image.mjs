import { kv } from '@vercel/kv';

export const config = {
  runtime: 'nodejs',
};

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

const HABIT_NAMES = {
  '1FE92BED-FEF3-4AB1-A9F9-9093B8C35B68': 'VSCODE Challenge',
  '19166B2B-9887-4615-9E0E-29B897EBADD7': 'Eat Garlic',
  'BF97B26A-D809-401D-A280-2216A72ED94F': 'Meditate',
  '9CB275E2-7481-4711-B695-8CA5FDF3FC69': '7 Hours Sleep',
  '26DC91FB-B45D-4C0C-96FE-E873E171CF51': 'Daily Walk',
  '75F72DD4-A73A-41E5-B518-A38F1C02ACA6': 'Read 30 Mins',
  '30AD6D84-AC03-43EE-9935-B340BE1ABD86': 'Skin Care',
  'B8AF262B-C7E5-4061-88A3-EABF1A090F3B': 'Drink Water'
};

async function getHabitStatus(habitId, targetDate) {
  const formatDate = (date) => date.toISOString().slice(0, -5) + '+00:00';
  const formattedDate = formatDate(targetDate);
  const encodedDate = encodeURIComponent(formattedDate);
  const url = `https://api.habitify.me/status/${habitId}?target_date=${encodedDate}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: { 'Authorization': API_KEY }
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const result = await response.json();
  return {
    date: targetDate.toISOString().split('T')[0],
    ...result.data
  };
}

function generateSVG(habitsData, width, height) {
  const completedTotal = habitsData.reduce((sum, habit) => 
    sum + habit.statuses.filter(s => s.status === 'completed').length, 0);
  const totalDays = habitsData.reduce((sum, habit) => sum + habit.statuses.length, 0);
  const completionRate = totalDays > 0 ? ((completedTotal / totalDays) * 100).toFixed(0) : 0;
  
  const daysToShow = habitsData[0]?.statuses.length || 30;
  
  const padding = 60;
  const startY = 650;
  const headerHeight = 100;
  const cellSize = 16;
  const cellGap = 4;
  const rowHeight = 65;
  const habitNameWidth = 200;
  
  let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${width}" height="${height}" fill="#000000"/>
  
  <text x="${padding}" y="${startY}" font-size="40" font-weight="700" fill="#ffffff" font-family="Arial, sans-serif">Habits</text>
  <text x="${padding}" y="${startY + 45}" font-size="18" font-weight="500" fill="#666666" font-family="Arial, sans-serif">${completionRate}% complete</text>
  `;

  habitsData.forEach((habit, habitIndex) => {
    const y = startY + headerHeight + habitIndex * rowHeight;
    const completed = habit.statuses.filter(s => s.status === 'completed').length;
    const habitName = HABIT_NAMES[habit.id] || 'Unknown';
    
    svg += `
  <text x="${padding}" y="${y + 24}" font-size="16" font-weight="500" fill="#ffffff" font-family="Arial, sans-serif">${habitName}</text>`;
    
    habit.statuses.forEach((day, dayIndex) => {
      const x = padding + habitNameWidth + dayIndex * (cellSize + cellGap);
      let fill = '#1a1a1a';
      
      if (day.status === 'completed') {
        fill = '#ffffff';
      } else if (day.status === 'in_progress') {
        fill = '#666666';
      }
      
      svg += `
  <rect x="${x}" y="${y + 10}" width="${cellSize}" height="${cellSize}" rx="5" fill="${fill}"/>`;
    });
    
    svg += `
  <text x="${padding + habitNameWidth + daysToShow * (cellSize + cellGap) + 20}" y="${y + 24}" font-size="15" font-weight="500" fill="#666666" font-family="Arial, sans-serif">${completed}</text>`;
  });
  
  svg += `
  
  <text x="${padding}" y="${height - 450}" font-size="14" font-weight="400" fill="#333333" font-family="Arial, sans-serif">Updated ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</text>
</svg>`;
  
  return svg;
}

export default async function handler(req, res) {
  try {
    // Parse query parameters from Vercel serverless function
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const width = parseInt(url.searchParams.get('width')) || 1284;
    const height = parseInt(url.searchParams.get('height')) || 2778;
    const days = parseInt(url.searchParams.get('days')) || 30;
    
    const cachedHabitsData = await kv.get('habitsData');
    const cachedHabits = await kv.get('habits');
    
    if (!cachedHabitsData || !cachedHabits) {
      res.status(503).send('No cache available. Please wait for data to sync.');
      return;
    }
    
    const habitsMap = {};
    cachedHabits.data.forEach(habit => {
      habitsMap[habit.id] = habit.name;
    });
    
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    const allHabitsData = [];
    
    for (const habitId of HABIT_IDS) {
      const cachedHabit = cachedHabitsData.find(h => h.id === habitId);
      let statuses = cachedHabit ? [...cachedHabit.statuses] : [];
      statuses = statuses.filter(s => s.date !== todayStr);
      
      try {
        const todayStatus = await getHabitStatus(habitId, today);
        statuses.push(todayStatus);
      } catch (error) {
        console.error(`Failed to fetch today's status for ${habitId}`);
      }
      
      statuses = statuses.slice(-days);
      
      allHabitsData.push({
        id: habitId,
        name: habitsMap[habitId] || 'Unknown',
        statuses: statuses
      });
    }
    
    const svgContent = generateSVG(allHabitsData, width, height);
    
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.status(200).send(svgContent);
  } catch (error) {
    console.error('Error generating wallpaper:', error);
    res.status(500).send('Error generating wallpaper: ' + error.message);
  }
}
