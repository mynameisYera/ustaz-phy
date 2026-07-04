import type { VectorTaskConfig } from './VectorTaskConfig';

export const GRADE_7_VECTOR_TASK: VectorTaskConfig = {
  id: 'grade-7-sum',
  label: '7-сынып',
  dimension: 2,
  appName: 'graphing',
  perspective: 'G',
  showGrid: true,
  showAlgebraInput: false,
  showToolBar: false,
  vectors: [
    { name: 'u', components: [3, 2], fixed: true, color: '#1E6E5C' },
    { name: 'v', components: [-1, 3], fixed: true, color: '#C25B3A' },
  ],
  objective: 'Екі вектордың қосындысын тап: u + v',
  referenceExpression: 'u + v',
  referenceObjectName: 'sumRef',
};

export const GRADE_11_VECTOR_TASK: VectorTaskConfig = {
  id: 'grade-11-dot-product',
  label: '11-сынып',
  dimension: 3,
  appName: '3d',
  perspective: '1',
  showGrid: true,
  showAlgebraInput: true,
  showToolBar: true,
  vectors: [
    { name: 'u', components: [1, 2, 3], fixed: false, color: '#1E6E5C' },
    { name: 'v', components: [2, -1, 4], fixed: false, color: '#C25B3A' },
  ],
  objective: 'Екі вектордың скаляр (нүктелік) көбейтіндісін тап: u · v',
  referenceExpression: 'u * v',
  referenceObjectName: 'dotRef',
};

export const VECTOR_TASK_CONFIGS: VectorTaskConfig[] = [GRADE_7_VECTOR_TASK, GRADE_11_VECTOR_TASK];
