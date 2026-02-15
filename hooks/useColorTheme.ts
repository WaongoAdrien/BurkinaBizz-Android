// hooks/useColorTheme.ts

import { useColorScheme } from 'react-native';
import { Colors } from '../constants';

export function useColorTheme() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const theme = isDark ? Colors.dark : Colors.light;

  return {
    isDark,
    theme,
    Colors,
  };
}
