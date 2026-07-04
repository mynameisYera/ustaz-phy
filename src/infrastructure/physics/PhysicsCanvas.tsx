import { useEffect, useRef } from 'react';
import Matter from 'matter-js';

export interface PhysicsWorldHandle {
  engine: Matter.Engine;
  world: Matter.World;
  render: Matter.Render;
}

export interface PhysicsCanvasProps {
  width: number;
  height: number;
  gravity?: number;
  onReady: (handle: PhysicsWorldHandle) => void;
}

export function PhysicsCanvas({ width, height, gravity = 1, onReady }: PhysicsCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const engine = Matter.Engine.create();
    engine.gravity.y = gravity;

    const render = Matter.Render.create({
      element: container,
      engine,
      options: {
        width,
        height,
        wireframes: false,
        background: '#EAF1FF',
      },
    });

    const runner = Matter.Runner.create();
    Matter.Runner.run(runner, engine);
    Matter.Render.run(render);

    onReadyRef.current({ engine, world: engine.world, render });

    return () => {
      Matter.Render.stop(render);
      Matter.Runner.stop(runner);
      Matter.World.clear(engine.world, false);
      Matter.Engine.clear(engine);
      render.canvas.remove();
      render.textures = {};
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width, height, gravity]);

  return <div ref={containerRef} style={{ width, height }} />;
}
