@echo off
echo.
echo ========================================
echo   Updating Habit Wallpaper Data
echo ========================================
echo.

echo [1/4] Fetching latest data from Habitify...
node getHabits.js

echo.
echo [2/4] Copying cache to API folder...
copy habitify-cache.json api\habitify-cache.json /Y

echo.
echo [3/4] Committing changes...
git add api/habitify-cache.json
git commit -m "Update habit data - %date% %time%"

echo.
echo [4/4] Deploying to Vercel...
git push

echo.
echo ========================================
echo   Update Complete!
echo   Wait 1-2 minutes for Vercel to deploy
echo ========================================
echo.
pause
