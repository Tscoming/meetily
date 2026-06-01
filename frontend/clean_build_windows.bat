@echo off
setlocal EnableExtensions EnableDelayedExpansion

echo.
echo ========================================
echo   Meetily Windows Installer Build
echo ========================================
echo.

REM Problems fixed from the Windows packaging run:
REM 1. Existing Next/Tauri dev processes can keep port 3118 and Cargo build locks open.
REM 2. Visual Studio BuildTools includes CMake, but its cmake.exe is not always on PATH.
REM 3. whisper.cpp contains UTF-8 string literals; MSVC must compile with /utf-8 on non-English code pages.
REM 4. tauri.conf.json enables updater artifacts, which require TAURI_SIGNING_PRIVATE_KEY.
REM    The Windows installer config used below disables updater artifacts for local installer builds.

echo [1/6] Stopping stale frontend/Tauri development processes...
for /f "tokens=5" %%P in ('netstat -aon ^| findstr ":3118" 2^>nul') do (
    if not "%%P"=="0" (
        echo   Stopping process on port 3118: %%P
        taskkill /F /PID %%P >nul 2>nul
    )
)

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$patterns = @('tauri\.js.* dev', 'next.* dev', 'pnpm.* tauri:dev', 'pnpm.* dev', 'cargo.* run --no-default-features');" ^
  "Get-CimInstance Win32_Process | Where-Object { $cmd = $_.CommandLine; $cmd -and ($patterns | Where-Object { $cmd -match $_ }) } | ForEach-Object { Write-Host ('  Stopping stale process: {0} {1}' -f $_.ProcessId, $_.Name); Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }"

echo.
echo [2/6] Checking CMake...
where cmake >nul 2>nul
if errorlevel 1 (
    set "VS_CMAKE=C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\Common7\IDE\CommonExtensions\Microsoft\CMake\CMake\bin"
    if exist "!VS_CMAKE!\cmake.exe" (
        set "PATH=!VS_CMAKE!;!PATH!"
        echo   Added Visual Studio BuildTools CMake to PATH.
    ) else (
        echo   ERROR: cmake.exe was not found.
        echo   Install CMake or Visual Studio BuildTools CMake tools, then run this script again.
        exit /b 1
    )
) else (
    for /f "delims=" %%C in ('where cmake') do (
        echo   Found CMake: %%C
    )
)

echo.
echo [3/6] Enabling MSVC UTF-8 source decoding...
if defined CL (
    set "CL=/utf-8 %CL%"
) else (
    set "CL=/utf-8"
)
echo   CL=%CL%

echo.
echo [4/6] Cleaning frontend build caches...
if exist .next rd /s /q .next
if exist out rd /s /q out
if exist .pnp.cjs del /f /q .pnp.cjs
if exist package-lock.json del /f /q package-lock.json

REM Keep node_modules when present. Reusing pnpm's existing install avoids unnecessary
REM permission errors and keeps repeat packaging much faster. pnpm install below will
REM still repair or add missing dependencies.

echo.
echo [5/6] Installing dependencies...
call pnpm install
if errorlevel 1 exit /b %errorlevel%

echo.
echo [6/6] Building Windows MSI and NSIS installers...
call pnpm run tauri build --config src-tauri/tauri.windows.installer.conf.json
if errorlevel 1 exit /b %errorlevel%

echo.
echo ========================================
echo   Windows installer build complete
echo ========================================
echo   MSI : ..\target\release\bundle\msi
echo   EXE : ..\target\release\bundle\nsis
echo.

endlocal
