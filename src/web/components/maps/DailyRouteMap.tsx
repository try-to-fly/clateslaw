import { useCallback } from 'react';
import { AMapContainer } from './AMapContainer';
import { getSpeedColorByRoute } from '../../lib/utils';
import type { DrivePosition } from '../../../types/drive';
import type { ThemeType } from '../../hooks/useTheme';

interface DailyRouteMapProps {
  allPositions: DrivePosition[][];
  theme?: ThemeType;
}

export function DailyRouteMap({ allPositions, theme = 'tesla' }: DailyRouteMapProps) {
  const handleMapReady = useCallback(
    (map: any, AMap: any) => {
      // 过滤掉空轨迹
      const validPositions = allPositions.filter((positions) => positions.length > 0);
      if (validPositions.length === 0) return;

      const allOverlays: any[] = [];

      // 为每条轨迹绘制路线
      validPositions.forEach((positions, routeIndex) => {
        if (positions.length < 2) return;

        // 为每段轨迹创建不同颜色的 Polyline（根据速度和轨迹索引变色）
        for (let i = 0; i < positions.length - 1; i++) {
          const p1 = positions[i];
          const p2 = positions[i + 1];

          // 计算两点的平均速度，使用轨迹索引确定色系
          const avgSpeed = (p1.speed + p2.speed) / 2;
          const color = getSpeedColorByRoute(avgSpeed, routeIndex, theme);

          const segmentPath = [
            new AMap.LngLat(p1.longitude, p1.latitude),
            new AMap.LngLat(p2.longitude, p2.latitude),
          ];

          const polyline = new AMap.Polyline({
            path: segmentPath,
            strokeColor: color,
            strokeWeight: 4,
            strokeOpacity: 0.85,
            lineJoin: 'round',
            lineCap: 'round',
          });

          allOverlays.push(polyline);
          map.add(polyline);
        }
      });

      // 只显示第一条轨迹的起点和最后一条轨迹的终点
      const firstRoute = validPositions[0];
      const lastRoute = validPositions[validPositions.length - 1];

      const startPos = new AMap.LngLat(
        firstRoute[0].longitude,
        firstRoute[0].latitude
      );
      const endPos = new AMap.LngLat(
        lastRoute[lastRoute.length - 1].longitude,
        lastRoute[lastRoute.length - 1].latitude
      );

      const startMarker = new AMap.Marker({
        position: startPos,
        content: `<div style="background:#22c55e;color:white;padding:2px 6px;border-radius:4px;font-size:11px;font-weight:500;">起</div>`,
        offset: new AMap.Pixel(-12, -12),
      });
      map.add(startMarker);
      allOverlays.push(startMarker);

      const endMarker = new AMap.Marker({
        position: endPos,
        content: `<div style="background:#ef4444;color:white;padding:2px 6px;border-radius:4px;font-size:11px;font-weight:500;">终</div>`,
        offset: new AMap.Pixel(-12, -12),
      });
      map.add(endMarker);
      allOverlays.push(endMarker);

      map.setFitView(allOverlays);
    },
    [allPositions, theme]
  );

  const cardClass =
    theme === 'cyberpunk'
      ? 'theme-card cyber-border rounded-lg overflow-hidden'
      : theme === 'glass'
      ? 'theme-card glass-card rounded-xl overflow-hidden'
      : 'theme-card rounded-lg overflow-hidden';

  // 过滤掉空轨迹
  const validPositions = allPositions.filter((positions) => positions.length > 0);
  if (validPositions.length === 0) {
    return null;
  }

  return (
    <div className={cardClass}>
      <AMapContainer
        onMapReady={handleMapReady}
        className="h-80 w-full"
        theme={theme}
      />
    </div>
  );
}
