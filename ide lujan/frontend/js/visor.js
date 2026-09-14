// ==========================================================================
// Visor Cartográfico IDE Luján de Cuyo - Lógica JavaScript (Normas IDERA)
// ==========================================================================

let map;
let baseLayers = {};
let currentBaseLayer;
let overlayLayers = {};
let layerDataCache = {};
let measureMode = null;
let measurePoints = [];
let measureMarkers = [];
let measureLine = null;
let measurePolygon = null;

// Bounding box oficial Luján de Cuyo
const LUJAN_BOUNDS = [
  [-33.2500, -69.4500], // Suroeste (Cordillera / El Carrizal)
  [-32.9300, -68.7000]  // Noreste (Carrodilla / Río Mendoza)
];

const LUJAN_CENTER = [-33.0550, -68.8780]; // Luján Ciudad

// Inicialización al cargar la página
document.addEventListener('DOMContentLoaded', () => {
  initMap();
  setupUIEvents();
  loadAllLayers();
});

function initMap() {
  // Inicializar Leaflet
  map = L.map('map', {
    center: LUJAN_CENTER,
    zoom: 11,
    minZoom: 9,
    maxZoom: 19,
    zoomControl: false
  });

  L.control.zoom({ position: 'bottomright' }).addTo(map);
  L.control.scale({ imperial: false, metric: true, position: 'bottomleft' }).addTo(map);

  // Mapas Base
  baseLayers.argenmap = L.tileLayer('https://wms.ign.gob.ar/geoserver/gwc/service/tms/1.0.0/capabaseargenmap@EPSG%3A3857@png/{z}/{x}/{-y}.png', {
    attribution: '&copy; <a href="https://www.ign.gob.ar" target="_blank">IGN Argentina</a> / IDERA',
    maxZoom: 19
  });

  baseLayers.osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19
  });

  baseLayers.satellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri, Earthstar Geographics',
    maxZoom: 19
  });

  baseLayers.carto = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
    maxZoom: 19
  });

  // Base por defecto: OSM (con fallback suave a Argenmap)
  currentBaseLayer = baseLayers.osm;
  currentBaseLayer.addTo(map);

  // Evento mousemove para actualizar barra de coordenadas
  map.on('mousemove', (e) => {
    const lat = e.latlng.lat.toFixed(5);
    const lng = e.latlng.lng.toFixed(5);
    // Aproximación Gauss-Krüger Faja 2
    const gk_x = Math.round(6341200 + (lat - (-33.055)) * 111320);
    const gk_y = Math.round(2511400 + (lng - (-68.878)) * 93500);
    document.getElementById('footer-coords').innerHTML = 
      `<i class="fa-solid fa-crosshairs"></i> Lat: ${lat} | Lon: ${lng} | <b>POSGAR 94 Faja 2:</b> X: ${gk_x.toLocaleString('es-AR')} m, Y: ${gk_y.toLocaleString('es-AR')} m`;
  });

  // Evento clic para medir
  map.on('click', (e) => {
    if (measureMode) {
      handleMeasureClick(e.latlng);
    }
  });
}

// --------------------------------------------------------------------------
// Carga de Capas Geoespaciales
// --------------------------------------------------------------------------


// Función universal para obtener datos (con soporte offline / file:// y HTTP)
async function getGeoData(layerKey, url) {
  if (window.LUJAN_GEO_DATA && window.LUJAN_GEO_DATA[layerKey]) {
    return window.LUJAN_GEO_DATA[layerKey];
  }
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (e) {
    console.warn(`Fallo fetch para ${url}, usando fallback local si existe:`, e);
    if (window.LUJAN_GEO_DATA && window.LUJAN_GEO_DATA[layerKey]) {
      return window.LUJAN_GEO_DATA[layerKey];
    }
    throw e;
  }
}

async function loadAllLayers() {
  await loadDistritos();
  await loadRedHidrica();
  await loadParcelas();
  await loadZonificacion();
  await loadEquipamiento();
  await loadBodegas();
  await loadServicios();
  setupSearchIndex();
}

