# Arquitectura Técnica del Nodo IDE Municipal de Luján de Cuyo
## Conforme a las Directrices y Estándares de IDERA

### 1. Marco Normativo y de Referencia
* **IDERA**: Infraestructura de Datos Espaciales de la República Argentina.
* **Sistema de Referencia Oficial**: POSGAR 94 (Decreto Ley 22.963 / IGN).
* **Proyección Cartográfica Municipal**: Gauss-Krüger Faja 2 (Meridiano central 69° O, EPSG:22172).
* **Interoperabilidad Web**: WGS 84 (EPSG:4326) y WGS 84 / Pseudo-Mercator (EPSG:3857).

### 2. Estructura de Esquemas en PostGIS
Los datos geográficos están estructurados en PostgreSQL 16 + PostGIS 3.4 siguiendo el Catálogo de Objetos Geográficos de IDERA (CODG):
* `adm`: Marco Político-Administrativo (Límites departamentales y distritos).
* `cat`: Catastro y Parcela (Parcelas, manzanas, padrones municipales, avalúos).
* `urb`: Planeamiento Urbano y Zonificación (Código Urbano Ord. 13.820/2019, FOS/FOT, afectaciones).
* `env`: Medio Ambiente y Recursos Hídricos (Red fluvial, canales de riego DGI, cuencas aluvionales).
* `inf`: Infraestructura y Servicios (Aguas Luján, cloacas, puntos limpios y reciclaje).
* `soc`: Equipamiento Comunitario (Hospitales, CAPS, escuelas, comisarías, polideportivos).
* `tur`: Turismo y Patrimonio (Bodegas "Tierra del Malbec", caminos del vino, Potrerillos, Cacheuta).

### 3. Servicios OGC Implementados en GeoServer
* **WMS 1.3.0 / 1.1.1**: Visualización de mapas raster/vectorial.
* **WFS 2.0.0 / 1.1.0**: Descarga vectorial en GeoJSON, Shapefile y GML.
* **WMTS 1.0.0**: Pirámides de teselas cacheadas vía GeoWebCache.
* **CSW 2.0.2**: Servicio de Catálogo de Metadatos vía pycsw federable en el Geoportal Nacional de IDERA.

### 4. Pila de Despliegue (Docker Compose)
* `postgis`: Base de datos espacial.
* `geoserver`: Servidor de mapas.
* `pycsw`: Catálogo CSW.
* `nginx`: Reverse proxy y servidor web del Geoportal y Visor SIG.
