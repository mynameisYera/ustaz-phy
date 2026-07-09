export interface KzHistoryCity {
  id: string;
  name: string;
  /** 0–1 по ширине исходного PNG */
  x: number;
  /** 0–1 по высоте исходного PNG */
  y: number;
  color: string;
}

/** Координаты совпадают с белыми кругами на kazakhstan-map.png (1566×870) */
export const KZ_HISTORY_CITIES: KzHistoryCity[] = [
  { id: 'saraishyk', name: 'Сарайшық', x: 0.1501, y: 0.4644, color: '#0d9488' },
  { id: 'imaqia', name: 'Имақия', x: 0.878, y: 0.3448, color: '#ea580c' },
  { id: 'otrar', name: 'Отырар', x: 0.3723, y: 0.6598, color: '#166534' },
  { id: 'syganak', name: 'Сығанақ', x: 0.523, y: 0.7287, color: '#dc2626' },
  { id: 'turkestan', name: 'Түркістан', x: 0.5524, y: 0.7977, color: '#f97316' },
  { id: 'sayram', name: 'Сайрам', x: 0.5562, y: 0.8299, color: '#db2777' },
  { id: 'jankent', name: 'Жанкент', x: 0.6034, y: 0.8483, color: '#0284c7' },
  { id: 'taraz', name: 'Тараз', x: 0.56, y: 0.8621, color: '#1e3a8a' },
];
