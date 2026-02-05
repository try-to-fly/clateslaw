import { useEffect, useRef, useState } from 'react';
import AMapLoader from '@amap/amap-jsapi-loader';
import type { ThemeType } from '../../hooks/useTheme';

interface AMapContainerProps {
  onMapReady?: (map: any, AMap: any) => void;
  className?: string;
  theme?: ThemeType;
}

export function AMapContainer({ onMapReady, className, theme = 'tesla' }: AMapContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let map: any = null;
    const apiKey = import.meta.env.VITE_AMAP_KEY;

    if (!apiKey) {
      setError('请配置 VITE_AMAP_KEY');
      return;
    }

    AMapLoader.load({
      key: apiKey,
      version: '2.0',
      plugins: ['AMap.Scale', 'AMap.Polyline'],
    })
      .then((AMap) => {
        if (!containerRef.current) return;

        map = new AMap.Map(containerRef.current, {
          zoom: 12,
          viewMode: '2D',
        });
        mapRef.current = map;

        // 先执行 onMapReady（会调用 setFitView）
        onMapReady?.(map, AMap);

        // setFitView 后监听 complete 事件，等待新视野的瓦片加载完成。
        // 注意: complete 可能在初次渲染或连续 setFitView 时多次触发。
        const markReady = () => {
          containerRef.current?.setAttribute('data-map-ready', 'true');
          containerRef.current?.setAttribute('data-map-centered', 'true');
        };

        map.on('complete', markReady);

        // 备用：如果 complete 事件未触发，用延迟兜底
        setTimeout(markReady, 2000);
      })
      .catch((e) => {
        console.error('AMap load error:', e);
        setError('地图加载失败，请检查 API Key');
      });

    return () => {
      map?.destroy();
      mapRef.current = null;
    };
  }, [onMapReady]);

  if (error) {
    const bgClass = theme === 'cyberpunk'
      ? 'bg-[#1a1a3e]'
      : theme === 'glass'
      ? 'bg-[#1e293b]'
      : 'bg-[#1a1a1a]';

    return (
      <div className={`flex items-center justify-center ${bgClass} ${className}`}>
        <span className="theme-text-muted text-sm">{error}</span>
      </div>
    );
  }

  return <div ref={containerRef} className={className} />;
}
