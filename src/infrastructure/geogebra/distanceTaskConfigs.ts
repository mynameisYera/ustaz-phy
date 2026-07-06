import type { DistanceTaskConfig } from './DistanceTaskConfig';

export const GRADE_7_DISTANCE_TASK: DistanceTaskConfig = {
  id: 'grade-7-distance',
  label: '7-сынып',
  appName: 'graphing',
  showGrid: true,
  showAlgebraInput: false,
  showToolBar: false,
  xMin: -5,
  xMax: 5,
  yMin: -5,
  yMax: 5,
  // Road network — horizontal streets and vertical streets forming a town grid.
  horizontalRoads: [5, 3, 0, -5],
  verticalRoads: [-5, -3, 2, 5],
  landmarks: [
    { name: 'shop', point: [-3, 5], emoji: '🏪', label: 'Дүкен' },
    { name: 'temple', point: [2, 5], emoji: '🏛️', label: 'Мұражай' },
    { name: 'house', point: [2, 3], emoji: '🏠', label: 'Үй' },
    { name: 'school', point: [5, 1], emoji: '🏫', label: 'Мектеп' },
    { name: 'park', point: [-5, -5], emoji: '🌳', label: 'Саябақ' },
  ],
  start: [-3, 0],
  objective: 'Машинаны қала көшелерімен сүйреп апарып, жүрген қашықтықты бақылаңыз.',
};

export const DISTANCE_TASK_CONFIGS: DistanceTaskConfig[] = [GRADE_7_DISTANCE_TASK];