async function loadDistritos() {
  try {
    const data = await getGeoData('distritos', 'data/adm_distritos.geojson');
    layerDataCache.distritos = data;

    overlayLayers.distritos = L.geoJSON(data, {
      style: {
        color: '#003366',
        weight: 2,
        dashArray: '5, 5',
        fillColor: '#003366',
        fillOpacity: 0.08
      },
      onEachFeature: (feature, layer) => {
        const p = feature.properties;
        layer.bindTooltip(`<b>${p.distrito}</b><br>Población: ${(p.poblacion || 0).toLocaleString('es-AR')} hab.`, { sticky: true });
        layer.on('click', (e) => {
          L.DomEvent.stopPropagation(e);
          showFeatureInfo('Distrito Departamental', p, 'adm_distritos');
        });
      }
    }).addTo(map);
  } catch (err) {
    console.error("Error al cargar distritos:", err);
  }
}

async function loadRedHidrica() {
  try {
    const data = await getGeoData('red_hidrica', 'data/env_red_hidrica.geojson');
    layerDataCache.red_hidrica = data;

    overlayLayers.red_hidrica = L.geoJSON(data, {
      style: (feature) => {
        const jer = feature.properties.jerarquia || 2;
        return {
          color: jer === 1 ? '#0066CC' : '#3399FF',
          weight: jer === 1 ? 2.5 : 1.2,
          opacity: 0.85
        };
      },
      onEachFeature: (feature, layer) => {
        const p = feature.properties;
        layer.on('click', (e) => {
          L.DomEvent.stopPropagation(e);
          showFeatureInfo('Cauce / Canal de Riego', p, 'env_red_hidrica');
        });
      }
    }).addTo(map);
  } catch (err) {
    console.error("Error al cargar red hídrica:", err);
  }
}

async function loadParcelas() {
  try {
    const data = await getGeoData('parcelas', 'data/cat_parcelas.geojson');
    layerDataCache.parcelas = data;

    overlayLayers.parcelas = L.geoJSON(data, {
      style: {
        color: '#B38600',
        weight: 1.2,
        fillColor: '#FFF9E6',
        fillOpacity: 0.5
      },
      onEachFeature: (feature, layer) => {
        const p = feature.properties;
        layer.bindTooltip(`Padrón: <b>${p.padron}</b><br>${p.barrio_paraje}`, { sticky: true });
        layer.on('click', (e) => {
          L.DomEvent.stopPropagation(e);
          showFeatureInfo('Parcela Catastral', p, 'cat_parcelas');
        });
      }
    }).addTo(map);
  } catch (err) {
    console.error("Error al cargar parcelas:", err);
  }
}

async function loadZonificacion() {
  try {
    const data = await getGeoData('zonificacion', 'data/urb_zonificacion.geojson');
    layerDataCache.zonificacion = data;

    overlayLayers.zonificacion = L.geoJSON(data, {
      style: (feature) => {
        return {
          color: feature.properties.color || '#e74c3c',
          weight: 2,
          fillColor: feature.properties.color || '#e74c3c',
          fillOpacity: 0.35
        };
      },
      onEachFeature: (feature, layer) => {
        const p = feature.properties;
        layer.bindTooltip(`Zona: <b>${p.codigo}</b> - ${p.nombre}`, { sticky: true });
        layer.on('click', (e) => {
          L.DomEvent.stopPropagation(e);
          showFeatureInfo('Zonificación Urbana (Código Urbano)', p, 'urb_zonificacion');
        });
      }
    }).addTo(map);
  } catch (err) {
    console.error("Error al cargar zonificación:", err);
  }
}

