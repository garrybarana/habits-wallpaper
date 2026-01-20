const fs = require('fs');
const path = require('path');
const { getHabits, getHabitStatusForDays } = require('./getHabits.js');

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

async function generateHabitWallpaper(days = 30) {
  console.log(`\n🎨 Generating habit streak wallpaper for ${days} days...\n`);

  // Fetch habits data to get names
  const habitsResponse = await getHabits();
  const habitsMap = {};
  habitsResponse.data.forEach(habit => {
    habitsMap[habit.id] = habit.name;
  });

  // Collect status data for all habits
  const allHabitsData = [];
  for (const habitId of HABIT_IDS) {
    console.log(`Fetching ${days} days for ${habitsMap[habitId] || habitId}...`);
    const statuses = await getHabitStatusForDays(habitId, days);
    allHabitsData.push({
      id: habitId,
      name: habitsMap[habitId] || habitId,
      statuses: statuses
    });
  }

  // Generate HTML
  const html = generateHTML(allHabitsData, days);
  const outputPath = path.join(__dirname, 'habit-wallpaper.html');
  fs.writeFileSync(outputPath, html, 'utf8');
  
  console.log(`\n✅ Wallpaper generated: ${outputPath}`);
  console.log(`📂 Open in browser to view and download as image!`);
  
  return outputPath;
}

