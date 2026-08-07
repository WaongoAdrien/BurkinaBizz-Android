// components/TabBar.tsx — Bottom Tab Navigation

import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Colors } from '../constants';
import { useColorTheme } from '../hooks/useColorTheme';
import { useAuth } from '../lib/AuthContext';

export function TabBar() {
  const router = useRouter();
  const pathname = usePathname();
  const { theme } = useColorTheme();
  const { user } = useAuth();

 const tabs = [
    { name: 'Accueil', icon: '🏠', path: '/' },
    { name: 'Annuaire', icon: '🔍', path: '/annuaire' },
    { name: user ? 'Mon espace' : 'Mon espace', icon: user ? '📂' : '🔑', path: user ? '/vendor/dashboard' : '/auth' },
    { name: 'Paramètres', icon: '⚙️', path: '/settings' },
  ];

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/';
    return pathname.startsWith(path);
  };

  return (
    <View style={[styles.container, { backgroundColor: Colors.primary, borderTopColor: theme.border }]}>
      {tabs.map((tab) => {
        const active = isActive(tab.path);
        return (
          <TouchableOpacity
            key={tab.path}
            style={styles.tab}
            onPress={() => router.push(tab.path as any)}
            activeOpacity={0.7}
          >
            <Text style={styles.icon}>{tab.icon}</Text>
            <Text style={[styles.label, { color: active ? '#fff' : 'rgba(255,255,255,0.7)' }]}>
              {tab.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingTop: 8,
    paddingBottom: 34, // Covers iPhone notch/home indicator area
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
  },
  icon: {
    fontSize: 24,
    marginBottom: 2,
  },
  label: {
    fontSize: 11,
    fontWeight: '400',
  },
});