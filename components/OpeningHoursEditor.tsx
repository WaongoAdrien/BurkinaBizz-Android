// components/OpeningHoursEditor.tsx — Per-day open/close editor for the business forms

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../constants';
import { DayKey, DayHours, OpeningHours } from '../types';
import { DAYS_MONDAY_FIRST, DAY_LABELS_FR } from '../lib/openingHours';
import { useTranslation, registerTranslations } from '../lib/LanguageContext';
import TimePickerModal from './TimePickerModal';

registerTranslations({
  'Fermé': 'Closed',
  'Ouverture': 'Open',
  'Fermeture': 'Close',
  'Copier à tous les jours': 'Copy to all days',
});

interface Props {
  value: OpeningHours;
  onChange: (v: OpeningHours) => void;
  theme: any;
}

export function OpeningHoursEditor({ value, onChange, theme }: Props) {
  const { t } = useTranslation();
  const [pickerFor, setPickerFor] = useState<{ day: DayKey; field: 'open' | 'close' } | null>(null);

  const updateDay = (day: DayKey, patch: Partial<DayHours>) => {
    onChange({ ...value, [day]: { ...value[day], ...patch } });
  };

  const copyToAll = (day: DayKey) => {
    const source = value[day];
    const next: OpeningHours = { ...value };
    DAYS_MONDAY_FIRST.forEach(d => { next[d] = { ...source }; });
    onChange(next);
  };

  return (
    <View>
      {DAYS_MONDAY_FIRST.map(day => {
        const d = value[day] || { closed: false };
        return (
          <View key={day} style={[styles.dayRow, { borderColor: theme.border }]}>
            <View style={styles.dayTopRow}>
              <Text style={[styles.dayLabel, { color: theme.text }]}>{DAY_LABELS_FR[day]}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <TouchableOpacity onPress={() => copyToAll(day)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <MaterialIcons name="content-copy" size={16} color={theme.textSecondary} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.closedToggle, { borderColor: d.closed ? '#D32F2F' : theme.border, backgroundColor: d.closed ? '#D32F2F22' : 'transparent' }]}
                  onPress={() => updateDay(day, { closed: !d.closed })}
                >
                  <Text style={[styles.closedToggleText, { color: d.closed ? '#D32F2F' : theme.textSecondary }]}>{t('Fermé')}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {!d.closed && (
              <View style={styles.timeRow}>
                <TouchableOpacity
                  style={[styles.timeField, { borderColor: theme.border }]}
                  onPress={() => setPickerFor({ day, field: 'open' })}
                >
                  <Text style={[styles.timeFieldLabel, { color: theme.textSecondary }]}>{t('Ouverture')}</Text>
                  <Text style={[styles.timeFieldValue, { color: theme.text }]}>{d.open || '--:--'}</Text>
                </TouchableOpacity>
                <Text style={{ color: theme.textSecondary }}>→</Text>
                <TouchableOpacity
                  style={[styles.timeField, { borderColor: theme.border }]}
                  onPress={() => setPickerFor({ day, field: 'close' })}
                >
                  <Text style={[styles.timeFieldLabel, { color: theme.textSecondary }]}>{t('Fermeture')}</Text>
                  <Text style={[styles.timeFieldValue, { color: theme.text }]}>{d.close || '--:--'}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        );
      })}

      <TimePickerModal
        visible={!!pickerFor}
        value={pickerFor ? value[pickerFor.day]?.[pickerFor.field] : undefined}
        theme={theme}
        onClose={() => setPickerFor(null)}
        onConfirm={v => {
          if (pickerFor) updateDay(pickerFor.day, { [pickerFor.field]: v });
          setPickerFor(null);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  dayRow: { borderBottomWidth: 1, paddingVertical: 12 },
  dayTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dayLabel: { fontSize: 14, fontWeight: '400' },
  closedToggle: { borderWidth: 1.5, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 5 },
  closedToggleText: { fontSize: 12, fontWeight: '400' },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 },
  timeField: { flex: 1, borderWidth: 1.5, borderRadius: 6, paddingHorizontal: 12, paddingVertical: 8 },
  timeFieldLabel: { fontSize: 10 },
  timeFieldValue: { fontSize: 15, fontWeight: '400', marginTop: 2 },
});
