// components/ContentContainer.tsx - Container for iPad-friendly layouts

import React from 'react';
import { View, ViewStyle } from 'react-native';

interface ContentContainerProps {
  children: React.ReactNode;
  maxWidth?: number;
  style?: ViewStyle;
}

export function ContentContainer({ 
  children, 
  maxWidth = 600,
  style 
}: ContentContainerProps) {
  return (
    <View 
      style={[
        { 
          width: '100%', 
          maxWidth,
          alignSelf: 'center',
        },
        style
      ]}
    >
      {children}
    </View>
  );
}
