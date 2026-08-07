// app/annuaire-newyork.tsx — New York Directory Screen

import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, TextInput,
  StyleSheet, ActivityIndicator, RefreshControl, Image,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useLikes } from '../hooks/useLikes';
import { useAuth } from '../lib/AuthContext';
import { Business, Category } from '../types';
import { Colors, CATEGORIES, CITY_CATEGORIES } from '../constants';
import { useColorTheme } from '../hooks/useColorTheme';
import { CategoryIcon } from '../components/CategoryIcon';
import { useTranslation, registerTranslations } from '../lib/LanguageContext';

registerTranslations({
  'Annuaire New York': 'New York Directory',
});

const NEWYORK_CATEGORIES = CITY_CATEGORIES['New York'] || ['Automobile', 'Diverse', 'Other', 'Services'];

export default function AnnuaireNewYorkScreen() {
  const router = useRouter();
  const { theme, isDark } = useColorTheme();
  const { user } = useAuth();
  const { isLiked, toggleLike } = useLikes(user?.uid);
  const { t } = useTranslation();
  const gradientColors: readonly [string, string, ...string[]] =
    theme.backgroundGradient.length >= 2
      ? (theme.backgroundGradient as [string, string, ...string[]])
      : [theme.background, theme.background];

  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [filtered, setFiltered] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<Category | 'Tous'>('Tous');

  // Fetch ONLY New York businesses
  useEffect(() => {
    const q = query(
      collection(db, 'businesses'),
      where('status', '==', 'approved'),
      where('city', '==', 'New York'),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(q, (snap) => {
      setBusinesses(snap.docs.map(d => ({ id: d.id, ...d.data() } as Business)));
      setLoading(false);
      setRefreshing(false);
    });
    return unsub;
  }, []);

  // Filter logic
  useEffect(() => {
    let result = [...businesses];
    
    if (activeCategory !== 'Tous') {
      result = result.filter(b => 
        b.category === activeCategory || 
        (b.categories && b.categories.includes(activeCategory))
      );
    }
    
    if (search.trim()) {
      const s = search.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      result = result.filter(b => {
        const name = b.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const desc = b.description.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        return name.includes(s) || desc.includes(s);
      });
    }
    
    // Sort: pinned → priority → date
    result.sort((a, b) => {
      if (a.pinned !== b.pinned) return b.pinned ? 1 : -1;
      const aPriority = a.priority || 0;
      const bPriority = b.priority || 0;
      if (aPriority !== bPriority) return bPriority - aPriority;
      const aTime = a.createdAt instanceof Date ? a.createdAt.getTime() : new Date(a.createdAt as string).getTime();
      const bTime = b.createdAt instanceof Date ? b.createdAt.getTime() : new Date(b.createdAt as string).getTime();
      return bTime - aTime;
    });
    
    setFiltered(result);
  }, [businesses, activeCategory, search]);

  const renderBusiness = ({ item }: { item: Business }) => {
    const liked = isLiked(item.id);
    const cat = CATEGORIES.find(c => c.label === item.category);
    return (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}
        onPress={() => router.push(`/business/${item.id}`)}
        activeOpacity={0.88}
      >
        <View style={styles.cardRow}>
          <View style={styles.cardImgBox}>
            {item.coverPhoto ? (
              <Image source={{ uri: item.coverPhoto }} style={styles.cardImg} resizeMode="cover" />
            ) : (
              <View style={[styles.cardImgPlaceholder, { backgroundColor: (cat?.color || Colors.primary) + '22' }]}>
                {cat ? (
                  <CategoryIcon iconName={cat.icon} iconFamily={cat.iconFamily} size={32} color={cat.color} />
                ) : (
                  <Text style={{ fontSize: 28 }}>🏢</Text>
                )}
              </View>
            )}
            <TouchableOpacity
              style={styles.likeBtn}
              onPress={async () => {
                if (!user) { router.push('/auth'); return; }
                await toggleLike(item as any);
              }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={{ fontSize: 16 }}>{liked ? '❤️' : '🤍'}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.cardBody}>
            <View style={styles.cardTitleRow}>
              <Text style={[styles.cardName, { color: theme.text }]} numberOfLines={1}>{item.name}</Text>
              {item.verified && <Text style={{ fontSize: 14, color: '#4CAF50' }}>✓</Text>}
              {item.pinned && <Text style={{ fontSize: 14 }}>📌</Text>}
            </View>
            <View style={[styles.catBadge, { backgroundColor: (cat?.color || Colors.primary) + '22', alignSelf: 'flex-start' }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                {cat && <CategoryIcon iconName={cat.icon} iconFamily={cat.iconFamily} size={14} color={cat.color} />}
                <Text style={[styles.catBadgeText, { color: cat?.color || Colors.primary }]}>
                  {item.category}
                </Text>
              </View>
            </View>
            <Text style={[styles.cardDesc, { color: theme.textSecondary }]} numberOfLines={2}>
              {item.description}
            </Text>
            <View style={styles.cardFooter}>
              <Text style={[styles.cardCity, { color: theme.textSecondary }]}>📍 {item.city}</Text>
              <View style={styles.socialRow}>
                {item.phone && <Text style={styles.socialIcon}>📞</Text>}
                {item.whatsapp && <Text style={styles.socialIcon}>💬</Text>}
                {item.facebook && <Text style={styles.socialIcon}>🔵</Text>}
                {item.instagram && <Text style={styles.socialIcon}>🔗</Text>}
                {item.website && <Text style={styles.socialIcon}>🌐</Text>}
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <LinearGradient
      colors={gradientColors}
      style={{ flex: 1, maxWidth: 900, alignSelf: 'center', width: '100%' }}
    >
      <Stack.Screen options={{
        title: t('Annuaire New York'),
        headerShown: true,
      }} />
      
      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={Colors.primary} size="large" />
        </View>
      ) : (
        <>
          {/* HEADER WITH TOGGLE */}
          <View style={{ width: '100%', alignItems: 'center' }}>
            <View style={{ width: '100%', maxWidth: 900, paddingHorizontal: 16 }}>
              
              {/* REGION TOGGLE */}
              <TouchableOpacity 
                style={[styles.regionToggle, { backgroundColor: theme.card, borderColor: theme.border }]}
                onPress={() => router.push('/select-region')}
                activeOpacity={0.8}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.regionToggleTitle, { color: theme.text }]}>🗽 New York Directory</Text>
                  <Text style={[styles.regionToggleSub, { color: theme.textSecondary }]}>View Other Regions →</Text>
                </View>
              </TouchableOpacity>

              {/* SEARCH */}
              <View style={[styles.searchBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Text style={styles.searchIcon}>🔍</Text>
                <TextInput
                  style={[styles.searchInput, { color: theme.text }]}
                  placeholder="Search businesses..."
                  placeholderTextColor={theme.textSecondary}
                  value={search}
                  onChangeText={setSearch}
                  autoCorrect={false}
                />
                {search.length > 0 && (
                  <TouchableOpacity onPress={() => setSearch('')}>
                    <Text style={{ color: theme.textSecondary, fontSize: 16, paddingHorizontal: 4 }}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* CATEGORY FILTER - Only New York categories */}
              <FlatList
                horizontal
                data={['Tous', ...NEWYORK_CATEGORIES] as (Category | 'Tous')[]}
                keyExtractor={item => item}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filterRow}
                renderItem={({ item }) => {
                  const active = activeCategory === item;
                  const cat = CATEGORIES.find(c => c.label === item);
                  return (
                    <TouchableOpacity
                      style={[styles.filterChip, active && { backgroundColor: Colors.primary }]}
                      onPress={() => setActiveCategory(item)}
                      activeOpacity={1}
                    >
                      <Text style={[styles.filterChipText, { color: active ? '#fff' : theme.text }]}>
                        {cat ? ` ${item}` : '🌍 All'}
                      </Text>
                    </TouchableOpacity>
                  );
                }}
              />

              {/* RESULTS COUNT */}
              <Text style={[styles.resultCount, { color: theme.textSecondary }]}>
                {filtered.length} business{filtered.length !== 1 ? 'es' : ''} found
              </Text>
            </View>
          </View>
          
          {/* BUSINESS LIST */}
          <View style={{ flex: 1, width: '100%', alignItems: 'center' }}>
            <FlatList
              style={{ width: '100%', maxWidth: 900 }}
              data={filtered}
              keyExtractor={item => item.id}
              renderItem={renderBusiness}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={() => setRefreshing(true)} tintColor={Colors.primary} />
              }
              ListEmptyComponent={
                <View style={styles.empty}>
                  <Text style={{ fontSize: 48 }}>📋</Text>
                  <Text style={[styles.emptyTitle, { color: theme.text }]}>No businesses found</Text>
                  <Text style={[styles.emptySub, { color: theme.textSecondary }]}>
                    Try different filters or check back later.
                  </Text>
                </View>
              }
            />
          </View>
        </>
      )}
      
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  regionToggle: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 16, 
    borderRadius: 7, 
    borderWidth: 2,
    marginTop: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  regionToggleTitle: { fontSize: 16, fontWeight: '400', marginBottom: 2 },
  regionToggleSub: { fontSize: 13, fontWeight: '400' },
  
  searchBox: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 2, marginBottom: 4, borderRadius: 7, borderWidth: 1.5, paddingHorizontal: 12, paddingVertical: 8 },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, fontSize: 15, paddingVertical: 4 },

  filterRow: { paddingHorizontal: 2, paddingVertical: 2, gap: 6 },
  filterChip: { height: 42, paddingHorizontal: 22, borderRadius: 10, backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center' },
  filterChipText: { fontSize: 12, fontWeight: '400', lineHeight: 16 },

  resultCount: { fontSize: 12, paddingHorizontal: 6, paddingVertical: 4 },
  listContent: { paddingHorizontal: 12, paddingBottom: 24, gap: 12 },
  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  card: { borderRadius: 7, borderWidth: 2, overflow: 'hidden', elevation: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, shadowRadius: 6, marginBottom: 4, backgroundColor: '#FAFAFA' },
  cardRow: { flexDirection: 'row', alignItems: 'stretch' },
  cardImgBox: { width: 100, height: 100, position: 'relative' },
  cardImg: { width: '100%', height: '100%' },
  cardImgPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  likeBtn: { position: 'absolute', top: 4, right: 4, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 7, padding: 4 },
  cardBody: { flex: 1, padding: 10, gap: 4 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6 },
  cardName: { fontSize: 14, fontWeight: '400', flex: 1, lineHeight: 18 },
  catBadge: { borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, marginTop: 2 },
  catBadgeText: { fontSize: 10, fontWeight: '400' },
  cardDesc: { fontSize: 12, lineHeight: 16 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  cardCity: { fontSize: 11 },
  socialRow: { flexDirection: 'row', gap: 3 },
  socialIcon: { fontSize: 12 },

  empty: { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyTitle: { fontSize: 17, fontWeight: '400' },
  emptySub: { fontSize: 13, textAlign: 'center', paddingHorizontal: 32 },
});
