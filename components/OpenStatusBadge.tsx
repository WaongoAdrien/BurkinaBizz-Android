// components/OpenStatusBadge.tsx — Live "Ouvert"/"Fermé" badge computed in Africa/Ouagadougou time

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { OpeningHours } from '../types';
import { getOpenStatus } from '../lib/openingHours';
import { useTranslation, registerTranslations } from '../lib/LanguageContext';

registerTranslations({
  'Ouvert': 'Open',
  'Fermé': 'Closed',
});

const OPEN_COLOR = '#2E7D32';
const CLOSED_COLOR = '#C62828';

interface Props {
  openingHours?: OpeningHours | null;
  size?: 'sm' | 'md';
}

export function OpenStatusBadge({ openingHours, size = 'md' }: Props) {
  const { t } = useTranslation();
  const status = getOpenStatus(openingHours);
  if (!status) return null;

  const color = status.isOpen ? OPEN_COLOR : CLOSED_COLOR;
  const small = size === 'sm';

  return (
    <View style={[styles.badge, { backgroundColor: color + '1e' }, small && styles.badgeSmall]}>
      <View style={[styles.dot, { backgroundColor: color }, small && styles.dotSmall]} />
      <Text style={[styles.text, { color }, small && styles.textSmall]}>{t(status.label)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 5, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start' },
  badgeSmall: { paddingHorizontal: 6, paddingVertical: 2, gap: 4 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  dotSmall: { width: 5, height: 5, borderRadius: 2.5 },
  text: { fontSize: 12, fontWeight: '400' },
  textSmall: { fontSize: 10 },
});
