import type { VectorTaskConfig } from './VectorTaskConfig';

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

export const VECTOR_TASK_CONFIGS: VectorTaskConfig[] = [GRADE_11_VECTOR_TASK];