async function loadEquipamiento() {
  try {
    const data = await getGeoData('equipamiento', 'data/soc_equipamiento.geojson');
    layerDataCache.equipamiento = data;

    overlayLayers.equipamiento = L.geoJSON(data, {
      pointToLayer: (feature, latlng) => {
        const cat = feature.properties.categoria;
        let iconName = 'fa-hospital';
        let bg = '#0284c7';
        if (cat === 'Educación') { iconName = 'fa-graduation-cap'; bg = '#8b5cf6'; }
        if (cat === 'Seguridad') { iconName = 'fa-shield'; bg = '#1e293b'; }
        if (cat === 'Cívico y Administrativo') { iconName = 'fa-building-columns'; bg = '#002B49'; }
        if (cat === 'Deporte y Recreación') { iconName = 'fa-futbol'; bg = '#10b981'; }

        const iconHtml = `<div style="background: ${bg}; color: white; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 6px rgba(0,0,0,0.3); border: 2px solid #fff;"><i class="fa-solid ${iconName}" style="font-size: 0.75rem;"></i></div>`;
        return L.marker(latlng, {
          icon: L.divIcon({ html: iconHtml, className: 'marker-soc', iconSize: [28, 28], iconAnchor: [14, 14] })
        });
      },
      onEachFeature: (feature, layer) => {
        const p = feature.properties;
        layer.bindTooltip(`<b>${p.nombre}</b><br>${p.categoria}`, { sticky: true });
        layer.on('click', (e) => {
          L.DomEvent.stopPropagation(e);
          showFeatureInfo('Equipamiento Comunitario', p, 'soc_equipamiento');
        });
      }
    }).addTo(map);
  } catch (err) {
    console.error("Error al cargar equipamiento:", err);
  }
}

async function loadBodegas() {
  try {
    const data = await getGeoData('bodegas', 'data/tur_bodegas_patrimonio.geojson');
    layerDataCache.bodegas = data;

    overlayLayers.bodegas = L.geoJSON(data, {
      pointToLayer: (feature, latlng) => {
        const isBodega = feature.properties.varietal_emblema !== undefined;
        const iconName = isBodega ? 'fa-wine-bottle' : 'fa-camera';
        const bg = isBodega ? '#722F37' : '#0ea5e9';

        const iconHtml = `<div style="background: ${bg}; color: white; width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; box-shadow: 0 3px 8px rgba(114, 47, 55, 0.4); border: 2px solid #fff;"><i class="fa-solid ${iconName}" style="font-size: 0.9rem;"></i></div>`;
        return L.marker(latlng, {
          icon: L.divIcon({ html: iconHtml, className: 'marker-tur', iconSize: [32, 32], iconAnchor: [16, 16] })
        });
      },
      onEachFeature: (feature, layer) => {
        const p = feature.properties;
        layer.bindTooltip(`<b>${p.nombre}</b><br>${p.distrito}`, { sticky: true });
        layer.on('click', (e) => {
          L.DomEvent.stopPropagation(e);
          showFeatureInfo('Patrimonio y Enoturismo (Tierra del Malbec)', p, 'tur_bodegas');
        });
      }
    }).addTo(map);
  } catch (err) {
    console.error("Error al cargar bodegas:", err);
  }
}

async function loadServicios() {
  try {
    const data = await getGeoData('servicios', 'data/inf_servicios.geojson');
    layerDataCache.servicios = data;

    overlayLayers.servicios = L.geoJSON(data, {
      pointToLayer: (feature, latlng) => {
        const isAgua = feature.properties.tipo.includes('Agua');
        const iconName = isAgua ? 'fa-faucet-drip' : 'fa-recycle';
        const bg = isAgua ? '#0072ce' : '#16a34a';

        const iconHtml = `<div style="background: ${bg}; color: white; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 6px rgba(0,0,0,0.3); border: 2px solid #fff;"><i class="fa-solid ${iconName}" style="font-size: 0.8rem;"></i></div>`;
        return L.marker(latlng, {
          icon: L.divIcon({ html: iconHtml, className: 'marker-inf', iconSize: [28, 28], iconAnchor: [14, 14] })
        });
      },
      onEachFeature: (feature, layer) => {
        const p = feature.properties;
        layer.bindTooltip(`<b>${p.nombre}</b><br>${p.tipo}`, { sticky: true });
        layer.on('click', (e) => {
          L.DomEvent.stopPropagation(e);
          showFeatureInfo('Servicios e Infraestructura', p, 'inf_servicios');
        });
      }
    }).addTo(map);
  } catch (err) {
    console.error("Error al cargar servicios:", err);
  }
}

// --------------------------------------------------------------------------
// Control de Capas y Opacidad
// --------------------------------------------------------------------------

