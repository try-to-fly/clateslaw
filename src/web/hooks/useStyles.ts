import { useTheme, type ThemeType } from './useTheme';

/**
 * 根据主题返回卡片样式类
 */
export function useCardClass(): string {
  const { theme } = useTheme();
  return getCardClass(theme);
}

/**
 * 根据主题获取卡片样式类（纯函数版本）
 */
export function getCardClass(theme: ThemeType): string {
  switch (theme) {
    case 'cyberpunk':
      return 'theme-card cyber-border rounded-lg overflow-hidden';
    case 'glass':
      return 'theme-card glass-card rounded-xl overflow-hidden';
    default:
      return 'theme-card rounded-lg overflow-hidden';
  }
}

/**
 * 根据主题返回强调色
 */
export function useAccentColor(): string {
  const { theme } = useTheme();
  return getAccentColor(theme);
}

/**
 * 根据主题获取强调色（纯函数版本）
 */
export function getAccentColor(theme: ThemeType): string {
  switch (theme) {
    case 'cyberpunk':
      return '#00f5ff';
    case 'glass':
      return '#3b82f6';
    default:
      return '#e82127';
  }
}

/**
 * 根据主题返回成功色
 */
export function getSuccessColor(theme: ThemeType): string {
  switch (theme) {
    case 'cyberpunk':
      return '#00ff88';
    case 'glass':
      return '#22c55e';
    default:
      return '#22c55e';
  }
}

/**
 * 根据主题返回错误色
 */
export function getErrorColor(theme: ThemeType): string {
  switch (theme) {
    case 'cyberpunk':
      return '#ff0055';
    case 'glass':
      return '#ef4444';
    default:
      return '#ef4444';
  }
}
