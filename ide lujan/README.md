# Infraestructura de Datos Espaciales (IDE) - Municipalidad de Luján de Cuyo

[![IDERA](https://img.shields.io/badge/Norma-IDERA-brightgreen.svg)](https://www.idera.gob.ar/)
[![POSGAR 94](https://img.shields.io/badge/Marco-POSGAR%2094%20Faja%202%20(EPSG:22172)-blue.svg)](https://www.ign.gob.ar/)
[![GeoServer](https://img.shields.io/badge/GeoServer-2.24+-orange.svg)](http://geoserver.org/)
[![PostGIS](https://img.shields.io/badge/PostGIS-16--3.4-blue.svg)](https://postgis.net/)
[![IDE Mendoza](https://img.shields.io/badge/Federado-IDE%20Mendoza-teal.svg)](https://ide.mendoza.gov.ar/)
[![Licencia](https://img.shields.io/badge/Licencia-CC--BY--4.0-lightgrey.svg)](https://creativecommons.org/licenses/by/4.0/deed.es)

Plataforma oficial y moderna de **Infraestructura de Datos Espaciales (IDE)** para la **Municipalidad de Luján de Cuyo** (Provincia de Mendoza, República Argentina). Diseñada bajo los marcos normativos, estándares y catálogo de objetos de **IDERA** (Infraestructura de Datos Espaciales de la República Argentina) y completamente interoperable con **IDE Mendoza (IDEM)**.

---

## Características Principales

* **Geoportal Web Institucional**: Página de inicio responsiva con métricas territoriales en vivo, catálogo de datos abiertos y endpoints OGC.
* **Visor Cartográfico SIG Interactivo**:
  * Mapas base: **Argenmap oficial del IGN (IDERA)**, OpenStreetMap, Satélite ESRI y CartoDB Positron.
  * Árbol temático multinivel IDERA:
    * `ADM`: 15 Distritos Departamentales (Ciudad, Chacras de Coria, Potrerillos, Carrodilla, Vistalba, etc.).
    * `CAT`: Catastro parcelario con padrones municipales y nomenclatura catastral.
    * `URB`: Zonificación urbana según el Plan de Ordenamiento Territorial (Ordenanza 13.820/2019).
    * `ENV`: Red hídrica completa con más de 7.100 tramos de ríos, colectores aluvionales y canales de riego DGI.
    * `TUR`: Circuito enológico y bodegas emblemáticas de la "Tierra del Malbec" y atractivos turísticos.
    * `SOC`: Equipamiento comunitario (Hospitales, CAPS 24h, escuelas, comisarías, polideportivo).
    * `INF`: Infraestructura de servicios (Aguas Luján y puntos verdes de reciclaje).
  * **Buscador Inteligente**: Localización instantánea por número de padrón municipal, nomenclatura, distrito o bodega.
  * **Herramienta GetFeatureInfo**: Ficha catastral y urbanística completa con cálculo de FOS/FOT y enlace directo al gemelo digital **[Luján 3D](https://lujan3d.lujandecuyo.gob.ar/)**.
  * **Medición Métrica**: Cálculo en tiempo real de distancias (m/km) y superficies (m²/hectáreas).
  * **Metadatos IDERA**: Ficha técnica ISO 19115 / ISO 19139 accesible desde cada capa.
  * **Modo Offline & Standalone**: Datos precargados en `data-bundle.js` para funcionamiento sin conexión y sin problemas de CORS al abrir el archivo directamente en Windows.

---

## Arquitectura Tecnológica

```
ide_lujan_idera/
├── docker-compose.yml          # Orquestador con PostGIS, GeoServer, pycsw y Nginx
├── .env.example                # Variables de configuración
├── serve_dev.py                # Servidor local de desarrollo en Python
├── ABRIR_VISOR.bat             # Lanzador directo con 1 clic para Windows
├── ABRIR_GEOPORTAL.bat         # Lanzador directo para el geoportal
├── database/
│   └── init-postgis.sql        # Esquemas espaciales adm, cat, urb, env, soc, tur en EPSG:22172
├── geoserver/
│   ├── styles/                 # Simbología oficial SLD IDERA
│   └── workspaces/ide_lujan/   # Workspace y configuración de GeoServer
├── pycsw/
│   ├── pycsw.cfg               # Catálogo de metadatos CSW 2.0.2 IDERA
│   └── records/adm_distritos.xml # Registro ISO 19139
├── nginx/
│   └── nginx.conf              # Reverse proxy con soporte CORS para IDERA
├── frontend/
│   ├── index.html              # Geoportal institucional
│   ├── visor.html              # Visor SIG interactivo
│   ├── css/ide-styles.css      # Estilos e identidad visual Luján de Cuyo
│   ├── js/visor.js             # Motor cartográfico (Leaflet)
│   ├── js/data-bundle.js       # Paquete de capas para compatibilidad total
│   └── data/                   # Capas GeoJSON oficiales
└── docs/
    ├── ARQUITECTURA_IDERA.md   # Especificaciones técnicas
    └── GUIA_CONEXION_QGIS.md   # Guía de interoperabilidad WMS/WFS
```

---

## Guía de Puesta en Marcha

### 1. Prueba Inmediata en Local (Sin Docker)
Si deseas probar el geoportal y el visor inmediatamente en tu computadora:

* **En Windows**: Haz doble clic en `ABRIR_VISOR.bat`.
* **Desde la terminal**:
  ```bash
  python serve_dev.py
  ```
* Acceso:
  * **Visor:** `http://localhost:8080/visor.html`
  * **Geoportal:** `http://localhost:8080/index.html`

### 2. Despliegue con Docker Compose (Producción)
Para desplegar la pila completa con GeoServer, PostGIS, pycsw y Nginx:
```bash
docker compose up -d
python scripts/setup_geoserver.py
```
* **Geoportal:** `http://localhost/`
* **GeoServer Web Admin:** `http://localhost:8082/geoserver`
* **Catálogo CSW (pycsw):** `http://localhost:8000/csw`

---

## Cómo subir este proyecto a GitHub

Para crear un nuevo repositorio en GitHub y publicar el código:

```bash
# 1. Posicionarse en la carpeta del proyecto
cd ide_lujan_idera

# 2. Inicializar repositorio git
git init

# 3. Agregar todos los archivos
git add .

# 4. Crear el commit inicial
git commit -m "feat: Infraestructura de Datos Espaciales (IDE) Luján de Cuyo - IDERA / GeoServer"

# 5. Configurar rama principal
git branch -M main

# 6. Conectar con tu repositorio remoto de GitHub (reemplaza con tu URL)
git remote add origin https://github.com/TU_USUARIO/ide-lujan-cuyo.git

# 7. Subir al repositorio
git push -u origin main
```

---

## Enlaces Oficiales

* **IDE Mendoza (IDEM):** [https://ide.mendoza.gov.ar/](https://ide.mendoza.gov.ar/)
* **IDERA Nacional:** [https://www.idera.gob.ar/](https://www.idera.gob.ar/)
* **Luján 3D (Gemelo Digital):** [https://lujan3d.lujandecuyo.gob.ar/](https://lujan3d.lujandecuyo.gob.ar/)
* **Municipalidad de Luján de Cuyo:** [https://lujandecuyo.gob.ar/](https://lujandecuyo.gob.ar/)
