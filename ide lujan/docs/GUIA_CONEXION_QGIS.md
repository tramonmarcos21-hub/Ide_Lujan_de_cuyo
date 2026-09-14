# Guía de Conexión a la IDE de Luján de Cuyo desde QGIS

### 1. Conexión al Servicio WMS (Visualización de Capas)
1. Abre QGIS (versión 3.22 o superior).
2. En el panel **Explorador**, haz clic derecho en **WMS/WMTS** y selecciona **Nueva Conexión...**.
3. Completa los campos:
   * **Nombre:** `IDE Luján de Cuyo (WMS)`
   * **URL:** `https://ide.lujandecuyo.gob.ar/geoserver/ide_lujan/wms`
4. Haz clic en **Aceptar**.
5. Despliega la conexión creada y arrastra las capas deseadas al lienzo de QGIS (ej. `adm:distritos`, `cat:parcelas`, `env:red_hidrica`).

### 2. Conexión al Servicio WFS (Descarga Vectorial)
1. En el panel **Explorador**, haz clic derecho en **WFS / OGC API - Features** y selecciona **Nueva Conexión...**.
2. Completa los campos:
   * **Nombre:** `IDE Luján de Cuyo (WFS)`
   * **URL:** `https://ide.lujandecuyo.gob.ar/geoserver/ide_lujan/wfs`
3. Haz clic en **Aceptar**.
4. Podrás descargar y editar vectorialmente las geometrías y tablas de atributos.
