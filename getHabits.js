const API_KEY = '70f7803269df1fc25ae36ec212690aa7cb0f2af66b1625b39d1fe981d203e733';
const fs = require('fs');
const path = require('path');

const CACHE_FILE = path.join(__dirname, 'habitify-cache.json');

/**
 * Loads cache from file
 * @returns {Object} Cache object
 */
function loadCache() {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const data = fs.readFileSync(CACHE_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading cache:', error.message);
  }
  return { habits: null, habitLogs: {}, habitStatus: {} };
}

/**
 * Saves cache to file
 * @param {Object} cache - Cache object to save
 */
function saveCache(cache) {
  try {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2), 'utf8');
  } catch (error) {
    console.error('Error saving cache:', error.message);
  }
}

/**
 * Checks if a date is in the past (not today)
 * @param {string} dateString - Date string in YYYY-MM-DD format
 * @returns {boolean}
 */
function isPastDate(dateString) {
  const today = new Date().toISOString().split('T')[0];
  return dateString < today;
}

/**
 * Fetches the list of habits from Habitify API
 * @param {boolean} forceRefresh - Force refresh from API
 * @returns {Promise<Object>} Habits response object
 */
async function getHabits(forceRefresh = false) {
  const cache = loadCache();
  
  // Return cached habits if available and not forcing refresh
  if (!forceRefresh && cache.habits) {
    console.log('✓ Using cached habits data');
    return cache.habits;
  }

  try {
    console.log('→ Fetching habits from API...');
    const response = await fetch('https://api.habitify.me/habits', {
      method: 'GET',
      headers: {
        'Authorization': API_KEY
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    // Save to cache
    cache.habits = data;
    saveCache(cache);
    
    return data;
  } catch (error) {
    console.error('Error fetching habits:', error.message);
    throw error;
  }
}

/**
 * Fetches logs for a specific habit
 * @param {string} habitId - The habit ID
 * @param {number} days - Number of days to fetch logs for (default: 7)
 * @param {boolean} forceRefresh - Force refresh from API
 * @returns {Promise<Array>} Array of logs
 */
async function getHabitLogs(habitId, days = 7, forceRefresh = false) {
  const cache = loadCache();
  const cacheKey = `${habitId}_${days}days`;
  
  // Check if we have cached logs
  if (!forceRefresh && cache.habitLogs[cacheKey]) {
    console.log(`✓ Using cached logs for habit ${habitId}`);
    return cache.habitLogs[cacheKey];
  }

  try {
    // Calculate date range
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - days);

    // Format dates as YYYY-MM-DDThh:mm:ss±hh:mm (ISO 8601 with timezone)
    const formatDate = (date) => {
      return date.toISOString().slice(0, -5) + '+00:00';
    };

    const fromDate = formatDate(from);
    const toDate = formatDate(to);

    const url = `https://api.habitify.me/logs/${habitId}?from=${encodeURIComponent(fromDate)}&to=${encodeURIComponent(toDate)}`;

    console.log(`→ Fetching logs from API...`);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': API_KEY
      }
    });
    
    if (!response.ok) {
      const errorBody = await response.text();
      console.error('Error response body:', errorBody);
      throw new Error(`HTTP error! status: ${response.status}, body: ${errorBody}`);
    }

    const result = await response.json();
    
    // Save to cache
    cache.habitLogs[cacheKey] = result.data;
    saveCache(cache);
    
    return result.data;
  } catch (error) {
    console.error('Error fetching habit logs:', error.message);
    throw error;
  }
}

/**
 * Fetches habit status for a specific date
 * @param {string} habitId - The habit ID
 * @param {Date} targetDate - The date to get status for
 * @param {boolean} forceRefresh - Force refresh from API
 * @returns {Promise<Object>} Status object
 */
async function getHabitStatus(habitId, targetDate, forceRefresh = false) {
  const cache = loadCache();
  const dateString = targetDate.toISOString().split('T')[0];
  const cacheKey = `${habitId}_${dateString}`;
  
  // For past dates, use cache if available
  if (!forceRefresh && isPastDate(dateString) && cache.habitStatus[cacheKey]) {
    console.log(`✓ Using cached status for ${dateString} (past date)`);
    return cache.habitStatus[cacheKey];
  }

  try {
    console.log(`→ Fetching status for ${dateString} from API...`);
    
    // Format date as YYYY-MM-DDThh:mm:ss±hh:mm (ISO 8601 with timezone)
    const formatDate = (date) => {
      return date.toISOString().slice(0, -5) + '+00:00';
    };

    const formattedDate = formatDate(targetDate);
    const url = `https://api.habitify.me/status/${habitId}?target_date=${encodeURIComponent(formattedDate)}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': API_KEY
      }
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, body: ${errorBody}`);
    }

    const result = await response.json();
    const statusData = {
      date: dateString,
      ...result.data
    };
    
    // Save to cache (especially important for past dates)
    cache.habitStatus[cacheKey] = statusData;
    saveCache(cache);
    
    return statusData;
  } catch (error) {
    console.error(`Error fetching habit status for ${dateString}:`, error.message);
    throw error;
  }
}

