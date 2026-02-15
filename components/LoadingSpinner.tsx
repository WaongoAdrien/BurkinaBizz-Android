// components/LoadingSpinner.tsx

import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { Colors } from '../constants';
import { useColorTheme } from '../hooks/useColorTheme';

interface Props {
  message?: string;
}

export default function LoadingSpinner({ message }: Props) {
  const { theme } = useColorTheme();
  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ActivityIndicator size="large" color={Colors.primary} />
      {message && (
        <Text style={[styles.text, { color: theme.textSecondary }]}>{message}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  text: {
    fontSize: 15,
  },
});