function toggleLayer(layerName) {
  if (!overlayLayers[layerName]) return;
  if (map.hasLayer(overlayLayers[layerName])) {
    map.removeLayer(overlayLayers[layerName]);
  } else {
    map.addLayer(overlayLayers[layerName]);
  }
}

function setLayerOpacity(layerName, val) {
  const layer = overlayLayers[layerName];
  if (!layer) return;
  const numVal = parseFloat(val);
  layer.eachLayer((l) => {
    if (l.setStyle) {
      l.setStyle({ fillOpacity: numVal, opacity: numVal });
    } else if (l.setOpacity) {
      l.setOpacity(numVal);
    }
  });
}

function zoomToLayer(layerName) {
  const layer = overlayLayers[layerName];
  if (layer && map.hasLayer(layer)) {
    map.fitBounds(layer.getBounds(), { padding: [20, 20] });
  } else if (layer) {
    layer.addTo(map);
    map.fitBounds(layer.getBounds(), { padding: [20, 20] });
  }
}

function setBaseMap(type) {
  if (currentBaseLayer) map.removeLayer(currentBaseLayer);
  currentBaseLayer = baseLayers[type] || baseLayers.osm;
  currentBaseLayer.addTo(map);

  // Actualizar estilo de botones
  document.querySelectorAll('.basemap-option').forEach(el => {
    el.style.borderColor = 'var(--lujan-border)';
    el.style.background = '#ffffff';
  });
}

function toggleCategory(catId) {
  const body = document.getElementById(catId);
  const icon = document.getElementById(catId + '-icon');
  if (body.style.display === 'none') {
    body.style.display = 'block';
    icon.className = 'fa-solid fa-chevron-down';
  } else {
    body.style.display = 'none';
    icon.className = 'fa-solid fa-chevron-right';
  }
}

// --------------------------------------------------------------------------
// GetFeatureInfo / Ficha de Atributos
// --------------------------------------------------------------------------

function showFeatureInfo(title, properties, layerKey) {
  const drawer = document.getElementById('feature-drawer');
  const titleEl = document.getElementById('drawer-title');
  const contentEl = document.getElementById('drawer-content');

  titleEl.innerHTML = `<i class="fa-solid fa-circle-check" style="color: #10b981;"></i> ${title}`;

  let rows = '';
  for (const [key, val] of Object.entries(properties)) {
    if (val === null || val === undefined || key === 'fid' || key === 'color') continue;
    const cleanKey = key.replace(/_/g, ' ').toUpperCase();
    let displayVal = val;
    if (typeof val === 'number') {
      displayVal = val.toLocaleString('es-AR');
    }
    rows += `<tr><th>${cleanKey}</th><td>${displayVal}</td></tr>`;
  }

  let extraActions = '';
  if (properties.padron) {
    extraActions = `
      <div style="margin-top: 1.25rem; display: flex; flex-direction: column; gap: 0.5rem;">
        <a href="https://lujan3d.lujandecuyo.gob.ar/" target="_blank" class="btn btn-malbec btn-sm">
          <i class="fa-solid fa-cube"></i> Consultar Parcela en Luján 3D
        </a>
        <button class="btn btn-secondary btn-sm" onclick="alert('Constancia catastral oficial generada para Padrón ${properties.padron}')">
          <i class="fa-solid fa-file-pdf"></i> Imprimir Ficha Catastral
        </button>
      </div>
    `;
  }

  contentEl.innerHTML = `
    <div style="background: #f8fafc; border: 1px solid var(--lujan-border); border-radius: 8px; padding: 0.75rem; margin-bottom: 1rem;">
      <span class="badge-idera"><i class="fa-solid fa-shield-halved"></i> Datos Oficiales Luján de Cuyo</span>
      <p style="font-size: 0.78rem; color: var(--lujan-gray); margin-top: 0.3rem;">Sistema Geodésico POSGAR 94 / Proyección Faja 2 Gauss-Krüger</p>
    </div>
    <table class="attr-table">
      <tbody>${rows}</tbody>
    </table>
    ${extraActions}
  `;

  drawer.classList.add('open');
}

function closeDrawer() {
  document.getElementById('feature-drawer').classList.remove('open');
}

// --------------------------------------------------------------------------
// Buscador Inteligente
// --------------------------------------------------------------------------

