import { ImageResponse } from '@vercel/og';
import { kv } from '@vercel/kv';

export const config = {
  runtime: 'edge',
};

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
  const API_KEY = '70f7803269df1fc25ae36ec212690aa7cb0f2af66b1625b39d1fe981d203e733';
  const formatDate = (date) => date.toISOString().slice(0, -5) + '+00:00';
  const formattedDate = formatDate(targetDate);
  const encodedDate = encodeURIComponent(formattedDate);
  const url = `https://api.habitify.me/status/${habitId}?target_date=${encodedDate}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: { 'Authorization': API_KEY }
  });

  const result = await response.json();
  return {
    date: targetDate.toISOString().split('T')[0],
    ...result.data
  };
}

export default async function handler(req) {
  try {
    const { searchParams } = new URL(req.url);
    const width = parseInt(searchParams.get('width')) || 1284;
    const height = parseInt(searchParams.get('height')) || 2778;
    const days = parseInt(searchParams.get('days')) || 30;
    
    const cachedHabitsData = await kv.get('habitsData');
    const cachedHabits = await kv.get('habits');
    
    let allHabitsData = [];
    
    if (cachedHabitsData && cachedHabits) {
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
          name: HABIT_NAMES[habitId] || 'Unknown',
          statuses: statuses
        });
      }
    } else {
      return new Response('No cache available', { status: 503 });
    }
    
    const completedTotal = allHabitsData.reduce((sum, habit) => 
      sum + habit.statuses.filter(s => s.status === 'completed').length, 0);
    const totalDays = allHabitsData.reduce((sum, habit) => sum + habit.statuses.length, 0);
    const completionRate = totalDays > 0 ? Math.round((completedTotal / totalDays) * 100) : 0;
    
    const padding = 60;
    const startY = 650;
    const cellSize = 16;
    const cellGap = 4;
    const habitNameWidth = 200;
    
    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            justifyContent: 'flex-start',
            backgroundColor: '#000',
            padding: `${startY}px ${padding}px 450px ${padding}px`,
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '100px' }}>
            <div style={{ fontSize: 40, fontWeight: 700, color: '#fff', letterSpacing: '-1px' }}>
              Habits
            </div>
            <div style={{ fontSize: 18, fontWeight: 500, color: '#666', marginTop: '10px' }}>
              {completionRate}% complete
            </div>
          </div>
          
          {/* Habits Grid */}
          {allHabitsData.map((habit, habitIndex) => {
            const completed = habit.statuses.filter(s => s.status === 'completed').length;
            
            return (
              <div
                key={habit.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  marginBottom: '15px',
                  width: '100%',
                }}
              >
                {/* Habit Name */}
                <div style={{ width: habitNameWidth, fontSize: 16, fontWeight: 500, color: '#fff' }}>
                  {habit.name}
                </div>
                
                {/* Days Grid */}
                <div style={{ display: 'flex', gap: `${cellGap}px`, marginLeft: '0px' }}>
                  {habit.statuses.map((day, dayIndex) => {
                    let bgColor = '#1a1a1a';
                    if (day.status === 'completed') {
                      bgColor = '#fff';
                    } else if (day.status === 'in_progress') {
                      bgColor = '#666';
                    }
                    
                    return (
                      <div
                        key={dayIndex}
                        style={{
                          width: cellSize,
                          height: cellSize,
                          borderRadius: '5px',
                          backgroundColor: bgColor,
                        }}
                      />
                    );
                  })}
                </div>
                
                {/* Completion Count */}
                <div style={{ fontSize: 15, fontWeight: 500, color: '#666', marginLeft: '20px' }}>
                  {completed}
                </div>
              </div>
            );
          })}
        </div>
      ),
      {
        width,
        height,
      }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response('Error generating wallpaper', { status: 500 });
  }
}
