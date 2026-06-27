// components/CategoryIcon.tsx - Helper to render category icons

import React from 'react';
import { Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';

interface CategoryIconProps {
  iconName: string;
  iconFamily: string;
  size?: number;
  color?: string;
}

export function CategoryIcon({ iconName, iconFamily, size = 24, color = '#000' }: CategoryIconProps) {
  if (iconFamily === 'MaterialIcons') {
    return <MaterialIcons name={iconName as any} size={size} color={color} />;
  }
  if (iconFamily === 'MaterialCommunityIcons') {
    return <MaterialCommunityIcons name={iconName as any} size={size} color={color} />;
  }
  return <Ionicons name={iconName as any} size={size} color={color} />;
}
