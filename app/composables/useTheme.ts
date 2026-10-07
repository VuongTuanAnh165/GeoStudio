import { ref, watch, computed } from 'vue';

type Theme = 'light' | 'dark';

const theme = ref<Theme>('light');

export const useTheme = () => {
  const initTheme = () => {
    if (typeof window === 'undefined') return;
    
    // Check local storage
    const savedTheme = localStorage.getItem('geostudio-theme') as Theme | null;
    
    if (savedTheme) {
      theme.value = savedTheme;
    } else {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      theme.value = prefersDark ? 'dark' : 'light';
    }
    
    applyTheme(theme.value);
  };

  const applyTheme = (newTheme: Theme) => {
    if (typeof document === 'undefined') return;
    
    const root = document.documentElement;
    if (newTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    
    localStorage.setItem('geostudio-theme', newTheme);
  };

  const toggleTheme = () => {
    theme.value = theme.value === 'light' ? 'dark' : 'light';
  };

  watch(theme, (newTheme) => {
    applyTheme(newTheme);
  });

  return {
    theme,
    toggleTheme,
    initTheme,
    isDark: computed(() => theme.value === 'dark')
  };
};
