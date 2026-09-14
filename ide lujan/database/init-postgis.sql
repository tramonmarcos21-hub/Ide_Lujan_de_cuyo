-- ======================================================================================
-- INICIALIZACIÓN DE LA BASE DE DATOS ESPACIAL DEL NODO IDE LUJÁN DE CUYO
-- Alineada al Perfil de Objetos Geográficos de IDERA y Sistema de Referencia POSGAR 94
-- ======================================================================================

-- 1. Habilitar extensiones geoespaciales
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_raster;
CREATE EXTENSION IF NOT EXISTS postgis_topology;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Crear esquemas temáticos según el Catálogo de Objetos Geográficos de IDERA (CODG)
CREATE SCHEMA IF NOT EXISTS adm;    -- Marco Político-Administrativo y Límites
CREATE SCHEMA IF NOT EXISTS cat;    -- Catastro y Parcelario
CREATE SCHEMA IF NOT EXISTS urb;    -- Planeamiento Urbano y Zonificación
CREATE SCHEMA IF NOT EXISTS inf;    -- Infraestructura y Servicios Públicos
CREATE SCHEMA IF NOT EXISTS mob;    -- Movilidad y Red Vial
CREATE SCHEMA IF NOT EXISTS env;    -- Medio Ambiente, Recursos Hídricos y Riesgo
CREATE SCHEMA IF NOT EXISTS soc;    -- Equipamiento Comunitario (Salud, Educación, Seguridad)
CREATE SCHEMA IF NOT EXISTS tur;    -- Turismo, Bodegas y Patrimonio Vitivinícola

-- Sistema de referencia oficial:
-- EPSG:22172 -> POSGAR 94 / Argentina Faja 2 (Meridiano Central 69° O - Mendoza)
-- EPSG:4326 -> WGS 84 Geográficas (Interoperabilidad OGC)
-- EPSG:3857 -> WGS 84 / Pseudo-Mercator (Visualizadores web)

-- ======================================================================================
-- ESQUEMA ADM: LÍMITES POLÍTICO-ADMINISTRATIVOS
-- ======================================================================================
CREATE TABLE IF NOT EXISTS adm.distritos (
    id SERIAL PRIMARY KEY,
    distrito VARCHAR(100) NOT NULL UNIQUE,
    nom_comple VARCHAR(150),
    departamento VARCHAR(100) DEFAULT 'Luján de Cuyo',
    provincia VARCHAR(100) DEFAULT 'Mendoza',
    poblacion INTEGER,
    superficie_km2 NUMERIC(10,2),
    densidad_hab_km2 NUMERIC(10,2),
    nivel_riesgo VARCHAR(50),
    geom_22172 geometry(MultiPolygon, 22172),
    geom_4326 geometry(MultiPolygon, 4326)
);
CREATE INDEX IF NOT EXISTS idx_adm_distritos_geom22172 ON adm.distritos USING GIST (geom_22172);
CREATE INDEX IF NOT EXISTS idx_adm_distritos_geom4326 ON adm.distritos USING GIST (geom_4326);

-- ======================================================================================
-- ESQUEMA CAT: CATASTRO Y PARCELAS
-- ======================================================================================
CREATE TABLE IF NOT EXISTS cat.parcelas (
    id SERIAL PRIMARY KEY,
    padron INTEGER NOT NULL UNIQUE,
    nomenclatura VARCHAR(50) NOT NULL,
    distrito VARCHAR(100) NOT NULL,
    barrio_paraje VARCHAR(150),
    calle VARCHAR(150),
    numero INTEGER,
    superficie_m2 NUMERIC(12,2),
    zonificacion VARCHAR(100),
    fos_max NUMERIC(4,2),
    fot_max NUMERIC(4,2),
    estado_edificacion VARCHAR(50),
    val_fiscal NUMERIC(15,2),
    geom_22172 geometry(Polygon, 22172),
    geom_4326 geometry(Polygon, 4326)
);
CREATE INDEX IF NOT EXISTS idx_cat_parcelas_padron ON cat.parcelas (padron);
CREATE INDEX IF NOT EXISTS idx_cat_parcelas_geom22172 ON cat.parcelas USING GIST (geom_22172);
CREATE INDEX IF NOT EXISTS idx_cat_parcelas_geom4326 ON cat.parcelas USING GIST (geom_4326);

-- ======================================================================================
-- ESQUEMA URB: ZONIFICACIÓN Y USOS DEL SUELO
-- ======================================================================================
CREATE TABLE IF NOT EXISTS urb.zonificacion (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(20) NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    distrito VARCHAR(100),
    fos NUMERIC(4,2),
    fot NUMERIC(4,2),
    altura_max VARCHAR(50),
    usos_permitidos TEXT,
    normativa VARCHAR(255),
    color VARCHAR(20),
    geom_22172 geometry(MultiPolygon, 22172),
    geom_4326 geometry(MultiPolygon, 4326)
);
CREATE INDEX IF NOT EXISTS idx_urb_zonificacion_geom22172 ON urb.zonificacion USING GIST (geom_22172);
CREATE INDEX IF NOT EXISTS idx_urb_zonificacion_geom4326 ON urb.zonificacion USING GIST (geom_4326);

