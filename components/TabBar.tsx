// components/TabBar.tsx — Bottom Tab Navigation

import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants';
import { useColorTheme } from '../hooks/useColorTheme';
import { useAuth } from '../lib/AuthContext';

export function TabBar() {
  const router = useRouter();
  const pathname = usePathname();
  const { theme } = useColorTheme();
  const { user } = useAuth();

  // Hide TabBar on these screens
  const hideOnRoutes = [
    '/vendor/add-business',
    '/vendor/edit-business',
    '/auth',
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
    { name: user ? 'Mon espace' : 'Connexion', icon: user ? 'person' : 'log-in', path: user ? '/vendor/dashboard' : '/auth' },
    { name: 'Paramètres', icon: 'settings', path: '/settings' },
  ];

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/';
    return pathname.startsWith(path);
  };

  return (
    <View style={[
      styles.container, 
      { 
        backgroundColor: Colors.primary, 
        borderTopColor: theme.border,
        maxWidth: 900,
        alignSelf: 'center',
        width: '100%',
      }
    ]}>
      {tabs.map((tab) => {
        const active = isActive(tab.path);
        return (
          <TouchableOpacity
            key={tab.path}
            style={[
              styles.tab,
              active && { 
                backgroundColor: 'rgba(228, 220, 207, 0.2)', // Yellow with 20% opacity
                borderRadius: 12,
              }
            ]}
            onPress={() => router.push(tab.path as any)}
            activeOpacity={0.7}
          >
            <Ionicons 
              name={tab.icon as any} 
              size={24} 
              color={active ? Colors.cta : 'rgba(255,255,255,0.7)'} 
            />
            <Text style={[styles.label, { color: active ? Colors.cta : 'rgba(255,255,255,0.7)' }]}>
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
    paddingBottom: 20, // Extra padding for iPhone notch/home indicator
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
    fontWeight: '600',
  },
});