/**
 * Fetches habit status for multiple days
 * @param {string} habitId - The habit ID
 * @param {number} days - Number of days to fetch status for (default: 7)
 * @param {boolean} forceRefresh - Force refresh from API for all dates
 * @returns {Promise<Array>} Array of status objects
 */
async function getHabitStatusForDays(habitId, days = 7, forceRefresh = false) {
  const statuses = [];
  const today = new Date();
  let apiCalls = 0;
  let cacheHits = 0;

  for (let i = days - 1; i >= 0; i--) {
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() - i);
    const dateString = targetDate.toISOString().split('T')[0];
    
    try {
      // Only force refresh for today's date if not explicitly forcing all
      const shouldForceRefresh = forceRefresh || !isPastDate(dateString);
      const status = await getHabitStatus(habitId, targetDate, shouldForceRefresh);
      statuses.push(status);
      
      if (shouldForceRefresh || !isPastDate(dateString)) {
        apiCalls++;
      } else {
        cacheHits++;
      }
    } catch (error) {
      console.error(`Failed to get status for ${dateString}`);
    }
  }

  console.log(`\n📊 API calls made: ${apiCalls}, Cache hits: ${cacheHits}`);
  return statuses;
}

/**
 * Clear cache for a specific habit or all cache
 * @param {string} habitId - Optional habit ID to clear specific cache
 */
function clearCache(habitId = null) {
  if (habitId) {
    const cache = loadCache();
    // Clear specific habit data
    Object.keys(cache.habitStatus).forEach(key => {
      if (key.startsWith(habitId)) {
        delete cache.habitStatus[key];
      }
    });
    Object.keys(cache.habitLogs).forEach(key => {
      if (key.startsWith(habitId)) {
        delete cache.habitLogs[key];
      }
    });
    saveCache(cache);
    console.log(`Cache cleared for habit ${habitId}`);
  } else {
    // Clear all cache
    if (fs.existsSync(CACHE_FILE)) {
      fs.unlinkSync(CACHE_FILE);
      console.log('All cache cleared');
    }
  }
}

// Example usage for getting status for multiple habits
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

async function fetchAllHabitsStatus() {
  console.log(`\n🔄 Fetching 7-day status for ${HABIT_IDS.length} habits...\n`);
  
  const allResults = {};
  let totalApiCalls = 0;
  let totalCacheHits = 0;

  for (const habitId of HABIT_IDS) {
    try {
      console.log(`\n━━━ Processing habit: ${habitId} ━━━`);
      const statuses = await getHabitStatusForDays(habitId, 7);
      
      // Calculate stats
      const completed = statuses.filter(s => s.status === 'completed').length;
      const inProgress = statuses.filter(s => s.status === 'in_progress').length;
      const skipped = statuses.filter(s => s.status === 'skipped').length;
      
      allResults[habitId] = {
        statuses,
        summary: { completed, inProgress, skipped, total: statuses.length }
      };
      
      console.log(`✓ Completed: ${completed}/7 | ⏳ In Progress: ${inProgress}/7 | ⏭ Skipped: ${skipped}/7`);
      
    } catch (error) {
      console.error(`❌ Failed to get status for habit ${habitId}:`, error.message);
    }
  }
  
  // Overall summary
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📊 OVERALL SUMMARY`);
  console.log(`${'='.repeat(60)}`);
  
  let totalCompleted = 0;
  let totalInProgress = 0;
  let totalSkipped = 0;
  let totalDays = 0;
  
  Object.values(allResults).forEach(result => {
    totalCompleted += result.summary.completed;
    totalInProgress += result.summary.inProgress;
    totalSkipped += result.summary.skipped;
    totalDays += result.summary.total;
  });
  
  console.log(`Total habits tracked: ${Object.keys(allResults).length}`);
  console.log(`Total days data: ${totalDays}`);
  console.log(`✓ Total completed: ${totalCompleted}`);
  console.log(`⏳ Total in progress: ${totalInProgress}`);
  console.log(`⏭ Total skipped: ${totalSkipped}`);
  console.log(`\nCompletion rate: ${((totalCompleted / totalDays) * 100).toFixed(1)}%`);
  
  return allResults;
}

fetchAllHabitsStatus()
  .then(results => {
    console.log(`\n✅ Successfully fetched data for ${Object.keys(results).length} habits!`);
  })
  .catch(error => {
    console.error('Failed to fetch habits status:', error);
  });

// Export for use in other modules
module.exports = { 
  getHabits, 
  getHabitLogs, 
  getHabitStatus, 
  getHabitStatusForDays,
  clearCache
};
