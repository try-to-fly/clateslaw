import { useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

export type ThemeType = 'tesla' | 'cyberpunk' | 'glass';

const VALID_THEMES: ThemeType[] = ['tesla', 'cyberpunk', 'glass'];

export function useTheme() {
  const [searchParams] = useSearchParams();

  const theme = useMemo(() => {
    const param = searchParams.get('theme');
    if (param && VALID_THEMES.includes(param as ThemeType)) {
      return param as ThemeType;
    }
    return 'tesla';
  }, [searchParams]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    return () => {
      document.documentElement.removeAttribute('data-theme');
    };
  }, [theme]);

  return { theme };
}
