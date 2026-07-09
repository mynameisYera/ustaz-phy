import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

export interface MapEngineProps {
  width: number;
  height: number;
  styleUrl: string;
  onReady: (map: maplibregl.Map) => void;
}

export function MapEngine({ width, height, styleUrl, onReady }: MapEngineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;

  useEffect(() => {
    mapRef.current?.resize();
  }, [width, height]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const map = new maplibregl.Map({
      container,
      style: styleUrl,
      center: [0, 0],
      zoom: 1,
    });
    mapRef.current = map;

    map.on('load', () => {
      onReadyRef.current(map);
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [styleUrl]);

  return <div ref={containerRef} style={{ width, height }} />;
}
