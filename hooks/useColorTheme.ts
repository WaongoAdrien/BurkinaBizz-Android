// hooks/useColorTheme.ts

import { Colors } from '../constants';

export function useColorTheme() {
  return {
    isDark: false,
    theme: Colors.light,
    Colors,
  };
}
