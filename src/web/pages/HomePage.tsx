import { Link } from 'react-router-dom';
import { useData, type TeslaData } from '../hooks/useData';
import { useTheme } from '../hooks/useTheme';
import type { HomeData } from '../demo/home';

function isHomeData(data: TeslaData | HomeData): data is HomeData {
  return 'car' in data && 'overview' in data;
}

export default function HomePage() {
  const data = useData<HomeData>();
  const { theme } = useTheme();

  if (!data || !isHomeData(data)) {
    return (
      <div className="theme-bg flex items-center justify-center p-4 min-h-screen">
        <p className="theme-text-muted">加载中...</p>
      </div>
    );
  }

  const { car, overview, recentDrive, recentCharge } = data;

  const cardClass =
    theme === 'cyberpunk'
      ? 'theme-card cyber-border rounded-lg overflow-hidden'
      : theme === 'glass'
        ? 'theme-card glass-card rounded-xl overflow-hidden'
        : 'theme-card rounded-lg overflow-hidden';

  const linkCardClass = `${cardClass} block transition-all duration-200 hover:border-[var(--theme-accent)]`;

  return (
    <div className="theme-bg p-4 space-y-4 min-h-screen">
      {/* 车辆概览卡片 */}
      <div className={cardClass}>
        <div className="p-4">
          <div className="flex items-start gap-4">
            {/* 车辆图标 */}
            <div className="w-20 h-20 flex items-center justify-center rounded-lg bg-[var(--theme-bg-secondary)]">
              <svg
                className="w-12 h-12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--theme-accent)"
                strokeWidth="1.5"
              >
                <path d="M5 17h14M5 17a2 2 0 01-2-2V9a2 2 0 012-2h14a2 2 0 012 2v6a2 2 0 01-2 2M5 17v2m14-2v2" />
                <circle cx="7" cy="14" r="1.5" fill="var(--theme-accent)" />
                <circle cx="17" cy="14" r="1.5" fill="var(--theme-accent)" />
                <path d="M7 7l2-3h6l2 3" />
              </svg>
            </div>

            {/* 车辆信息 */}
            <div className="flex-1">
              <h1 className="text-lg font-semibold theme-text">{car.name}</h1>
              <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="theme-text-muted">电量</span>
                  <span className="ml-2 theme-accent font-medium">{overview.battery_level}%</span>
                </div>
                <div>
                  <span className="theme-text-muted">续航</span>
                  <span className="ml-2 theme-text font-medium">{overview.range_km} km</span>
                </div>
                <div>
                  <span className="theme-text-muted">里程</span>
                  <span className="ml-2 theme-text font-medium">
                    {overview.odometer_km.toLocaleString()} km
                  </span>
                </div>
                <div>
                  <span className="theme-text-muted">版本</span>
                  <span className="ml-2 theme-text font-medium">{overview.software_version}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 功能入口 */}
      <div className="grid grid-cols-2 gap-3">
        {/* 行程入口 */}
        <Link to="/drive" className={linkCardClass}>
          <div className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">🛣️</span>
              <span className="font-medium theme-text">行程</span>
            </div>
            {recentDrive ? (
              <div className="text-xs theme-text-muted">
                <div className="truncate">
                  {recentDrive.start_location} → {recentDrive.end_location}
                </div>
                <div className="mt-1 theme-accent">{recentDrive.distance.toFixed(1)} km</div>
              </div>
            ) : (
              <div className="text-xs theme-text-muted">查看行程详情</div>
            )}
          </div>
        </Link>

        {/* 充电入口 */}
        <Link to="/charge" className={linkCardClass}>
          <div className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">🔋</span>
              <span className="font-medium theme-text">充电</span>
            </div>
            {recentCharge ? (
              <div className="text-xs theme-text-muted">
                <div className="truncate">{recentCharge.location || '充电记录'}</div>
                <div className="mt-1" style={{ color: 'var(--theme-success)' }}>
                  +{recentCharge.charge_energy_added.toFixed(1)} kWh
                </div>
              </div>
            ) : (
              <div className="text-xs theme-text-muted">查看充电详情</div>
            )}
          </div>
        </Link>
      </div>

      {/* 日报入口 */}
      <Link to="/daily" className={linkCardClass}>
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">📊</span>
              <span className="font-medium theme-text">今日日报</span>
            </div>
            <svg
              className="w-5 h-5 theme-text-muted"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
          <div className="mt-2 text-xs theme-text-muted">查看今日行驶和充电统计</div>
        </div>
      </Link>
    </div>
  );
}
