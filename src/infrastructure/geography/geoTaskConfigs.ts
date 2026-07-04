import type { GeoTaskConfig } from './GeoTaskConfig';

export const OPENFREEMAP_STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';
export const GLOBE_STYLE_URL = 'https://demotiles.maplibre.org/globe.json';

export const GRADE_7_GEO_TASK: GeoTaskConfig = {
  id: 'grade-7-geo',
  label: '7-сынып',
  styleUrl: OPENFREEMAP_STYLE_URL,
  center: [71.4491, 51.1694], // Astana
  zoom: 5,
  pitch: 0,
  bearing: 0,
  mode: '2d',
  markers: [
    { name: 'astana', label: 'Астана', lng: 71.4491, lat: 51.1694 },
    { name: 'almaty', label: 'Алматы', lng: 76.9286, lat: 43.2567 },
  ],
  enableTerrain: false,
  objective: 'measure_distance',
  locked: true,
};

export const GRADE_8_GEO_TASK: GeoTaskConfig = {
  id: 'grade-8-geo',
  label: '8-сынып',
  styleUrl: GLOBE_STYLE_URL,
  center: [67.0, 48.0], // Kazakhstan, centered on the globe
  zoom: 2,
  pitch: 0,
  bearing: 0,
  mode: 'globe',
  markers: [
    { name: 'astana', label: 'Астана', lng: 71.4491, lat: 51.1694 },
  ],
  enableTerrain: false,
  objective: 'explore',
  locked: false,
};

export const GRADE_11_GEO_TASK: GeoTaskConfig = {
  id: 'grade-11-geo',
  label: '11-сынып',
  styleUrl: OPENFREEMAP_STYLE_URL,
  center: [-73.9857, 40.7484], // Manhattan, dense building skyline
  zoom: 15.5,
  pitch: 55,
  bearing: -20,
  mode: '3d',
  markers: [
    { name: 'landmark', label: 'Empire State Building', lng: -73.9857, lat: 40.7484 },
  ],
  enableTerrain: true,
  objective: 'explore',
  locked: false,
};

export const GEO_TASK_CONFIGS: GeoTaskConfig[] = [GRADE_7_GEO_TASK, GRADE_8_GEO_TASK, GRADE_11_GEO_TASK];
