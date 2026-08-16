// app/applications.tsx — Useful applications in Burkina Faso

import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, Image, ScrollView, TextInput, TouchableOpacity, StyleSheet, StatusBar, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Colors } from '../constants';
import { useColorTheme } from '../hooks/useColorTheme';
import { useTranslation, registerTranslations } from '../lib/LanguageContext';
import { AppHeader } from '../components/AppHeader';

registerTranslations({
  'Applications utiles': 'Useful applications',
  'Rechercher une application...': 'Search an application...',
  '🌍 Tous': '🌍 All',
  'Aucune application ne correspond à votre recherche': 'No application matches your search',
});

interface AppItem {
  id: string;
  name: string;
  image?: string;
  category: string;
  description: string;
  androidUrl?: string;
  iosUrl?: string;
  website?: string;
  order?: number;
}

function AppCard({ item }: { item: AppItem }) {
  const { theme } = useColorTheme();
  const router = useRouter();

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}
      onPress={() => router.push(`/application/${item.id}`)}
      activeOpacity={0.85}
    >
      {item.image ? (
        <Image source={{ uri: item.image }} style={styles.cardIcon} resizeMode="cover" />
      ) : (
        <View style={[styles.cardIcon, styles.cardIconPlaceholder, { backgroundColor: Colors.primary + '22' }]}>
          <Ionicons name="apps" size={24} color={Colors.primary} />
        </View>
      )}
      <View style={{ flex: 1 }}>
        <Text style={[styles.cardName, { color: theme.text }]} numberOfLines={1}>{item.name}</Text>
        <View style={[styles.categoryBadge, { backgroundColor: Colors.primary + '18' }]}>
          <Text style={[styles.categoryBadgeText, { color: Colors.primary }]}>{item.category}</Text>
        </View>
        <Text style={[styles.cardDesc, { color: theme.textSecondary }]} numberOfLines={2}>{item.description}</Text>
        {(item.androidUrl || item.iosUrl) && (
          <View style={styles.platformRow}>
            {item.androidUrl && <Ionicons name="logo-google-playstore" size={13} color={theme.textSecondary} />}
            {item.iosUrl && <Ionicons name="logo-apple-appstore" size={13} color={theme.textSecondary} />}
          </View>
        )}
      </View>
      <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
    </TouchableOpacity>
  );
}

export default function ApplicationsScreen() {
  const [applications, setApplications] = useState<AppItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('Tous');
  const { t } = useTranslation();
  const { theme } = useColorTheme();

  useEffect(() => {
    const q = query(collection(db, 'usefulApps'), orderBy('order', 'asc'));
    const unsub = onSnapshot(q, (snap) => {
      setApplications(snap.docs.map(d => ({ id: d.id, ...d.data() } as AppItem)));
      setLoading(false);
    });
    return unsub;
  }, []);

  const categories = useMemo(() => {
    const set = new Set(applications.map(a => a.category).filter(Boolean));
    return ['Tous', ...Array.from(set).sort()];
  }, [applications]);

  const normalize = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

  const displayedApplications = applications.filter(a => {
    if (activeCategory !== 'Tous' && a.category !== activeCategory) return false;
    if (search.trim() && !normalize(a.name).includes(normalize(search.trim()))) return false;
    return true;
  });

  return (
    <View style={{ flex: 1, backgroundColor: '#e8ecf0' }}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.headerGradient[0]} />
      <AppHeader title={t('Applications utiles')} />

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.body}>
          {/* SEARCH */}
          <View style={[styles.searchBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Ionicons name="search" size={17} color={theme.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: theme.text }]}
              placeholder={t('Rechercher une application...')}
              placeholderTextColor={theme.textSecondary}
              value={search}
              onChangeText={setSearch}
              autoCorrect={false}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close-circle" size={18} color={theme.textSecondary} />
              </TouchableOpacity>
            )}
          </View>

          {/* CATEGORY FILTER */}
          {categories.length > 2 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
              {categories.map(cat => {
                const active = activeCategory === cat;
                return (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.filterChip, active && { backgroundColor: Colors.headerGradient[0] }]}
                    onPress={() => setActiveCategory(cat)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.filterChipText, { color: active ? '#fff' : theme.text }]}>
                      {cat === 'Tous' ? t('Tous') : cat}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}

          {loading ? (
            <ActivityIndicator color={Colors.primary} size="large" style={{ marginTop: 20 }} />
          ) : displayedApplications.length === 0 ? (
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              {t('Aucune application ne correspond à votre recherche')}
            </Text>
          ) : (
            displayedApplications.map(item => (
              <AppCard key={item.id} item={item} />
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 40, gap: 14 },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderRadius: 8, borderWidth: 1.5, paddingHorizontal: 12, paddingVertical: 10,
  },
  searchInput: { flex: 1, fontSize: 14, padding: 0 },
  filterRow: { gap: 8, paddingRight: 4 },
  filterChip: {
    height: 32, paddingHorizontal: 14, borderRadius: 7,
    backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center',
  },
  filterChipText: { fontSize: 12.5, fontWeight: '400' },
  emptyText: { textAlign: 'center', fontSize: 14, paddingVertical: 24 },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 10, borderWidth: 1, padding: 12,
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6,
  },
  cardIcon: { width: 52, height: 52, borderRadius: 12 },
  cardIconPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  cardName: { fontSize: 15, fontWeight: '400', marginBottom: 4 },
  categoryBadge: { alignSelf: 'flex-start', borderRadius: 5, paddingHorizontal: 8, paddingVertical: 2, marginBottom: 4 },
  categoryBadgeText: { fontSize: 11, fontWeight: '400' },
  cardDesc: { fontSize: 12.5, lineHeight: 17 },
  platformRow: { flexDirection: 'row', gap: 8, marginTop: 6 },
});
