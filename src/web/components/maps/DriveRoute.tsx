import { useCallback } from 'react';
import { AMapContainer } from './AMapContainer';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import type { DrivePosition } from '../../../types/drive';

interface DriveRouteProps {
  positions: DrivePosition[];
  startLocation?: string;
  endLocation?: string;
}

export function DriveRoute({ positions, startLocation, endLocation }: DriveRouteProps) {
  const handleMapReady = useCallback(
    (map: any, AMap: any) => {
      if (positions.length === 0) return;

      const path = positions.map(
        (p) => new AMap.LngLat(p.longitude, p.latitude)
      );

      const polyline = new AMap.Polyline({
        path,
        strokeColor: '#3b82f6',
        strokeWeight: 4,
        strokeOpacity: 0.9,
        lineJoin: 'round',
        lineCap: 'round',
      });

      map.add(polyline);

      // 添加起点标记
      const startMarker = new AMap.Marker({
        position: path[0],
        content: `<div style="background:#22c55e;color:white;padding:4px 8px;border-radius:4px;font-size:12px;">起</div>`,
        offset: new AMap.Pixel(-15, -15),
      });
      map.add(startMarker);

      // 添加终点标记
      const endMarker = new AMap.Marker({
        position: path[path.length - 1],
        content: `<div style="background:#ef4444;color:white;padding:4px 8px;border-radius:4px;font-size:12px;">终</div>`,
        offset: new AMap.Pixel(-15, -15),
      });
      map.add(endMarker);

      // 自适应视野
      map.setFitView([polyline, startMarker, endMarker]);
    },
    [positions]
  );

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">行程轨迹</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <AMapContainer
          onMapReady={handleMapReady}
          className="h-64 w-full rounded-b-lg"
        />
        {(startLocation || endLocation) && (
          <div className="p-4 pt-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-green-500" />
              <span className="text-muted-foreground">{startLocation || '未知'}</span>
              <span className="mx-2">→</span>
              <span className="inline-block w-2 h-2 rounded-full bg-red-500" />
              <span className="text-muted-foreground">{endLocation || '未知'}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
