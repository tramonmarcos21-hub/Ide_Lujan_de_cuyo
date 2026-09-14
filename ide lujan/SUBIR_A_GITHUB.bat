@echo off
title Subir IDE Lujan de Cuyo a GitHub
echo ==============================================================================
echo        SUBIR PROYECTO IDE LUJAN DE CUYO A GITHUB
echo ==============================================================================
echo.
echo Este asistente te ayudara a subir todo el codigo a tu cuenta de GitHub.
echo Primero, crea un repositorio vacio en https://github.com/new
echo.
set /p REPO_URL="Pega aqui la URL de tu repositorio de GitHub: "
if "%REPO_URL%"=="" (
    echo No ingresaste ninguna URL. Operacion cancelada.
    pause
    exit /b
)

echo.
echo [1/5] Inicializando repositorio Git...
git init
echo [2/5] Agregando todos los archivos de la IDE...
git add .
echo [3/5] Creando commit inicial con EPSG:22172...
git commit -m "feat: IDE Lujan de Cuyo - IDERA / GeoServer - CRS EPSG:22172"
echo [4/5] Configurando rama principal main...
git branch -M main
echo [5/5] Conectando y subiendo a GitHub...
git remote remove origin 2>nul
git remote add origin %REPO_URL%
git push -u origin main

echo.
echo ==============================================================================
echo  Listo! Si no hubo errores de autenticacion, tu codigo ya esta en GitHub.
echo ==============================================================================
pause