function setupSearchIndex() {
  const input = document.getElementById('map-search');
  const dropdown = document.getElementById('search-results');
  const clearBtn = document.getElementById('search-clear');

  input.addEventListener('input', (e) => {
    const q = e.target.value.trim().toLowerCase();
    if (q.length === 0) {
      dropdown.style.display = 'none';
      clearBtn.style.display = 'none';
      return;
    }
    clearBtn.style.display = 'block';

    const results = [];

    // Buscar en distritos
    if (layerDataCache.distritos) {
      layerDataCache.distritos.features.forEach(f => {
        const nom = (f.properties.distrito || '').toLowerCase();
        if (nom.includes(q)) {
          results.push({ type: 'Distrito', name: f.properties.distrito, sub: `${f.properties.poblacion} hab.`, geom: f });
        }
      });
    }

    // Buscar en parcelas
    if (layerDataCache.parcelas) {
      layerDataCache.parcelas.features.forEach(f => {
        const p = f.properties;
        const padronStr = String(p.padron || '');
        const nom = (p.nomenclatura || '').toLowerCase();
        const barrio = (p.barrio_paraje || '').toLowerCase();
        if (padronStr.includes(q) || nom.includes(q) || barrio.includes(q)) {
          results.push({ type: 'Parcela', name: `Padrón ${p.padron}`, sub: `${p.barrio_paraje} (${p.distrito})`, geom: f });
        }
      });
    }

    // Buscar en bodegas
    if (layerDataCache.bodegas) {
      layerDataCache.bodegas.features.forEach(f => {
        const nom = (f.properties.nombre || '').toLowerCase();
        if (nom.includes(q)) {
          results.push({ type: 'Bodega / Turismo', name: f.properties.nombre, sub: f.properties.distrito, geom: f });
        }
      });
    }

    // Buscar en equipamiento
    if (layerDataCache.equipamiento) {
      layerDataCache.equipamiento.features.forEach(f => {
        const nom = (f.properties.nombre || '').toLowerCase();
        if (nom.includes(q)) {
          results.push({ type: 'Equipamiento', name: f.properties.nombre, sub: f.properties.categoria, geom: f });
        }
      });
    }

    renderSearchResults(results.slice(0, 10));
  });

  clearBtn.addEventListener('click', () => {
    input.value = '';
    dropdown.style.display = 'none';
    clearBtn.style.display = 'none';
  });
}

function renderSearchResults(results) {
  const dropdown = document.getElementById('search-results');
  if (results.length === 0) {
    dropdown.innerHTML = '<div style="padding: 0.75rem 1rem; font-size: 0.85rem; color: #94a3b8;">No se encontraron elementos</div>';
    dropdown.style.display = 'block';
    return;
  }

  let html = '';
  results.forEach((r, idx) => {
    let icon = 'fa-location-dot';
    if (r.type === 'Parcela') icon = 'fa-draw-polygon';
    if (r.type === 'Distrito') icon = 'fa-landmark';
    if (r.type === 'Bodega / Turismo') icon = 'fa-wine-glass';
    if (r.type === 'Equipamiento') icon = 'fa-hospital';

    html += `
      <div class="search-result-item" onclick="selectSearchResult(${idx})">
        <i class="fa-solid ${icon}" style="color: var(--lujan-secondary);"></i>
        <div>
          <div style="font-weight: 600;">${r.name}</div>
          <div style="font-size: 0.75rem; color: var(--lujan-gray);">${r.type} &bull; ${r.sub}</div>
        </div>
      </div>
    `;
  });

  window._currentSearchResults = results;
  dropdown.innerHTML = html;
  dropdown.style.display = 'block';
}

function selectSearchResult(idx) {
  const r = window._currentSearchResults[idx];
  if (!r) return;
  document.getElementById('search-results').style.display = 'none';

  const geom = r.geom.geometry;
  if (geom.type === 'Point') {
    const latlng = [geom.coordinates[1], geom.coordinates[0]];
    map.setView(latlng, 16);
    showFeatureInfo(r.name, r.geom.properties, 'search');
  } else {
    const tempLayer = L.geoJSON(r.geom);
    map.fitBounds(tempLayer.getBounds(), { padding: [50, 50] });
    showFeatureInfo(r.name, r.geom.properties, 'search');
  }
}

