// components/CategoryBadge.tsx

import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Category, CategoryItem } from '../types/index';
import { CATEGORIES, Colors } from '../constants';
import { useColorTheme } from '../hooks/useColorTheme';
import { useTranslation, registerTranslations } from '../lib/LanguageContext';

registerTranslations({
  'Tous': 'All',
});

interface Props {
  category: Category | null;
  onSelect: (cat: Category | null) => void;
  showAll?: boolean;
}

export default function CategoryBadge({ category, onSelect, showAll = true }: Props) {
  const { theme } = useColorTheme();
  const { t } = useTranslation();

  return (
    <>
      {showAll && (
        <TouchableOpacity
          style={[
            styles.badge,
            { borderColor: theme.border, backgroundColor: !category ? Colors.primary : theme.surface },
          ]}
          onPress={() => onSelect(null)}
        >
          <Text style={[styles.label, { color: !category ? '#fff' : theme.text }]}>
            {t('Tous')}
          </Text>
        </TouchableOpacity>
      )}
      {CATEGORIES.map((item: CategoryItem) => {
        const active = category === item.label;
        return (
          <TouchableOpacity
            key={item.label}
            style={[
              styles.badge,
              {
                borderColor: active ? item.color : theme.border,
                backgroundColor: active ? item.color : theme.surface,
              },
            ]}
            onPress={() => onSelect(item.label)}
          >
            <Text style={styles.emoji}>{item.icon}</Text>
            <Text style={[styles.label, { color: active ? '#d8cdcd' : theme.text }]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1.5,
    marginRight: 8,
    gap: 4,
  },
  emoji: {
    fontSize: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: '400',
  },
});
