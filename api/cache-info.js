// Vercel Serverless Function to check cache status
const { Redis } = require('@upstash/redis');

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

module.exports = async (req, res) => {
  try {
    const lastUpdated = await redis.get('lastUpdated');
    const habits = await redis.get('habits');
    const habitsData = await redis.get('habitsData');
    
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
      storage: 'Upstash Redis',
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
