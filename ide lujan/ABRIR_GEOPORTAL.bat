@echo off
title Geoportal IDE Lujan de Cuyo
echo ==============================================================================
echo     INICIANDO GEOPORTAL IDE LUJAN DE CUYO (IDERA)
echo ==============================================================================
echo.
echo Abriendo Geoportal Institucional en tu navegador...
echo.

start "" "http://localhost:8080/index.html"
"C:\Users\gesti\.gemini\antigravity\scratch\lujan_de_cuyo_modelado\.venv\Scripts\python.exe" "%~dp0serve_dev.py"
pause
