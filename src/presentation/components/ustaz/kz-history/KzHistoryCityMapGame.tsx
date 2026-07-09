import { useEffect, useMemo, useRef, useState } from 'react';
import mapImage from '@/assets/kz-history/kazakhstan-map.png';
import { KZ_HISTORY_CITIES, type KzHistoryCity } from '@/domain/kz-history/kzHistoryCities';
import '@/presentation/styles/kz-history-game.css';

const DROP_RADIUS = 40;

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

interface KzHistoryCityMapGameProps {
  fullscreen?: boolean;
}

export function KzHistoryCityMapGame({ fullscreen = false }: KzHistoryCityMapGameProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const pointsRef = useRef<Record<string, { x: number; y: number }>>({});
  const dragRef = useRef<{ cityId: string; x: number; y: number } | null>(null);

  const [bankOrder, setBankOrder] = useState(() => shuffle(KZ_HISTORY_CITIES.map((c) => c.id)));
  const [assignments, setAssignments] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [drag, setDrag] = useState<{ cityId: string; x: number; y: number } | null>(null);
  const [hoverSlot, setHoverSlot] = useState<string | null>(null);
  const [points, setPoints] = useState<Record<string, { x: number; y: number }>>({});

  const cityById = useMemo(() => Object.fromEntries(KZ_HISTORY_CITIES.map((c) => [c.id, c])), []);
  const placedIds = useMemo(() => new Set(Object.values(assignments)), [assignments]);
  const allPlaced = Object.keys(assignments).length === KZ_HISTORY_CITIES.length;

  const syncPoints = () => {
    const stage = stageRef.current;
    const img = imgRef.current;
    if (!stage || !img || !img.naturalWidth) return;

    const { width, height } = stage.getBoundingClientRect();
    const scale = Math.min(width / img.naturalWidth, height / img.naturalHeight);
    const renderedW = img.naturalWidth * scale;
    const renderedH = img.naturalHeight * scale;
    const offsetX = (width - renderedW) / 2;
    const offsetY = (height - renderedH) / 2;

    const next: Record<string, { x: number; y: number }> = {};
    for (const city of KZ_HISTORY_CITIES) {
      next[city.id] = {
        x: offsetX + city.x * renderedW,
        y: offsetY + city.y * renderedH,
      };
    }
    pointsRef.current = next;
    setPoints(next);
  };

  useEffect(() => {
    syncPoints();
    const stage = stageRef.current;
    if (!stage) return;

    const observer = new ResizeObserver(syncPoints);
    observer.observe(stage);
    return () => observer.disconnect();
  }, [fullscreen]);

  useEffect(() => {
    dragRef.current = drag;
  }, [drag]);

  const findSlotAt = (clientX: number, clientY: number): string | null => {
    const stage = stageRef.current;
    if (!stage) return null;
    const rect = stage.getBoundingClientRect();

    for (const city of KZ_HISTORY_CITIES) {
      const point = pointsRef.current[city.id];
      if (!point) continue;
      const sx = rect.left + point.x;
      const sy = rect.top + point.y;
      if (Math.hypot(clientX - sx, clientY - sy) <= DROP_RADIUS) return city.id;
    }
    return null;
  };

  const startDrag = (cityId: string, clientX: number, clientY: number, target: HTMLElement, pointerId: number) => {
    if (placedIds.has(cityId)) return;
    target.setPointerCapture(pointerId);
    setSubmitted(false);
    setScore(null);
    const next = { cityId, x: clientX, y: clientY };
    dragRef.current = next;
    setDrag(next);
  };

  useEffect(() => {
    if (!drag) return;

    const onMove = (e: PointerEvent) => {
      const current = dragRef.current;
      if (!current) return;
      const next = { ...current, x: e.clientX, y: e.clientY };
      dragRef.current = next;
      setDrag(next);
      setHoverSlot(findSlotAt(e.clientX, e.clientY));
    };

    const finish = (e: PointerEvent) => {
      const current = dragRef.current;
      if (!current) return;

      const slotId = findSlotAt(e.clientX, e.clientY);
      if (slotId) {
        setAssignments((prev) => {
          const next = { ...prev };
          const existingSlot = Object.entries(next).find(([, cityId]) => cityId === current.cityId)?.[0];
          if (existingSlot) delete next[existingSlot];
          next[slotId] = current.cityId;
          return next;
        });
      }

      dragRef.current = null;
      setDrag(null);
      setHoverSlot(null);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', finish);
    window.addEventListener('pointercancel', finish);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', finish);
      window.removeEventListener('pointercancel', finish);
    };
  }, [drag]);

  const handleSubmit = () => {
    if (!allPlaced) return;
    let correct = 0;
    for (const city of KZ_HISTORY_CITIES) {
      if (assignments[city.id] === city.id) correct += 1;
    }
    setScore(correct);
    setSubmitted(true);
  };

  const handleReset = () => {
    setAssignments({});
    setSubmitted(false);
    setScore(null);
    setBankOrder(shuffle(KZ_HISTORY_CITIES.map((c) => c.id)));
  };

  const renderChip = (city: KzHistoryCity, placed: boolean) => (
    <button
      key={city.id}
      type="button"
      className={`kz-map-chip${placed ? ' kz-map-chip--placed' : ''}${drag?.cityId === city.id ? ' kz-map-chip--dragging' : ''}`}
      style={{ background: city.color }}
      onPointerDown={(e) => {
        if (placed) return;
        e.preventDefault();
        startDrag(city.id, e.clientX, e.clientY, e.currentTarget, e.pointerId);
      }}
      disabled={placed}
    >
      <span>{city.name}</span>
      <span className="kz-map-chip__dot" aria-hidden />
    </button>
  );

  return (
    <div className="kz-map-root">
      <div className={`kz-map-game${fullscreen ? ' kz-map-game--fullscreen' : ''}`}>
        <aside className="kz-map-sidebar" aria-label="Қала атаулары">
          {bankOrder.map((id) => renderChip(cityById[id], placedIds.has(id)))}
        </aside>

        <div ref={stageRef} className="kz-map-stage">
          <img ref={imgRef} src={mapImage} alt="Қазақстан картасы" className="kz-map-image" draggable={false} onLoad={syncPoints} />
          <div className="kz-map-overlay">
            {KZ_HISTORY_CITIES.map((city) => {
              const point = points[city.id];
              if (!point) return null;
              const assignedId = assignments[city.id];
              const assignedCity = assignedId ? cityById[assignedId] : null;
              const isCorrect = submitted && assignedId === city.id;
              const isWrong = submitted && assignedId != null && assignedId !== city.id;

              return (
                <div
                  key={city.id}
                  className={[
                    'kz-map-drop',
                    hoverSlot === city.id ? 'kz-map-drop--hover' : '',
                    assignedCity ? 'kz-map-drop--filled' : '',
                    isCorrect ? 'kz-map-drop--correct' : '',
                    isWrong ? 'kz-map-drop--wrong' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  style={{ left: point.x, top: point.y }}
                >
                  {assignedCity && (
                    <span className="kz-map-drop__label" style={{ background: assignedCity.color }}>
                      {assignedCity.name}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="kz-map-footer">
        {submitted && score != null ? (
          <>
            <p
              className={`kz-map-footer__result${score === KZ_HISTORY_CITIES.length ? ' kz-map-footer__result--success' : ' kz-map-footer__result--partial'}`}
            >
              {score === KZ_HISTORY_CITIES.length
                ? `🎉 Барлығы дұрыс! ${score}/${KZ_HISTORY_CITIES.length}`
                : `Нәтиже: ${score}/${KZ_HISTORY_CITIES.length} дұрыс`}
            </p>
            <button type="button" className="kz-map-footer__reset" onClick={handleReset}>
              Қайта бастау
            </button>
          </>
        ) : (
          <button
            type="button"
            className={`kz-map-footer__submit${allPlaced ? ' kz-map-footer__submit--ready' : ''}`}
            disabled={!allPlaced}
            onClick={handleSubmit}
          >
            Жауаптарды жіберу
          </button>
        )}
      </div>

      {drag && (
        <div
          className="kz-map-chip kz-map-chip--ghost"
          style={{ left: drag.x, top: drag.y, background: cityById[drag.cityId].color }}
        >
          <span>{cityById[drag.cityId].name}</span>
          <span className="kz-map-chip__dot" aria-hidden />
        </div>
      )}
    </div>
  );
}
