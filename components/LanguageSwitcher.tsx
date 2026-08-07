// components/LanguageSwitcher.tsx — Small FR/EN dropdown for the header

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants';
import { useLanguage, Language } from '../lib/LanguageContext';

const OPTIONS: { code: Language; flag: string; label: string }[] = [
  { code: 'fr', flag: '🇫🇷', label: 'Français' },
  { code: 'en', flag: '🇬🇧', label: 'English' },
];

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);

  return (
    <>
      <TouchableOpacity style={styles.pill} onPress={() => setOpen(true)} activeOpacity={0.75}>
        <Ionicons name="globe-outline" size={13} color="#fff" />
        <Text style={styles.pillText}>{language.toUpperCase()}</Text>
        <Ionicons name="chevron-down" size={11} color="rgba(255,255,255,0.85)" />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => setOpen(false)}>
          <View style={[styles.menu, { top: insets.top + 54 }]}>
            {OPTIONS.map(opt => {
              const active = opt.code === language;
              return (
                <TouchableOpacity
                  key={opt.code}
                  style={[styles.menuItem, active && styles.menuItemActive]}
                  onPress={() => { setLanguage(opt.code); setOpen(false); }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.menuFlag}>{opt.flag}</Text>
                  <Text style={[styles.menuText, active && { color: Colors.primary, fontWeight: '600' }]}>
                    {opt.label}
                  </Text>
                  {active && <Ionicons name="checkmark" size={16} color={Colors.primary} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },
  pillText: { color: '#fff', fontSize: 12, fontWeight: '600', letterSpacing: 0.3 },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.15)' },
  menu: {
    position: 'absolute',
    right: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 6,
    minWidth: 160,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  menuItemActive: { backgroundColor: Colors.primary + '10' },
  menuFlag: { fontSize: 18 },
  menuText: { flex: 1, fontSize: 14, color: '#1A1A1A' },
});
