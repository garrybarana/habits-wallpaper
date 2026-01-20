import { ImageResponse } from '@vercel/og';
import { kv } from '@vercel/kv';

export const config = {
  runtime: 'edge',
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

function HabitWallpaper({ habitsData, width, height }) {
  // Calculate metrics
  const completedTotal = habitsData.reduce((sum, habit) => 
    sum + habit.statuses.filter(s => s.status === 'completed').length, 0);
  const totalDays = habitsData.reduce((sum, habit) => sum + habit.statuses.length, 0);
  const completionRate = totalDays > 0 ? ((completedTotal / totalDays) * 100).toFixed(0) : 0;
  
  const daysToShow = habitsData[0]?.statuses.length || 30;
  
  // Layout config - iPhone lock screen safe zones
  const padding = 60;
  const startY = 650; // Below clock area
  const headerHeight = 100;
  const cellSize = 16;
  const cellGap = 4;
  const rowHeight = 65;
  const habitNameWidth = 200;
  
  return (
    <div
      style={{
        width: width,
        height: height,
        backgroundColor: '#000000',
        display: 'flex',
        position: 'relative',
      }}
    >
      {/* Header Section */}
      <div
        style={{
          position: 'absolute',
          left: padding,
          top: startY,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            fontSize: 40,
            fontWeight: 700,
            color: '#ffffff',
          }}
        >
          Habits
        </div>
        <div
          style={{
            fontSize: 18,
            fontWeight: 500,
            color: '#666666',
            marginTop: 10,
          }}
        >
          {completionRate}% complete
        </div>
      </div>

      {/* Habits Rows */}
      {habitsData.map((habit, habitIndex) => {
        const y = startY + headerHeight + habitIndex * rowHeight;
        const completed = habit.statuses.filter(s => s.status === 'completed').length;
        const habitName = HABIT_NAMES[habit.id] || 'Unknown';
        const x = padding + habitNameWidth;

        return (
          <div
            key={habit.id}
            style={{
              position: 'absolute',
              left: padding,
              top: y,
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            {/* Habit Name */}
            <div
              style={{
                width: habitNameWidth,
                fontSize: 16,
                fontWeight: 500,
                color: '#ffffff',
              }}
            >
              {habitName}
            </div>

            {/* Day Dots Container */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'row',
              }}
            >
              {habit.statuses.map((day, dayIndex) => {
                let dotColor = '#1a1a1a'; // Default dark
                
                if (day.status === 'completed') {
                  dotColor = '#ffffff'; // White for completed
                } else if (day.status === 'in_progress') {
                  dotColor = '#666666'; // Gray for in progress
                }

                return (
                  <div
                    key={dayIndex}
                    style={{
                      width: cellSize,
                      height: cellSize,
                      borderRadius: 5,
                      backgroundColor: dotColor,
                      marginLeft: dayIndex === 0 ? 0 : cellGap,
                    }}
                  />
                );
              })}
            </div>

            {/* Completion Count */}
            <div
              style={{
                marginLeft: 20,
                fontSize: 15,
                fontWeight: 500,
                color: '#666666',
              }}
            >
              {completed}
            </div>
          </div>
        );
      })}

      {/* Footer Timestamp */}
      <div
        style={{
          position: 'absolute',
          left: padding,
          bottom: 450,
          fontSize: 14,
          fontWeight: 400,
          color: '#333333',
        }}
      >
        Updated {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
      </div>
    </div>
  );
}

export default async function handler(req) {
  try {
    const { searchParams } = new URL(req.url);
    const width = parseInt(searchParams.get('width')) || 1284;
    const height = parseInt(searchParams.get('height')) || 2778;
    const days = parseInt(searchParams.get('days')) || 30;
    
    // Get cached data
    const cachedHabitsData = await kv.get('habitsData');
    const cachedHabits = await kv.get('habits');
    
    if (!cachedHabitsData || !cachedHabits) {
      return new Response('No cache available. Please wait for data to sync.', { status: 503 });
    }
    
    // Build habits map
    const habitsMap = {};
    cachedHabits.data.forEach(habit => {
      habitsMap[habit.id] = habit.name;
    });
    
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    // Prepare habits data
    const allHabitsData = [];
    
    for (const habitId of HABIT_IDS) {
      const cachedHabit = cachedHabitsData.find(h => h.id === habitId);
      let statuses = cachedHabit ? [...cachedHabit.statuses] : [];
      
      // Remove today's cached data and fetch fresh
      statuses = statuses.filter(s => s.date !== todayStr);
      
      try {
        const todayStatus = await getHabitStatus(habitId, today);
        statuses.push(todayStatus);
      } catch (error) {
        console.error(`Failed to fetch today's status for ${habitId}`);
      }
      
      // Keep only the requested number of days
      statuses = statuses.slice(-days);
      
      allHabitsData.push({
        id: habitId,
        name: habitsMap[habitId] || 'Unknown',
        statuses: statuses
      });
    }
    
    // Generate image using Vercel OG
    return new ImageResponse(
      <HabitWallpaper habitsData={allHabitsData} width={width} height={height} />,
      {
        width,
        height,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      }
    );
  } catch (error) {
    console.error('Error generating wallpaper:', error);
    return new Response('Error generating wallpaper: ' + error.message, { status: 500 });
  }
}
