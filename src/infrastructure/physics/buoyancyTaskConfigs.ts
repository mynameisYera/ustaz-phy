import type { BuoyancyTaskConfig } from './BuoyancyTaskConfig';

export const MATERIAL_PRESETS = {
  cork: { label: 'Тығын (cork)', density: 240 },
  wood: { label: 'Ағаш (wood)', density: 600 },
  water: { label: 'Су (water)', density: 1000 },
  iron: { label: 'Темір (iron)', density: 7870 },
} as const;

export type MaterialKey = keyof typeof MATERIAL_PRESETS;

const CANVAS_WIDTH = 720;
const CANVAS_HEIGHT = 460;
const WATER_Y = 230;
const WATER_DENSITY = 1000; // kg/m^3, fresh water

export function buildGrade7Config(material: MaterialKey): BuoyancyTaskConfig {
  return {
    id: `grade-7-${material}`,
    label: '7-сынып',
    width: CANVAS_WIDTH,
    height: CANVAS_HEIGHT,
    waterY: WATER_Y,
    fluidDensity: WATER_DENSITY,
    objects: [
      {
        name: 'sample',
        shape: 'circle',
        size: 40,
        density: MATERIAL_PRESETS[material].density,
        x: CANVAS_WIDTH / 2,
        y: WATER_Y - 80,
        fixed: false,
        color: '#C25B3A',
      },
    ],
    objective: 'Материалды таңдап, ол суда қалқып шығатынын немесе бататынын бақылаңыз.',
    showNumericReadout: false,
  };
}

export const GRADE_11_BUOYANCY_TASK: BuoyancyTaskConfig = {
  id: 'grade-11-buoyancy',
  label: '11-сынып',
  width: CANVAS_WIDTH,
  height: CANVAS_HEIGHT,
  waterY: WATER_Y,
  fluidDensity: WATER_DENSITY,
  objects: [
    {
      name: 'sample',
      shape: 'rectangle',
      size: 40,
      density: 700,
      x: CANVAS_WIDTH / 2,
      y: WATER_Y - 80,
      fixed: false,
      color: '#1E6E5C',
    },
  ],
  objective: 'Дене тығыздығы мен сұйықтық тығыздығын өзгертіп, батыру көлемінің үлесін және Архимед күшін (Н) есептеңіз.',
  showNumericReadout: true,
};