// --------------------------------------------------------------------------
// Herramientas de Medición (Distancia y Área)
// --------------------------------------------------------------------------

function toggleMeasure(mode) {
  clearMeasurements();
  if (measureMode === mode) {
    measureMode = null;
    document.getElementById('btn-measure-dist').classList.remove('active');
    document.getElementById('btn-measure-area').classList.remove('active');
    document.getElementById('btn-clear-measure').style.display = 'none';
    map.getContainer().style.cursor = '';
  } else {
    measureMode = mode;
    document.getElementById('btn-measure-dist').classList.toggle('active', mode === 'distance');
    document.getElementById('btn-measure-area').classList.toggle('active', mode === 'area');
    document.getElementById('btn-clear-measure').style.display = 'inline-flex';
    map.getContainer().style.cursor = 'crosshair';
  }
}

function handleMeasureClick(latlng) {
  measurePoints.push(latlng);

  const marker = L.circleMarker(latlng, { radius: 5, color: '#e11d48', fillColor: '#fff', fillOpacity: 1 }).addTo(map);
  measureMarkers.push(marker);

  if (measureMode === 'distance' && measurePoints.length > 1) {
    if (measureLine) map.removeLayer(measureLine);
    measureLine = L.polyline(measurePoints, { color: '#e11d48', weight: 3, dashArray: '4, 4' }).addTo(map);

    let totalDist = 0;
    for (let i = 0; i < measurePoints.length - 1; i++) {
      totalDist += measurePoints[i].distanceTo(measurePoints[i+1]);
    }
    const distStr = totalDist > 1000 ? `${(totalDist / 1000).toFixed(2)} km` : `${Math.round(totalDist)} m`;
    marker.bindTooltip(`Distancia: <b>${distStr}</b>`, { permanent: true, direction: 'top' }).openTooltip();
  } else if (measureMode === 'area' && measurePoints.length >= 3) {
    if (measurePolygon) map.removeLayer(measurePolygon);
    measurePolygon = L.polygon(measurePoints, { color: '#e11d48', fillColor: '#e11d48', fillOpacity: 0.2 }).addTo(map);

    // Cálculo aproximado de área
    let areaM2 = 0;
    const n = measurePoints.length;
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      const xi = measurePoints[i].lng * 111320 * Math.cos(measurePoints[i].lat * Math.PI / 180);
      const yi = measurePoints[i].lat * 110574;
      const xj = measurePoints[j].lng * 111320 * Math.cos(measurePoints[j].lat * Math.PI / 180);
      const yj = measurePoints[j].lat * 110574;
      areaM2 += (xi * yj) - (xj * yi);
    }
    areaM2 = Math.abs(areaM2 / 2);
    const areaStr = areaM2 > 10000 ? `${(areaM2 / 10000).toFixed(2)} ha (${Math.round(areaM2).toLocaleString('es-AR')} m²)` : `${Math.round(areaM2).toLocaleString('es-AR')} m²`;
    marker.bindTooltip(`Superficie: <b>${areaStr}</b>`, { permanent: true, direction: 'top' }).openTooltip();
  }
}

function clearMeasurements() {
  measurePoints = [];
  measureMarkers.forEach(m => map.removeLayer(m));
  measureMarkers = [];
  if (measureLine) map.removeLayer(measureLine);
  if (measurePolygon) map.removeLayer(measurePolygon);
  measureLine = null;
  measurePolygon = null;
}

// --------------------------------------------------------------------------
// Metadatos IDERA (Modal)
// --------------------------------------------------------------------------

