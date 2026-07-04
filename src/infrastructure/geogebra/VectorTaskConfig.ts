import type { GeoGebraApi, GeoGebraAppName } from './GeoGebraApplet';

export interface VectorSpec {
  name: string;
  components: number[];
  fixed: boolean;
  color?: string;
}

export interface VectorTaskConfig {
  id: string;
  label: string;
  dimension: 2 | 3;
  appName: GeoGebraAppName;
  perspective: string;
  showGrid: boolean;
  showAlgebraInput: boolean;
  showToolBar: boolean;
  vectors: VectorSpec[];
  objective: string;
  /** GeoGebra command building the hidden reference object, e.g. "u + v" */
  referenceExpression: string;
  referenceObjectName: string;
}

function toGgbPoint(components: number[]): string {
  return `(${components.join(', ')})`;
}

export function setupVectorTask(api: GeoGebraApi, config: VectorTaskConfig): void {
  api.setGridVisible(config.showGrid);
  api.setPerspective(config.perspective);

  for (const vector of config.vectors) {
    api.evalCommand(`${vector.name}=Vector(${toGgbPoint(vector.components)})`);
    api.setFixed(vector.name, vector.fixed);
    if (vector.color) {
      api.evalCommand(`SetColor(${vector.name}, "${vector.color}")`);
    }
  }

  api.evalCommand(`${config.referenceObjectName}=${config.referenceExpression}`);
  api.setVisible(config.referenceObjectName, false);
}
