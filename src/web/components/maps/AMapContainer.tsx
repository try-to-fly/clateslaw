import { useEffect, useRef, useState } from 'react';
import AMapLoader from '@amap/amap-jsapi-loader';

interface AMapContainerProps {
  onMapReady?: (map: any, AMap: any) => void;
  className?: string;
}

export function AMapContainer({ onMapReady, className }: AMapContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let map: any = null;

    AMapLoader.load({
      key: import.meta.env.VITE_AMAP_KEY || '',
      version: '2.0',
      plugins: ['AMap.Scale', 'AMap.Polyline'],
    })
      .then((AMap) => {
        if (!containerRef.current) return;

        map = new AMap.Map(containerRef.current, {
          zoom: 12,
          viewMode: '2D',
        });

        onMapReady?.(map, AMap);
      })
      .catch((e) => {
        console.error('AMap load error:', e);
        setError('地图加载失败');
      });

    return () => {
      map?.destroy();
    };
  }, [onMapReady]);

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 ${className}`}>
        <span className="text-muted-foreground">{error}</span>
      </div>
    );
  }

  return <div ref={containerRef} className={className} />;
}
