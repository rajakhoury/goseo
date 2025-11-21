import type { ThemeMode } from '../components/settings/types';

export const applyTheme = (theme: ThemeMode) => {
  const root = document.documentElement;
  const isDark =
    theme === 'dark' ||
    (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  if (isDark) {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
};

export const initializeTheme = (theme: ThemeMode) => {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

  const handleChange = () => {
    if (theme === 'system') {
      applyTheme('system');
    }
  };

  mediaQuery.addEventListener('change', handleChange);
  applyTheme(theme);

  return () => mediaQuery.removeEventListener('change', handleChange);
};