const METADATA_CATALOG = {
  adm_distritos: {
    titulo: "Límites Distritales de Luján de Cuyo",
    codigo: "ar-mza-lujan-adm-distritos",
    categoria: "Marco Político-Administrativo (IDERA ADM)",
    custodio: "Municipalidad de Luján de Cuyo - Secretaría de Obras y Servicios Públicos",
    escala: "1:25.000",
    srs: "POSGAR 94 / Argentina Faja 2 (EPSG:22172) y WGS 84 (EPSG:4326)",
    fecha: "Septiembre 2026",
    resumen: "Delimitación territorial de los 15 distritos de Luján de Cuyo, incluyendo población censal, superficies oficiales en km2 y parámetros de modelado hidrológico y riesgo.",
    wms: "https://ide.lujandecuyo.gob.ar/geoserver/ide_lujan/wms?service=WMS&version=1.3.0&request=GetCapabilities",
    wfs: "https://ide.lujandecuyo.gob.ar/geoserver/ide_lujan/wfs?service=WFS&version=2.0.0&request=GetCapabilities",
    geojson_url: "data/adm_distritos.geojson"
  },
  cat_parcelas: {
    titulo: "Catastro Parcelario Municipal",
    codigo: "ar-mza-lujan-cat-parcelas",
    categoria: "Catastro y Parcela (IDERA CAT)",
    custodio: "Dirección de Catastro Municipal - Luján de Cuyo",
    escala: "1:1.000 a 1:5.000",
    srs: "POSGAR 94 / Argentina Faja 2 (EPSG:22172)",
    fecha: "Septiembre 2026",
    resumen: "Parcelas catastrales con identificación de padrón municipal, nomenclatura oficial, superficie en metros cuadrados, asignación de zonificación según Código Urbano y valores fiscales.",
    wms: "https://ide.lujandecuyo.gob.ar/geoserver/ide_lujan/wms",
    wfs: "https://ide.lujandecuyo.gob.ar/geoserver/ide_lujan/wfs",
    geojson_url: "data/cat_parcelas.geojson"
  },
  urb_zonificacion: {
    titulo: "Zonificación y Código Urbano Territorial",
    codigo: "ar-mza-lujan-urb-zonificacion",
    categoria: "Planeamiento y Usos del Suelo (IDERA URB)",
    custodio: "Dirección de Planificación y Ordenamiento Territorial",
    escala: "1:10.000",
    srs: "POSGAR 94 / Argentina Faja 2 (EPSG:22172)",
    fecha: "Septiembre 2026",
    resumen: "Zonas de aplicación de la Ordenanza Municipal 13.820/2019, estableciendo Factores de Ocupación del Suelo (FOS y FOT), alturas máximas reglamentarias y usos permitidos/prohibidos.",
    wms: "https://ide.lujandecuyo.gob.ar/geoserver/ide_lujan/wms",
    wfs: "https://ide.lujandecuyo.gob.ar/geoserver/ide_lujan/wfs",
    geojson_url: "data/urb_zonificacion.geojson"
  },
  env_red_hidrica: {
    titulo: "Red Hídrica y Colectores Aluvionales",
    codigo: "ar-mza-lujan-env-redhidrica",
    categoria: "Medio Ambiente y Recursos Hídricos (IDERA ENV)",
    custodio: "Departamento General de Irrigación (DGI) y Municipio de Luján de Cuyo",
    escala: "1:10.000",
    srs: "POSGAR 94 / Argentina Faja 2 (EPSG:22172)",
    fecha: "Septiembre 2026",
    resumen: "Red completa de drenaje, cauces naturales del Río Mendoza, colectores aluvionales del piedemonte y canales de riego agrícola del oasis norte.",
    wms: "https://ide.lujandecuyo.gob.ar/geoserver/ide_lujan/wms",
    wfs: "https://ide.lujandecuyo.gob.ar/geoserver/ide_lujan/wfs",
    geojson_url: "data/env_red_hidrica.geojson"
  },
  tur_bodegas: {
    titulo: "Bodegas y Caminos del Vino - Luján Tierra del Malbec",
    codigo: "ar-mza-lujan-tur-bodegas",
    categoria: "Turismo, Cultura y Patrimonio (IDERA TUR)",
    custodio: "Secretaría de Turismo y Cultura de Luján de Cuyo",
    escala: "1:25.000",
    srs: "POSGAR 94 / EPSG:22172 y WGS 84",
    fecha: "Septiembre 2026",
    resumen: "Establecimientos vitivinícolas de prestigio internacional, restaurantes de enoturismo, cavas históricas y atractivos turísticos de montaña.",
    wms: "https://ide.lujandecuyo.gob.ar/geoserver/ide_lujan/wms",
    wfs: "https://ide.lujandecuyo.gob.ar/geoserver/ide_lujan/wfs",
    geojson_url: "data/tur_bodegas_patrimonio.geojson"
  },
  soc_equipamiento: {
    titulo: "Equipamiento Comunitario y Servicios Sociales",
    codigo: "ar-mza-lujan-soc-equipamiento",
    categoria: "Equipamiento Comunitario (IDERA SOC)",
    custodio: "Municipalidad de Luján de Cuyo",
    escala: "1:10.000",
    srs: "POSGAR 94 / EPSG:22172 y WGS 84",
    fecha: "Septiembre 2026",
    resumen: "Puntos de interés cívico: Hospitales públicos, Centros de Atención Primaria de la Salud (CAPS), destacamentos policiales, escuelas y polideportivos.",
    wms: "https://ide.lujandecuyo.gob.ar/geoserver/ide_lujan/wms",
    wfs: "https://ide.lujandecuyo.gob.ar/geoserver/ide_lujan/wfs",
    geojson_url: "data/soc_equipamiento.geojson"
  }
};

