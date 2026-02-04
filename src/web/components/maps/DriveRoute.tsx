import { useCallback } from 'react';
import { AMapContainer } from './AMapContainer';
import { getSpeedColor } from '../../lib/utils';
import type { DrivePosition } from '../../../types/drive';
import type { ThemeType } from '../../hooks/useTheme';

interface DriveRouteProps {
  positions: DrivePosition[];
  startLocation?: string;
  endLocation?: string;
  theme?: ThemeType;
  bare?: boolean;
  height?: string;
}

export function DriveRoute({ positions, startLocation, endLocation, theme = 'tesla', bare = false, height = 'h-80' }: DriveRouteProps) {
  const handleMapReady = useCallback(
    (map: any, AMap: any) => {
      if (positions.length === 0) return;

      const polylines: any[] = [];

      // 为每段轨迹创建不同颜色的 Polyline
      for (let i = 0; i < positions.length - 1; i++) {
        const p1 = positions[i];
        const p2 = positions[i + 1];

        // 计算两点的平均速度
        const avgSpeed = (p1.speed + p2.speed) / 2;
        const color = getSpeedColor(avgSpeed, theme);

        const segmentPath = [
          new AMap.LngLat(p1.longitude, p1.latitude),
          new AMap.LngLat(p2.longitude, p2.latitude),
        ];

        const polyline = new AMap.Polyline({
          path: segmentPath,
          strokeColor: color,
          strokeWeight: 4,
          strokeOpacity: 0.9,
          lineJoin: 'round',
          lineCap: 'round',
        });

        polylines.push(polyline);
        map.add(polyline);
      }

      const startPos = new AMap.LngLat(positions[0].longitude, positions[0].latitude);
      const endPos = new AMap.LngLat(positions[positions.length - 1].longitude, positions[positions.length - 1].latitude);

      const startMarker = new AMap.Marker({
        position: startPos,
        content: `<div style="background:#22c55e;color:white;padding:2px 6px;border-radius:4px;font-size:11px;font-weight:500;">起</div>`,
        offset: new AMap.Pixel(-12, -12),
      });
      map.add(startMarker);

      const endMarker = new AMap.Marker({
        position: endPos,
        content: `<div style="background:#ef4444;color:white;padding:2px 6px;border-radius:4px;font-size:11px;font-weight:500;">终</div>`,
        offset: new AMap.Pixel(-12, -12),
      });
      map.add(endMarker);

      map.setFitView([...polylines, startMarker, endMarker]);
    },
    [positions, theme]
  );

  const cardClass = theme === 'cyberpunk'
    ? 'theme-card cyber-border rounded-lg overflow-hidden'
    : theme === 'glass'
    ? 'theme-card glass-card rounded-xl overflow-hidden'
    : 'theme-card rounded-lg overflow-hidden';

  const mapElement = (
    <AMapContainer
      onMapReady={handleMapReady}
      className={`${height} w-full`}
      theme={theme}
    />
  );

  if (bare) {
    return mapElement;
  }

  return (
    <div className={cardClass}>
      {mapElement}
    </div>
  );
}
