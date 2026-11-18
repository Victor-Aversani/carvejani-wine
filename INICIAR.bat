@echo off
cd /d "%~dp0"
set "CARVEJANI_NODE=node"
where node >nul 2>nul
if errorlevel 1 set "CARVEJANI_NODE=C:\Program Files\WindowsApps\OpenAI.CodexPrimaryRuntime.v26-1112-737-0_26.1112.737.0_x64__3k8sg7r9htsxt\dependencies\node\bin\node.exe"
"%CARVEJANI_NODE%" setup.mjs
if errorlevel 1 goto error
echo Abra http://localhost:3000 no Google Chrome.
echo Mantenha esta janela aberta enquanto usa o site.
"%CARVEJANI_NODE%" server.mjs
:error
pause
