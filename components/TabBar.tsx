// components/TabBar.tsx — Bottom Tab Navigation

import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../constants';
import { useColorTheme } from '../hooks/useColorTheme';
import { useAuth } from '../lib/AuthContext';
import { useTranslation, registerTranslations } from '../lib/LanguageContext';

registerTranslations({
  'Accueil': 'Home',
  'Annuaire': 'Directory',
  'Tourisme': 'Tourism',
  'Mon espace': 'My space',
  'Connexion': 'Sign in',
  'Paramètres': 'Settings',
});

// Brighter gold for the active tab — Colors.cta reads fine on light cards,
// but it's too close in brightness to Colors.primary to stand out on the navbar.
const NAV_ACCENT = '#F2B84B';

export function TabBar() {
  const router = useRouter();
  const pathname = usePathname();
  const { theme } = useColorTheme();
  const { user } = useAuth();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  // Hide TabBar on these screens
  const hideOnRoutes = [
    '/vendor/add-business',
    '/vendor/edit-business',
    '/vendor/pending',
    '/business/',  // Hide on business detail pages
  ];
  
  // Don't render TabBar if on a hidden route
  if (hideOnRoutes.some(route => pathname.startsWith(route))) {
    return null;
  }

  const tabs = [
    { name: 'Accueil', icon: 'home', path: '/' },
    { name: 'Annuaire', icon: 'search', path: '/annuaire' },
    { name: 'Tourisme', icon: 'camera', path: '/tourism-sites' },
    { name: user ? 'Mon espace' : 'Connexion', icon: user ? 'person' : 'log-in', path: user ? '/vendor/dashboard' : '/auth' },
    { name: 'Paramètres', icon: 'settings', path: '/settings' },
  ];

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/';
    return pathname.startsWith(path);
  };

  return (
    <LinearGradient
      colors={Colors.headerGradient}
      start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      style={[
        styles.container,
        {
          borderTopColor: theme.border,
          maxWidth: 900,
          alignSelf: 'center',
          width: '100%',
          paddingBottom: Math.max(insets.bottom, 8) + 8,
        }
      ]}
    >
      {tabs.map((tab) => {
        const active = isActive(tab.path);
        return (
          <TouchableOpacity
            key={tab.path}
            style={styles.tab}
            onPress={() => router.push(tab.path as any)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={tab.icon as any}
              size={24}
              color={active ? NAV_ACCENT : 'rgba(255,255,255,0.7)'}
            />
            <Text style={styles.label}>
              {t(tab.name)}
            </Text>
          </TouchableOpacity>
        );
      })}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingTop: 8,
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
    marginHorizontal: 4, // Space for highlight background
  },
  icon: {
    fontSize: 24,
    marginBottom: 2,
  },
  label: {
    fontSize: 11,
    fontWeight: '400',
    color: 'rgba(255,255,255,0.7)',
  },
});
