import { useCallback } from 'react';
import { AMapContainer } from './AMapContainer';
import type { DrivePosition } from '../../../types/drive';
import type { ThemeType } from '../../hooks/useTheme';

interface DriveRouteProps {
  positions: DrivePosition[];
  startLocation?: string;
  endLocation?: string;
  theme?: ThemeType;
}

export function DriveRoute({ positions, startLocation, endLocation, theme = 'tesla' }: DriveRouteProps) {
  const handleMapReady = useCallback(
    (map: any, AMap: any) => {
      if (positions.length === 0) return;

      const path = positions.map(
        (p) => new AMap.LngLat(p.longitude, p.latitude)
      );

      const strokeColor = theme === 'cyberpunk' ? '#00f5ff' : theme === 'glass' ? '#3b82f6' : '#e82127';

      const polyline = new AMap.Polyline({
        path,
        strokeColor,
        strokeWeight: 4,
        strokeOpacity: 0.9,
        lineJoin: 'round',
        lineCap: 'round',
      });

      map.add(polyline);

      const startMarker = new AMap.Marker({
        position: path[0],
        content: `<div style="background:#22c55e;color:white;padding:2px 6px;border-radius:4px;font-size:11px;font-weight:500;">起</div>`,
        offset: new AMap.Pixel(-12, -12),
      });
      map.add(startMarker);

      const endMarker = new AMap.Marker({
        position: path[path.length - 1],
        content: `<div style="background:#ef4444;color:white;padding:2px 6px;border-radius:4px;font-size:11px;font-weight:500;">终</div>`,
        offset: new AMap.Pixel(-12, -12),
      });
      map.add(endMarker);

      map.setFitView([polyline, startMarker, endMarker]);
    },
    [positions, theme]
  );

  const cardClass = theme === 'cyberpunk'
    ? 'theme-card cyber-border rounded-lg overflow-hidden'
    : theme === 'glass'
    ? 'theme-card glass-card rounded-xl overflow-hidden'
    : 'theme-card rounded-lg overflow-hidden';

  return (
    <div className={cardClass}>
      <div className="px-4 py-3 border-b border-[var(--theme-card-border)]">
        <h3 className="text-sm font-medium theme-text">行程轨迹</h3>
      </div>
      <AMapContainer
        onMapReady={handleMapReady}
        className="h-64 w-full"
        theme={theme}
      />
      {(startLocation || endLocation) && (
        <div className="px-4 py-3 border-t border-[var(--theme-card-border)]">
          <div className="flex flex-col gap-1.5 text-xs">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-green-500 text-white text-[10px]">起</span>
              <span className="theme-text-secondary truncate">{startLocation || '未知'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-red-500 text-white text-[10px]">终</span>
              <span className="theme-text-secondary truncate">{endLocation || '未知'}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
