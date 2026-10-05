@echo off
echo ==========================================
echo   CLEANING OLD ALLURE RESULTS
echo ==========================================
call npm run allure:clean

echo.
echo ==========================================
echo   RUNNING PLAYWRIGHT TEST
echo ==========================================
call npx playwright test tests/e2e/ar-invoice.spec.ts --headed

echo.
echo ==========================================
echo   STARTING ALLURE REPORT SERVER
echo ==========================================
call npm run allure:serve

pause