-- ======================================================================================
-- ESQUEMA ENV: RED HÍDRICA Y AMBIENTE
-- ======================================================================================
CREATE TABLE IF NOT EXISTS env.red_hidrica (
    id SERIAL PRIMARY KEY,
    fid_origen INTEGER,
    longitud_m NUMERIC(12,2),
    distrito VARCHAR(100),
    tipo VARCHAR(100),
    jerarquia SMALLINT,
    fuente VARCHAR(150) DEFAULT 'DGI - Irrigación / Municipalidad de Luján de Cuyo',
    geom_22172 geometry(LineString, 22172),
    geom_4326 geometry(LineString, 4326)
);
CREATE INDEX IF NOT EXISTS idx_env_red_hidrica_geom22172 ON env.red_hidrica USING GIST (geom_22172);
CREATE INDEX IF NOT EXISTS idx_env_red_hidrica_geom4326 ON env.red_hidrica USING GIST (geom_4326);

-- ======================================================================================
-- ESQUEMA SOC: EQUIPAMIENTO COMUNITARIO
-- ======================================================================================
CREATE TABLE IF NOT EXISTS soc.equipamiento (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    categoria VARCHAR(100) NOT NULL,
    subcategoria VARCHAR(100),
    direccion VARCHAR(150),
    distrito VARCHAR(100),
    telefono VARCHAR(50),
    atencion_24h VARCHAR(10),
    geom_22172 geometry(Point, 22172),
    geom_4326 geometry(Point, 4326)
);
CREATE INDEX IF NOT EXISTS idx_soc_equipamiento_geom4326 ON soc.equipamiento USING GIST (geom_4326);

-- ======================================================================================
-- ESQUEMA TUR: BODEGAS Y PATRIMONIO VITIVINÍCOLA ("Luján Tierra del Malbec")
-- ======================================================================================
CREATE TABLE IF NOT EXISTS tur.bodegas_patrimonio (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    distrito VARCHAR(100) NOT NULL,
    enoturismo VARCHAR(100),
    varietal_emblema VARCHAR(150),
    camino_del_vino VARCHAR(150),
    categoria VARCHAR(100) DEFAULT 'Bodega Abierta al Enoturismo',
    geom_22172 geometry(Point, 22172),
    geom_4326 geometry(Point, 4326)
);
CREATE INDEX IF NOT EXISTS idx_tur_bodegas_geom4326 ON tur.bodegas_patrimonio USING GIST (geom_4326);

-- ======================================================================================
-- VISTAS OGC PARA PUBLICACIÓN DIRECTA EN GEOSERVER EN WGS 84 (EPSG:4326)
-- ======================================================================================
CREATE OR REPLACE VIEW adm.vw_ogc_distritos AS
    SELECT id, distrito, nom_comple, departamento, provincia, poblacion, superficie_km2, nivel_riesgo, geom_4326 AS geom FROM adm.distritos;

CREATE OR REPLACE VIEW cat.vw_ogc_parcelas AS
    SELECT id, padron, nomenclatura, distrito, barrio_paraje, calle, numero, superficie_m2, zonificacion, fos_max, fot_max, estado_edificacion, val_fiscal, geom_4326 AS geom FROM cat.parcelas;

CREATE OR REPLACE VIEW urb.vw_ogc_zonificacion AS
    SELECT id, codigo, nombre, distrito, fos, fot, altura_max, usos_permitidos, normativa, color, geom_4326 AS geom FROM urb.zonificacion;

CREATE OR REPLACE VIEW env.vw_ogc_red_hidrica AS
    SELECT id, fid_origen, longitud_m, distrito, tipo, jerarquia, fuente, geom_4326 AS geom FROM env.red_hidrica;

CREATE OR REPLACE VIEW soc.vw_ogc_equipamiento AS
    SELECT id, nombre, categoria, subcategoria, direccion, distrito, geom_4326 AS geom FROM soc.equipamiento;

CREATE OR REPLACE VIEW tur.vw_ogc_bodegas AS
    SELECT id, nombre, distrito, enoturismo, varietal_emblema, camino_del_vino, categoria, geom_4326 AS geom FROM tur.bodegas_patrimonio;

COMMENT ON SCHEMA adm IS 'Marco Político-Administrativo y Límites según IDERA';
COMMENT ON SCHEMA cat IS 'Catastro y Parcelario según directrices de Catastro Municipal y Provincial';
COMMENT ON SCHEMA urb IS 'Ordenamiento Territorial y Zonificación según Ordenanza Municipal 13.820/2019';
COMMENT ON SCHEMA env IS 'Red Hídrica y Colectores Aluvionales según DGI e Hidrología Municipal';
COMMENT ON SCHEMA soc IS 'Equipamiento Comunitario y Social';
COMMENT ON SCHEMA tur IS 'Circuito Enológico y Patrimonial - Luján Tierra del Malbec';
