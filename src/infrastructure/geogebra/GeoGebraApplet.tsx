import { useEffect, useRef } from 'react';

const DEPLOY_SCRIPT_URL = 'https://www.geogebra.org/apps/deployggb.js';

let scriptLoadPromise: Promise<void> | null = null;

function loadDeployScript(): Promise<void> {
  if (window.GGBApplet) return Promise.resolve();
  if (scriptLoadPromise) return scriptLoadPromise;

  scriptLoadPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${DEPLOY_SCRIPT_URL}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Failed to load GeoGebra deploy script')));
      return;
    }

    const script = document.createElement('script');
    script.src = DEPLOY_SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load GeoGebra deploy script'));
    document.head.appendChild(script);
  });

  return scriptLoadPromise;
}

export type GeoGebraAppName = 'graphing' | 'geometry' | '3d';

export interface GeoGebraApi {
  evalCommand(command: string): boolean;
  getValue(objName: string): number;
  getValueString(objName: string): string;
  setFixed(objName: string, fixed: boolean): void;
  setVisible(objName: string, visible: boolean): void;
  setGridVisible(flag: boolean): void;
  setPerspective(perspective: string): void;
  registerObjectUpdateListener(objName: string, listener: () => void): void;
  unregisterObjectUpdateListener(objName: string): void;
  deleteObject(objName: string): void;
  exists(objName: string): boolean;
  setErrorDialogsActive(flag: boolean): void;
  remove(): void;
}

interface GGBAppletInstance {
  inject(containerId: string): void;
}

declare global {
  interface Window {
    GGBApplet?: new (params: Record<string, unknown>, useBrowserForJS: boolean) => GGBAppletInstance;
    [key: string]: unknown;
  }
}

export interface GeoGebraAppletProps {
  appName: GeoGebraAppName;
  width: number;
  height: number;
  showToolBar?: boolean;
  showAlgebraInput?: boolean;
  perspective?: string;
  onReady: (api: GeoGebraApi) => void;
}

let appletInstanceCounter = 0;

export function GeoGebraApplet({
  appName,
  width,
  height,
  showToolBar = false,
  showAlgebraInput = false,
  perspective,
  onReady,
}: GeoGebraAppletProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const containerIdRef = useRef(`ggb-applet-${++appletInstanceCounter}`);
  const appletRef = useRef<GGBAppletInstance | null>(null);
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;

  useEffect(() => {
    let cancelled = false;

    loadDeployScript()
      .then(() => {
        if (cancelled || !containerRef.current || !window.GGBApplet) return;

        const containerId = containerIdRef.current;

        const applet = new window.GGBApplet(
          {
            appName,
            width,
            height,
            showToolBar,
            showAlgebraInput,
            showMenuBar: false,
            showResetIcon: false,
            enableRightClick: false,
            perspective,
            appletOnLoad: (api: GeoGebraApi) => {
              if (cancelled) return;
              // Suppress GeoGebra's modal error dialogs; failed commands are handled in code.
              try {
                api.setErrorDialogsActive(false);
              } catch {
                /* older applet builds may not expose this — ignore */
              }
              onReadyRef.current(api);
            },
          },
          true
        );

        appletRef.current = applet;
        applet.inject(containerId);
      })
      .catch((err) => {
        console.error('[GeoGebraApplet] failed to load deployggb.js', err);
      });

    return () => {
      cancelled = true;
      const container = containerRef.current;
      if (container) container.innerHTML = '';
      appletRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appName]);

  return (
    <div
      ref={containerRef}
      id={containerIdRef.current}
      style={{ width, height }}
    />
  );
}
