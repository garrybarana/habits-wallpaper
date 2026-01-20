import { ImageResponse } from '@vercel/og';
import type { NextRequest } from 'next/server';
import React from 'react';

export const config = {
  runtime: 'edge',
};

// Upstash KV REST API for Edge Runtime
async function kvGet(key: string) {
  const url = `${process.env.KV_REST_API_URL}/get/${key}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}` },
  });
  const data = await res.json();
  return data.result ? JSON.parse(data.result) : null;
}

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
  const formatted = targetDate.toISOString().slice(0, -5) + '+00:00';
  const encoded = encodeURIComponent(formatted);
  const url = `https://api.habitify.me/status/${habitId}?target_date=${encoded}`;

  const res = await fetch(url, {
    method: 'GET',
    headers: { Authorization: API_KEY }
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  
  const result = await res.json();
  return {
    date: targetDate.toISOString().split('T')[0],
    ...result.data
  };
}

export default async function handler(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const width = parseInt(searchParams.get('width') || '1284');
    const height = parseInt(searchParams.get('height') || '2778');
    const days = parseInt(searchParams.get('days') || '30');
    
    const cachedHabitsData: any = await kvGet('habitsData');
    const cachedHabits: any = await kvGet('habits');
    
    if (!cachedHabitsData || !cachedHabits) {
      return new Response('No cache available', { status: 503 });
    }
    
    const habitsMap: Record<string, string> = {};
    cachedHabits.data.forEach((h: any) => { habitsMap[h.id] = h.name; });
    
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const allHabitsData: any[] = [];
    
    for (const habitId of HABIT_IDS) {
      const cached = cachedHabitsData.find((h: any) => h.id === habitId);
      let statuses = cached ? [...cached.statuses] : [];
      statuses = statuses.filter((s: any) => s.date !== todayStr);
      
      try {
        const todayStatus = await getHabitStatus(habitId, today);
        statuses.push(todayStatus);
      } catch (e) {
        console.error(`Failed: ${habitId}`);
      }
      
      statuses = statuses.slice(-days);
      allHabitsData.push({
        id: habitId,
        name: habitsMap[habitId] || 'Unknown',
        statuses
      });
    }
    
    const completed = allHabitsData.reduce((sum, h) => 
      sum + h.statuses.filter((s: any) => s.status === 'completed').length, 0);
    const total = allHabitsData.reduce((sum, h) => sum + h.statuses.length, 0);
    const rate = total > 0 ? ((completed / total) * 100).toFixed(0) : 0;
    
    const pad = 60;
    const startY = 650;
    const headerH = 100;
    const cellSize = 16;
    const cellGap = 4;
    const rowH = 65;
    const nameW = 200;
    
    return new ImageResponse(
      (
        <div style={{
          width: width,
          height: height,
          backgroundColor: '#000000',
          display: 'flex',
          position: 'relative',
          fontFamily: 'Arial',
        }}>
          <div style={{
            position: 'absolute',
            top: startY,
            left: pad,
            display: 'flex',
            flexDirection: 'column',
          }}>
            <div style={{ fontSize: 40, fontWeight: 700, color: '#fff' }}>
              Habits
            </div>
            <div style={{ fontSize: 18, fontWeight: 500, color: '#666', marginTop: 10 }}>
              {rate}% complete
            </div>
          </div>
          
          <div style={{
            position: 'absolute',
            top: startY + headerH,
            left: pad,
            display: 'flex',
            flexDirection: 'column',
          }}>
            {allHabitsData.map((habit: any) => {
              const count = habit.statuses.filter((s: any) => s.status === 'completed').length;
              const name = HABIT_NAMES[habit.id as keyof typeof HABIT_NAMES] || 'Unknown';
              
              return (
                <div key={habit.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  marginBottom: rowH - 24,
                }}>
                  <div style={{ fontSize: 16, fontWeight: 500, color: '#fff', width: nameW }}>
                    {name}
                  </div>
                  
                  <div style={{ display: 'flex', gap: cellGap }}>
                    {habit.statuses.map((day: any, i: number) => {
                      let bg = '#1a1a1a';
                      if (day.status === 'completed') bg = '#fff';
                      else if (day.status === 'in_progress') bg = '#666';
                      
                      return (
                        <div key={i} style={{
                          width: cellSize,
                          height: cellSize,
                          backgroundColor: bg,
                          borderRadius: 5,
                        }} />
                      );
                    })}
                  </div>
                  
                  <div style={{ fontSize: 15, fontWeight: 500, color: '#666', marginLeft: 20 }}>
                    {count}
                  </div>
                </div>
              );
            })}
          </div>
          
          <div style={{
            position: 'absolute',
            bottom: 450,
            left: pad,
            fontSize: 14,
            color: '#333',
          }}>
            Updated {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      ),
      { width, height }
    );
  } catch (error: any) {
    return new Response('Error: ' + error.message, { status: 500 });
  }
}