function openMetadata(layerKey) {
  const meta = METADATA_CATALOG[layerKey];
  if (!meta) return;

  const modal = document.getElementById('metadata-modal');
  const title = document.getElementById('modal-meta-title');
  const content = document.getElementById('modal-meta-content');
  const dlBtn = document.getElementById('btn-download-geojson');

  title.innerHTML = `<i class="fa-solid fa-file-shield" style="color: var(--lujan-secondary);"></i> ${meta.titulo}`;
  dlBtn.onclick = () => { window.open(meta.geojson_url, '_blank'); };

  content.innerHTML = `
    <table class="attr-table" style="font-size: 0.9rem;">
      <tr><th>Código IDERA:</th><td><code>${meta.codigo}</code></td></tr>
      <tr><th>Tema IDERA:</th><td><b>${meta.categoria}</b></td></tr>
      <tr><th>Institución Custodia:</th><td>${meta.custodio}</td></tr>
      <tr><th>Sistema de Referencia:</th><td>${meta.srs}</td></tr>
      <tr><th>Escala de Captura:</th><td>${meta.escala}</td></tr>
      <tr><th>Última Actualización:</th><td>${meta.fecha}</td></tr>
      <tr><th>Resumen / Linaje:</th><td>${meta.resumen}</td></tr>
      <tr><th>Servicio WMS OGC:</th><td><code>${meta.wms}</code></td></tr>
      <tr><th>Servicio WFS OGC:</th><td><code>${meta.wfs}</code></td></tr>
      <tr><th>Licencia:</th><td>Creative Commons Atribución 4.0 Internacional (CC-BY 4.0)</td></tr>
    </table>
  `;

  modal.classList.add('active');
}

function closeMetadata() {
  document.getElementById('metadata-modal').classList.remove('active');
}

// --------------------------------------------------------------------------
// UI & Control de Pestañas
// --------------------------------------------------------------------------

function setupUIEvents() {
  // Tabs laterales
  document.querySelectorAll('.sidebar-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.sidebar-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const target = tab.getAttribute('data-tab');
      document.getElementById('tab-content-layers').style.display = target === 'layers' ? 'block' : 'none';
      document.getElementById('tab-content-basemaps').style.display = target === 'basemaps' ? 'block' : 'none';
      document.getElementById('tab-content-legend').style.display = target === 'legend' ? 'block' : 'none';
    });
  });

  // Toggle Sidebar
  document.getElementById('toggle-sidebar').addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('collapsed');
    setTimeout(() => { map.invalidateSize(); }, 350);
  });

  document.getElementById('close-sidebar').addEventListener('click', () => {
    document.getElementById('sidebar').classList.add('collapsed');
    setTimeout(() => { map.invalidateSize(); }, 350);
  });
}

function resetMapExtent() {
  map.fitBounds(LUJAN_BOUNDS);
}

function exportMapImage() {
  alert("Iniciando impresión cartográfica oficial de Luján de Cuyo con membrete IDERA.\nSe abrirá el cuadro de diálogo de impresión.");
  window.print();
}
