@echo off
setlocal
pushd "%~dp0"
where py >nul 2>&1
if errorlevel 1 (
  python scripts\install-art.py --package %*
) else (
  py -3 scripts\install-art.py --package %*
)
set "arcana_status=%errorlevel%"
popd
if not "%arcana_status%"=="0" echo See README.md for the manual artwork download.
pause
exit /b %arcana_status%

