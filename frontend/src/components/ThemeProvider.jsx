import React, { useEffect } from 'react';
import { useUI } from '../store/hooks';

const ThemeProvider = ({ children }) => {
  const { theme } = useUI();

  useEffect(() => {
    console.log('ThemeProvider: Theme changed', theme);
    const root = document.documentElement;
    
    // Apply theme mode
    if (theme.mode === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
      console.log('Applied dark theme');
    } else if (theme.mode === 'light') {
      root.classList.add('light');
      root.classList.remove('dark');
      console.log('Applied light theme');
    } else {
      // Auto mode - follow system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        root.classList.add('dark');
        root.classList.remove('light');
        console.log('Applied auto theme (dark)');
      } else {
        root.classList.add('light');
        root.classList.remove('dark');
        console.log('Applied auto theme (light)');
      }
    }

    // Apply accent color
    const accentColor = getAccentColorValue(theme.accentColor);
    root.style.setProperty('--accent-color', accentColor);
    console.log('Applied accent color:', theme.accentColor, accentColor);
    
    // Apply font size
    const fontSizeMap = {
      small: '14px',
      medium: '16px',
      large: '18px'
    };
    root.style.setProperty('--base-font-size', fontSizeMap[theme.fontSize] || fontSizeMap.medium);

    // Apply animation preferences
    if (!theme.animations) {
      root.style.setProperty('--animation-duration', '0s');
      root.style.setProperty('--transition-duration', '0s');
    } else {
      root.style.setProperty('--animation-duration', '0.3s');
      root.style.setProperty('--transition-duration', '0.2s');
    }

    // Persist theme to localStorage
    localStorage.setItem('ctas_theme', JSON.stringify(theme));

  }, [theme]);

  const getAccentColorValue = (color) => {
    const colorMap = {
      blue: '#3b82f6',
      cyan: '#06b6d4',
      green: '#10b981',
      orange: '#f97316',
      red: '#ef4444',
      purple: '#8b5cf6'
    };
    return colorMap[color] || colorMap.blue;
  };

  return <>{children}</>;
};

export default ThemeProvider;