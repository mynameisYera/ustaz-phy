import maplibregl from 'maplibre-gl';

export interface GeoMarkerSpec {
  name: string;
  label: string;
  lng: number;
  lat: number;
}

export type GeoTaskMode = '2d' | '3d' | 'globe';
export type GeoTaskObjective = 'measure_distance' | 'explore';

export interface GeoTaskConfig {
  id: string;
  label: string;
  styleUrl: string;
  center: [number, number];
  zoom: number;
  pitch: number;
  bearing: number;
  mode: GeoTaskMode;
  markers: GeoMarkerSpec[];
  enableTerrain: boolean;
  objective: GeoTaskObjective;
  locked: boolean;
}

export interface GeoTaskRuntimeState {
  markers: maplibregl.Marker[];
  terrainEnabled: boolean;
  terrainNote: string | null;
  onMeasureUpdate?: (distanceKm: number | null, pointCount: number) => void;
  destroy: () => void;
}

const EARTH_RADIUS_KM = 6371;

/** Haversine great-circle distance between two [lng, lat] points, in kilometers. */
export function haversineDistanceKm(a: [number, number], b: [number, number]): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const [lng1, lat1] = a;
  const [lng2, lat2] = b;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);

  const h =
    sinDLat * sinDLat +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * sinDLng * sinDLng;

  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

const MEASURE_SOURCE_ID = 'geo-task-measure-line';
const MEASURE_POINTS_SOURCE_ID = 'geo-task-measure-points';

function attemptEnableTerrain(map: maplibregl.Map): { enabled: boolean; note: string | null } {
  const demKey = import.meta.env.VITE_MAPTILER_DEM_KEY as string | undefined;

  if (!demKey) {
    return {
      enabled: false,
      note: 'Terrain skipped — no DEM tile key configured (VITE_MAPTILER_DEM_KEY). Wire in a real key later.',
    };
  }

  try {
    map.addSource('geo-task-dem', {
      type: 'raster-dem',
      url: `https://api.maptiler.com/tiles/terrain-rgb/tiles.json?key=${demKey}`,
      tileSize: 256,
    });
    map.setTerrain({ source: 'geo-task-dem', exaggeration: 1.2 });
    return { enabled: true, note: null };
  } catch (err) {
    console.warn('[setupGeoTask] terrain setup failed, continuing without it', err);
    return { enabled: false, note: 'Terrain failed to initialize — continuing without it.' };
  }
}

function enableBuildingExtrusion(map: maplibregl.Map): void {
  const style = map.getStyle();
  const buildingLayer = style?.layers?.find(
    (layer): layer is maplibregl.FillLayerSpecification =>
      layer.type === 'fill' && layer.id.toLowerCase().includes('building')
  );

  if (!buildingLayer) {
    console.warn('[setupGeoTask] no building fill layer found in style; skipping 3D extrusion');
    return;
  }

  const sourceLayer = buildingLayer['source-layer'];

  map.addLayer({
    id: 'geo-task-building-extrusion',
    type: 'fill-extrusion',
    source: buildingLayer.source,
    ...(sourceLayer ? { 'source-layer': sourceLayer } : {}),
    minzoom: 14,
    paint: {
      'fill-extrusion-color': '#C9B98A',
      'fill-extrusion-height': ['coalesce', ['get', 'render_height'], ['get', 'height'], 8],
      'fill-extrusion-base': ['coalesce', ['get', 'render_min_height'], 0],
      'fill-extrusion-opacity': 0.85,
    },
  });
}

