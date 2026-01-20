// Vercel Serverless Function to check cache status
const { kv } = require('@vercel/kv');

module.exports = async (req, res) => {
  try {
    const lastUpdated = await kv.get('lastUpdated');
    const habits = await kv.get('habits');
    const habitsData = await kv.get('habitsData');
    
    const hasCachedData = !!(habits && habitsData);
    const cacheAge = lastUpdated 
      ? Math.floor((Date.now() - new Date(lastUpdated).getTime()) / 1000 / 60) 
      : null;
    
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json({
      cached: hasCachedData,
      lastUpdated: lastUpdated || 'Never',
      cacheAgeMinutes: cacheAge,
      cacheAgeFormatted: cacheAge ? `${Math.floor(cacheAge / 60)}h ${cacheAge % 60}m ago` : 'No cache',
      habitsCount: habits?.data?.length || 0,
      habitsDataCount: habitsData?.length || 0,
      totalStatuses: habitsData?.reduce((sum, h) => sum + h.statuses.length, 0) || 0,
      storage: 'Vercel KV',
      ttl: '24 hours',
      updateUrl: '/api/update-cache'
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
      cached: false
    });
  }
};
