// components/DatePickerModal.tsx — Bottom-sheet day/month/year picker (no native deps)

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal, StyleSheet } from 'react-native';
import { Colors } from '../constants';
import { useTranslation, registerTranslations } from '../lib/LanguageContext';
import { MONTHS_FR, daysInMonth } from '../lib/eventDate';

registerTranslations({
  'Choisir une date': 'Choose a date',
  'Jour': 'Day',
  'Mois': 'Month',
  'Année': 'Year',
  'Valider': 'Confirm',
  'Annuler': 'Cancel',
  'janvier': 'January',
  'février': 'February',
  'mars': 'March',
  'avril': 'April',
  'mai': 'May',
  'juin': 'June',
  'juillet': 'July',
  'août': 'August',
  'septembre': 'September',
  'octobre': 'October',
  'novembre': 'November',
  'décembre': 'December',
});

const YEARS_PAST = 1;
const YEARS_FUTURE = 6;

interface Props {
  visible: boolean;
  value?: string; // "YYYY-MM-DD"
  onConfirm: (value: string) => void;
  onClose: () => void;
  theme: any;
  title?: string;
}

function partsFrom(value?: string): { y: number; mo: number; d: number } {
  if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, mo, d] = value.split('-').map(Number);
    return { y, mo, d };
  }
  const today = new Date();
  return { y: today.getFullYear(), mo: today.getMonth() + 1, d: today.getDate() };
}

export default function DatePickerModal({ visible, value, onConfirm, onClose, theme, title }: Props) {
  const { t } = useTranslation();
  const [year, setYear] = useState(() => partsFrom(value).y);
  const [month, setMonth] = useState(() => partsFrom(value).mo);
  const [day, setDay] = useState(() => partsFrom(value).d);

  useEffect(() => {
    if (!visible) return;
    const p = partsFrom(value);
    setYear(p.y);
    setMonth(p.mo);
    setDay(p.d);
  }, [visible, value]);

  const maxDay = daysInMonth(year, month);
  const dayToShow = Math.min(day, maxDay);

  if (!visible) return null;

  const thisYear = new Date().getFullYear();
  const years = Array.from({ length: YEARS_PAST + YEARS_FUTURE + 1 }, (_, i) => thisYear - YEARS_PAST + i);
  const days = Array.from({ length: maxDay }, (_, i) => i + 1);

  const confirm = () => {
    onConfirm(`${year}-${String(month).padStart(2, '0')}-${String(dayToShow).padStart(2, '0')}`);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: theme.card }]}>
          <Text style={[styles.title, { color: theme.text }]}>{title || t('Choisir une date')}</Text>

          <View style={styles.columns}>
            <View style={styles.column}>
              <Text style={[styles.colLabel, { color: theme.textSecondary }]}>{t('Jour')}</Text>
              <ScrollView style={styles.colScroll} showsVerticalScrollIndicator={false}>
                {days.map(dd => (
                  <TouchableOpacity
                    key={dd}
                    style={[styles.cell, dd === dayToShow && { backgroundColor: Colors.primary + '22' }]}
                    onPress={() => setDay(dd)}
                  >
                    <Text style={[styles.cellText, { color: dd === dayToShow ? Colors.primary : theme.text }, dd === dayToShow && { fontWeight: '400' }]}>{dd}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            <View style={[styles.column, { flex: 1.5 }]}>
              <Text style={[styles.colLabel, { color: theme.textSecondary }]}>{t('Mois')}</Text>
              <ScrollView style={styles.colScroll} showsVerticalScrollIndicator={false}>
                {MONTHS_FR.map((mName, i) => {
                  const mm = i + 1;
                  return (
                    <TouchableOpacity
                      key={mName}
                      style={[styles.cell, mm === month && { backgroundColor: Colors.primary + '22' }]}
                      onPress={() => setMonth(mm)}
                    >
                      <Text style={[styles.cellText, { color: mm === month ? Colors.primary : theme.text }, mm === month && { fontWeight: '400' }]}>{t(mName)}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
            <View style={styles.column}>
              <Text style={[styles.colLabel, { color: theme.textSecondary }]}>{t('Année')}</Text>
              <ScrollView style={styles.colScroll} showsVerticalScrollIndicator={false}>
                {years.map(yy => (
                  <TouchableOpacity
                    key={yy}
                    style={[styles.cell, yy === year && { backgroundColor: Colors.primary + '22' }]}
                    onPress={() => setYear(yy)}
                  >
                    <Text style={[styles.cellText, { color: yy === year ? Colors.primary : theme.text }, yy === year && { fontWeight: '400' }]}>{yy}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>

          <View style={styles.btnRow}>
            <TouchableOpacity style={[styles.btn, { borderColor: theme.border }]} onPress={onClose}>
              <Text style={[styles.btnText, { color: theme.textSecondary }]}>{t('Annuler')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, { backgroundColor: Colors.primary, borderColor: Colors.primary }]}
              onPress={confirm}
            >
              <Text style={[styles.btnText, { color: '#fff' }]}>{t('Valider')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 32 },
  sheet: { width: '100%', maxWidth: 380, borderRadius: 12, padding: 20 },
  title: { fontSize: 16, fontWeight: '400', marginBottom: 14, textAlign: 'center' },
  columns: { flexDirection: 'row', gap: 8, height: 220 },
  column: { flex: 1 },
  colLabel: { fontSize: 11, fontWeight: '400', textAlign: 'center', marginBottom: 6 },
  colScroll: { flex: 1 },
  cell: { paddingVertical: 10, borderRadius: 6, alignItems: 'center', marginBottom: 2 },
  cellText: { fontSize: 14 },
  btnRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
  btn: { flex: 1, borderWidth: 1.5, borderRadius: 7, paddingVertical: 12, alignItems: 'center' },
  btnText: { fontSize: 15, fontWeight: '400' },
});
