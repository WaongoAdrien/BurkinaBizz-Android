// components/TimePickerModal.tsx — Bottom-sheet hour/minute picker (no native deps)

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal, StyleSheet } from 'react-native';
import { Colors } from '../constants';
import { useTranslation, registerTranslations } from '../lib/LanguageContext';

registerTranslations({
  'Choisir une heure': 'Choose a time',
  'Heures': 'Hours',
  'Minutes': 'Minutes',
  'Valider': 'Confirm',
  'Annuler': 'Cancel',
});

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = ['00', '15', '30', '45'];

interface Props {
  visible: boolean;
  value?: string; // "HH:MM"
  onConfirm: (value: string) => void;
  onClose: () => void;
  theme: any;
}

export default function TimePickerModal({ visible, value, onConfirm, onClose, theme }: Props) {
  const { t } = useTranslation();
  const [h, m] = (value && /^\d{2}:\d{2}$/.test(value)) ? value.split(':') : ['08', '00'];
  const [hour, setHour] = useState(h);
  const [minute, setMinute] = useState(MINUTES.includes(m) ? m : '00');

  useEffect(() => {
    if (!visible) return;
    const [nh, nm] = (value && /^\d{2}:\d{2}$/.test(value)) ? value.split(':') : ['08', '00'];
    setHour(nh);
    setMinute(MINUTES.includes(nm) ? nm : '00');
  }, [visible, value]);

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: theme.card }]}>
          <Text style={[styles.title, { color: theme.text }]}>{t('Choisir une heure')}</Text>

          <View style={styles.columns}>
            <View style={styles.column}>
              <Text style={[styles.colLabel, { color: theme.textSecondary }]}>{t('Heures')}</Text>
              <ScrollView style={styles.colScroll} showsVerticalScrollIndicator={false}>
                {HOURS.map(hh => (
                  <TouchableOpacity
                    key={hh}
                    style={[styles.cell, hh === hour && { backgroundColor: Colors.primary + '22' }]}
                    onPress={() => setHour(hh)}
                  >
                    <Text style={[styles.cellText, { color: hh === hour ? Colors.primary : theme.text }, hh === hour && { fontWeight: '400' }]}>{hh}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            <View style={styles.column}>
              <Text style={[styles.colLabel, { color: theme.textSecondary }]}>{t('Minutes')}</Text>
              <ScrollView style={styles.colScroll} showsVerticalScrollIndicator={false}>
                {MINUTES.map(mm => (
                  <TouchableOpacity
                    key={mm}
                    style={[styles.cell, mm === minute && { backgroundColor: Colors.primary + '22' }]}
                    onPress={() => setMinute(mm)}
                  >
                    <Text style={[styles.cellText, { color: mm === minute ? Colors.primary : theme.text }, mm === minute && { fontWeight: '400' }]}>{mm}</Text>
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
              onPress={() => onConfirm(`${hour}:${minute}`)}
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
  sheet: { width: '100%', maxWidth: 340, borderRadius: 12, padding: 20 },
  title: { fontSize: 16, fontWeight: '400', marginBottom: 14, textAlign: 'center' },
  columns: { flexDirection: 'row', gap: 12, height: 220 },
  column: { flex: 1 },
  colLabel: { fontSize: 11, fontWeight: '400', textAlign: 'center', marginBottom: 6 },
  colScroll: { flex: 1 },
  cell: { paddingVertical: 10, borderRadius: 6, alignItems: 'center', marginBottom: 2 },
  cellText: { fontSize: 15 },
  btnRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
  btn: { flex: 1, borderWidth: 1.5, borderRadius: 7, paddingVertical: 12, alignItems: 'center' },
  btnText: { fontSize: 15, fontWeight: '400' },
});