function setupMeasureDistance(
  map: maplibregl.Map,
  onUpdate?: (distanceKm: number | null, pointCount: number) => void
): () => void {
  const points: [number, number][] = [];

  map.addSource(MEASURE_POINTS_SOURCE_ID, {
    type: 'geojson',
    data: { type: 'FeatureCollection', features: [] },
  });
  map.addLayer({
    id: 'geo-task-measure-points-layer',
    type: 'circle',
    source: MEASURE_POINTS_SOURCE_ID,
    paint: {
      'circle-radius': 6,
      'circle-color': '#1E6E5C',
      'circle-stroke-width': 2,
      'circle-stroke-color': '#FFFFFF',
    },
  });

  map.addSource(MEASURE_SOURCE_ID, {
    type: 'geojson',
    data: { type: 'FeatureCollection', features: [] },
  });
  map.addLayer({
    id: 'geo-task-measure-line-layer',
    type: 'line',
    source: MEASURE_SOURCE_ID,
    paint: {
      'line-color': '#C9A96A',
      'line-width': 3,
      'line-dasharray': [2, 1],
    },
  });

  const render = () => {
    const pointsSource = map.getSource(MEASURE_POINTS_SOURCE_ID) as maplibregl.GeoJSONSource | undefined;
    pointsSource?.setData({
      type: 'FeatureCollection',
      features: points.map((p) => ({ type: 'Feature', geometry: { type: 'Point', coordinates: p }, properties: {} })),
    });

    const lineSource = map.getSource(MEASURE_SOURCE_ID) as maplibregl.GeoJSONSource | undefined;
    lineSource?.setData({
      type: 'FeatureCollection',
      features:
        points.length === 2
          ? [{ type: 'Feature', geometry: { type: 'LineString', coordinates: points }, properties: {} }]
          : [],
    });

    const distanceKm = points.length === 2 ? haversineDistanceKm(points[0], points[1]) : null;
    onUpdate?.(distanceKm, points.length);
  };

  const handleClick = (e: maplibregl.MapMouseEvent) => {
    if (points.length >= 2) {
      points.length = 0;
    }
    points.push([e.lngLat.lng, e.lngLat.lat]);
    render();
  };

  map.on('click', handleClick);
  render();

  return () => {
    map.off('click', handleClick);
  };
}

export function setupGeoTask(map: maplibregl.Map, config: GeoTaskConfig): GeoTaskRuntimeState {
  if (config.mode === 'globe') {
    map.setProjection({ type: 'globe' });
  }

  map.jumpTo({
    center: config.center,
    zoom: config.zoom,
    pitch: config.pitch,
    bearing: config.bearing,
  });

  if (config.locked) {
    map.boxZoom.disable();
    map.scrollZoom.disable();
    map.dragRotate.disable();
    map.dragPan.enable();
    map.keyboard.disable();
    map.doubleClickZoom.disable();
    map.touchZoomRotate.disable();
  } else {
    map.boxZoom.enable();
    map.scrollZoom.enable();
    map.dragRotate.enable();
    map.dragPan.enable();
    map.keyboard.enable();
    map.doubleClickZoom.enable();
    map.touchZoomRotate.enable();
  }

  const markers = config.markers.map((spec) => {
    const el = document.createElement('div');
    el.style.cssText =
      'background:#1E6E5C;color:#fff;padding:2px 8px;border-radius:12px;font-size:12px;font-family:inherit;white-space:nowrap;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,0.3);';
    el.textContent = spec.label;

    return new maplibregl.Marker({ element: el })
      .setLngLat([spec.lng, spec.lat])
      .addTo(map);
  });

  if (config.mode === '3d') {
    enableBuildingExtrusion(map);
  }

  let terrainEnabled = false;
  let terrainNote: string | null = null;
  if (config.enableTerrain) {
    const result = attemptEnableTerrain(map);
    terrainEnabled = result.enabled;
    terrainNote = result.note;
  }

  let cleanupMeasure: (() => void) | null = null;
  const state: GeoTaskRuntimeState = {
    markers,
    terrainEnabled,
    terrainNote,
    destroy: () => {
      cleanupMeasure?.();
      markers.forEach((m) => m.remove());
    },
  };

  if (config.objective === 'measure_distance') {
    cleanupMeasure = setupMeasureDistance(map, (distanceKm, pointCount) => {
      state.onMeasureUpdate?.(distanceKm, pointCount);
    });
  }

  return state;
}
