@echo off
title Nodo IDE Municipal Lujan de Cuyo - Servidor Local
echo ==============================================================================
echo     INICIANDO NODO IDE MUNICIPALIDAD DE LUJAN DE CUYO (IDERA)
echo ==============================================================================
echo.
echo Abriendo Visor Cartografico en tu navegador...
echo.

start "" "http://localhost:8080/visor.html"
"C:\Users\gesti\.gemini\antigravity\scratch\lujan_de_cuyo_modelado\.venv\Scripts\python.exe" "%~dp0serve_dev.py"
pause