function generateHTML(habitsData, days) {
  const cellSize = 30;
  const gap = 4;
  const labelWidth = 300;
  const headerHeight = 60;
  const padding = 40;
  
  const canvasWidth = labelWidth + (cellSize + gap) * days + padding * 2;
  const canvasHeight = headerHeight + (cellSize + gap) * habitsData.length + padding * 2;

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Habit Streak Calendar</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 40px 20px;
        }
        
        .container {
            background: white;
            border-radius: 20px;
            padding: 40px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            max-width: 95vw;
            overflow-x: auto;
        }
        
        h1 {
            text-align: center;
            color: #2d3748;
            margin-bottom: 10px;
            font-size: 2.5em;
        }
        
        .subtitle {
            text-align: center;
            color: #718096;
            margin-bottom: 30px;
            font-size: 1.1em;
        }
        
        .calendar {
            display: flex;
            flex-direction: column;
            gap: ${gap}px;
            margin-top: 20px;
        }
        
        .habit-row {
            display: flex;
            align-items: center;
            gap: ${gap}px;
        }
        
        .habit-label {
            width: ${labelWidth}px;
            font-weight: 600;
            color: #2d3748;
            font-size: 14px;
            padding-right: 20px;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        
        .streak-count {
            font-size: 12px;
            color: #718096;
            font-weight: normal;
        }
        
        .days-container {
            display: flex;
            gap: ${gap}px;
        }
        
        .day-cell {
            width: ${cellSize}px;
            height: ${cellSize}px;
            border-radius: 6px;
            position: relative;
            cursor: pointer;
            transition: transform 0.2s, box-shadow 0.2s;
        }
        
        .day-cell:hover {
            transform: scale(1.15);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
            z-index: 10;
        }
        
        .day-cell.completed {
            background: linear-gradient(135deg, #48bb78, #38a169);
        }
        
        .day-cell.in-progress {
            background: linear-gradient(135deg, #ecc94b, #d69e2e);
        }
        
        .day-cell.skipped {
            background: #e2e8f0;
        }
        
        .day-cell::after {
            content: attr(data-date);
            position: absolute;
            bottom: -20px;
            left: 50%;
            transform: translateX(-50%);
            font-size: 9px;
            color: #a0aec0;
            white-space: nowrap;
            opacity: 0;
            transition: opacity 0.2s;
        }
        
        .day-cell:hover::after {
            opacity: 1;
        }
        
        .legend {
            display: flex;
            justify-content: center;
            gap: 30px;
            margin-top: 40px;
            padding-top: 30px;
            border-top: 2px solid #e2e8f0;
        }
        
        .legend-item {
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: 14px;
            color: #4a5568;
        }
        
        .legend-box {
            width: 24px;
            height: 24px;
            border-radius: 4px;
        }
        
        .stats {
            display: flex;
            justify-content: space-around;
            margin-top: 30px;
            padding: 20px;
            background: #f7fafc;
            border-radius: 12px;
        }
        
        .stat-item {
            text-align: center;
        }
        
        .stat-value {
            font-size: 2em;
            font-weight: bold;
            color: #2d3748;
        }
        
        .stat-label {
            font-size: 0.9em;
            color: #718096;
            margin-top: 5px;
        }
        
        .download-btn {
            margin-top: 30px;
            padding: 15px 40px;
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            border: none;
            border-radius: 10px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: transform 0.2s, box-shadow 0.2s;
            display: block;
            margin-left: auto;
            margin-right: auto;
        }
        
        .download-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 25px rgba(102, 126, 234, 0.4);
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎯 Habit Streak Calendar</h1>
        <div class="subtitle">Your ${days}-Day Habit Journey</div>
        
        <div class="calendar">
            ${generateHabitRows(habitsData)}
        </div>
        
        <div class="legend">
            <div class="legend-item">
                <div class="legend-box completed"></div>
                <span>Completed</span>
            </div>
            <div class="legend-item">
                <div class="legend-box in-progress"></div>
                <span>In Progress</span>
            </div>
            <div class="legend-item">
                <div class="legend-box skipped"></div>
                <span>Not Done</span>
            </div>
        </div>
        
        ${generateStats(habitsData, days)}
        
        <button class="download-btn" onclick="downloadImage()">📸 Download as Image</button>
    </div>
    
    <script>
        function downloadImage() {
            // For now, users can use browser screenshot
            alert('Use your browser\\'s screenshot tool or "Print to PDF" to save this as an image!\\n\\nChrome: Right-click → "Save as PDF"\\nWindows: Win + Shift + S\\nMac: Cmd + Shift + 4');
        }
    </script>
</body>
</html>`;
}

function generateHabitRows(habitsData) {
  return habitsData.map(habit => {
    const completedCount = habit.statuses.filter(s => s.status === 'completed').length;
    const cells = habit.statuses.map(day => {
      const statusClass = day.status === 'completed' ? 'completed' : 
                         day.status === 'in_progress' ? 'in-progress' : 'skipped';
      return `<div class="day-cell ${statusClass}" data-date="${day.date}" title="${day.date}: ${day.status}"></div>`;
    }).join('');
    
    return `
      <div class="habit-row">
        <div class="habit-label">
          <span>${habit.name}</span>
          <span class="streak-count">${completedCount}/${habit.statuses.length}</span>
        </div>
        <div class="days-container">${cells}</div>
      </div>
    `;
  }).join('');
}

function generateStats(habitsData, days) {
  const totalDays = habitsData.length * days;
  const totalCompleted = habitsData.reduce((sum, habit) => 
    sum + habit.statuses.filter(s => s.status === 'completed').length, 0);
  const completionRate = ((totalCompleted / totalDays) * 100).toFixed(1);
  
  const bestHabit = habitsData.reduce((best, habit) => {
    const completed = habit.statuses.filter(s => s.status === 'completed').length;
    const bestCompleted = best.statuses.filter(s => s.status === 'completed').length;
    return completed > bestCompleted ? habit : best;
  });
  
  return `
    <div class="stats">
      <div class="stat-item">
        <div class="stat-value">${totalCompleted}</div>
        <div class="stat-label">Total Completed</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">${completionRate}%</div>
        <div class="stat-label">Completion Rate</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">${habitsData.length}</div>
        <div class="stat-label">Habits Tracked</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">${days}</div>
        <div class="stat-label">Days Tracked</div>
      </div>
    </div>
  `;
}

// Run the generator
const days = process.argv[2] ? parseInt(process.argv[2]) : 30;
generateHabitWallpaper(days)
  .then(path => {
    console.log(`\n🎉 Done! Open the file to see your habit calendar.`);
  })
  .catch(error => {
    console.error('Error generating wallpaper:', error);
  });
