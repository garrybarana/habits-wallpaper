// Vercel Serverless Function to update cache
// Call this endpoint to refresh the cache: /api/update-cache

const https = require('https');
const fs = require('fs');
const path = require('path');

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

async function getHabits() {
  return await httpsRequest('https://api.habitify.me/habits', {
    method: 'GET',
    headers: { 'Authorization': API_KEY }
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

async function getHabitStatusForDays(habitId, days = 30) {
  const statuses = [];
  const today = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() - i);
    
    try {
      const status = await getHabitStatus(habitId, targetDate);
      statuses.push(status);
    } catch (error) {
      console.error(`Failed: ${targetDate.toISOString().split('T')[0]}`);
    }
  }

  return statuses;
}

module.exports = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    
    console.log('Fetching habits...');
    const habitsResponse = await getHabits();
    const habitsMap = {};
    habitsResponse.data.forEach(habit => {
      habitsMap[habit.id] = habit.name;
    });
    
    console.log('Fetching statuses for all habits...');
    const allHabitsData = [];
    for (const habitId of HABIT_IDS) {
      console.log(`Fetching ${habitsMap[habitId]}...`);
      const statuses = await getHabitStatusForDays(habitId, days);
      allHabitsData.push({
        id: habitId,
        name: habitsMap[habitId] || 'Unknown',
        statuses: statuses
      });
    }
    
    const cacheData = {
      habits: habitsResponse,
      habitsData: allHabitsData,
      updatedAt: new Date().toISOString()
    };
    
    // Write to cache file (this will be in the deployment, commit and push to update)
    const cachePath = path.join(__dirname, 'habitify-cache.json');
    fs.writeFileSync(cachePath, JSON.stringify(cacheData, null, 2));
    
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json({
      success: true,
      message: 'Cache updated successfully',
      habitsCount: HABIT_IDS.length,
      daysCount: days,
      totalRecords: allHabitsData.reduce((sum, h) => sum + h.statuses.length, 0),
      updatedAt: cacheData.updatedAt,
      note: 'Commit and push api/habitify-cache.json to persist this cache'
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
