// app/annuaire.tsx — Directory Screen

import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, TextInput,
  StyleSheet, ActivityIndicator, RefreshControl, Image,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useLikes } from '../hooks/useLikes';
import { useAuth } from '../lib/AuthContext';
import { Business, Category } from '../types';
import { Colors, CATEGORIES, CITIES } from '../constants';
import { useColorTheme } from '../hooks/useColorTheme';

export default function AnnuaireScreen() {
  const router = useRouter();
  const { category: paramCategory } = useLocalSearchParams<{ category?: string }>();
  const { theme, isDark } = useColorTheme();
  const { user } = useAuth();
  const { isLiked, toggleLike } = useLikes(user?.uid);

  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [filtered, setFiltered] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<Category | 'Tous'>(
    (paramCategory as Category) || 'Tous'
  );
  const [activeCity, setActiveCity] = useState<string>('Toutes');

  useEffect(() => {
    const q = query(
      collection(db, 'businesses'),
      where('status', '==', 'approved'),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(q, (snap) => {
      setBusinesses(snap.docs.map(d => ({ id: d.id, ...d.data() } as Business)));
      setLoading(false);
      setRefreshing(false);
    });
    return unsub;
  }, []);

  useEffect(() => {
    let result = [...businesses];
    if (activeCategory !== 'Tous') result = result.filter(b => b.category === activeCategory);
    if (activeCity !== 'Toutes') result = result.filter(b => b.city === activeCity);
    if (search.trim()) {
      const s = search.toLowerCase();
      result = result.filter(b =>
        b.name.toLowerCase().includes(s) ||
        b.description.toLowerCase().includes(s) ||
        b.city.toLowerCase().includes(s)
      );
    }
    setFiltered(result);
  }, [businesses, activeCategory, activeCity, search]);

  const renderBusiness = ({ item }: { item: Business }) => {
    const liked = isLiked(item.id);
    const cat = CATEGORIES.find(c => c.label === item.category);
    return (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}
        onPress={() => router.push(`/business/${item.id}`)}
        activeOpacity={0.88}
      >
        {/* COVER PHOTO */}
        <View style={styles.cardImgBox}>
          {item.coverPhoto ? (
            <Image source={{ uri: item.coverPhoto }} style={styles.cardImg} resizeMode="cover" />
          ) : (
            <View style={[styles.cardImgPlaceholder, { backgroundColor: (cat?.color || Colors.primary) + '22' }]}>
              <Text style={{ fontSize: 36 }}>{cat?.icon || '🏢'}</Text>
            </View>
          )}
          {/* LIKE BUTTON */}
          <TouchableOpacity
            style={styles.likeBtn}
            onPress={async () => {
              if (!user) { router.push('/auth'); return; }
              await toggleLike(item as any);
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={{ fontSize: 20 }}>{liked ? '❤️' : '🤍'}</Text>
          </TouchableOpacity>
        </View>

        {/* INFO */}
        <View style={styles.cardBody}>
          <View style={styles.cardTitleRow}>
            <Text style={[styles.cardName, { color: theme.text }]} numberOfLines={1}>{item.name}</Text>
            <View style={[styles.catBadge, { backgroundColor: (cat?.color || Colors.primary) + '22' }]}>
              <Text style={[styles.catBadgeText, { color: cat?.color || Colors.primary }]}>
                {cat?.icon} {item.category}
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
              {item.instagram && <Text style={styles.socialIcon}>📸</Text>}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const ListHeader = () => (
    <View>
      {/* SEARCH */}
      <View style={[styles.searchBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={[styles.searchInput, { color: theme.text }]}
          placeholder="Rechercher une entreprise..."
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

      {/* CATEGORY FILTER */}
      <FlatList
        horizontal
        data={['Tous', ...CATEGORIES.map(c => c.label)] as (Category | 'Tous')[]}
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
            >
              <Text style={[styles.filterChipText, { color: active ? '#fff' : theme.text }]}>
                {cat ? `${cat.icon} ${item}` : '🌍 Tous'}
              </Text>
            </TouchableOpacity>
          );
        }}
      />

      {/* CITY FILTER */}
      <FlatList
        horizontal
        data={['Toutes', ...CITIES]}
        keyExtractor={item => item}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
        renderItem={({ item }) => {
          const active = activeCity === item;
          return (
            <TouchableOpacity
              style={[styles.cityChip, active && { backgroundColor: Colors.primary + '22', borderColor: Colors.primary }]}
              onPress={() => setActiveCity(item)}
            >
              <Text style={[styles.cityChipText, { color: active ? Colors.primary : theme.textSecondary }]}>
                {item === 'Toutes' ? '🌍 Toutes les villes' : `📍 ${item}`}
              </Text>
            </TouchableOpacity>
          );
        }}
      />

      {/* RESULTS COUNT */}
      {!loading && (
        <Text style={[styles.resultCount, { color: theme.textSecondary }]}>
          {filtered.length} entreprise{filtered.length !== 1 ? 's' : ''} trouvée{filtered.length !== 1 ? 's' : ''}
        </Text>
      )}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={Colors.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          renderItem={renderBusiness}
          ListHeaderComponent={ListHeader}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => setRefreshing(true)} tintColor={Colors.primary} />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={{ fontSize: 48 }}>🔍</Text>
              <Text style={[styles.emptyTitle, { color: theme.text }]}>Aucune entreprise trouvée</Text>
              <Text style={[styles.emptySub, { color: theme.textSecondary }]}>
                Essayez d'autres filtres ou revenez plus tard.
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchBox: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 12, marginTop: 12, marginBottom: 4, borderRadius: 12, borderWidth: 1.5, paddingHorizontal: 12, paddingVertical: 8 },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, fontSize: 15, paddingVertical: 4 },

  // Filter chips — fixed height so text is always vertically centered
  filterRow: { paddingHorizontal: 12, paddingVertical: 2, gap: 6 },
  filterChip: { height: 32, paddingHorizontal: 12, borderRadius: 16, backgroundColor: '#E0E0E0', alignItems: 'center', justifyContent: 'center' },
  filterChipText: { fontSize: 12, fontWeight: '600', lineHeight: 16 },
  cityChip: { height: 28, paddingHorizontal: 10, borderRadius: 14, borderWidth: 1, borderColor: 'transparent', backgroundColor: 'transparent', alignItems: 'center', justifyContent: 'center' },
  cityChipText: { fontSize: 12, fontWeight: '500', lineHeight: 16 },

  resultCount: { fontSize: 12, paddingHorizontal: 16, paddingVertical: 4 },
  listContent: { paddingHorizontal: 12, paddingBottom: 24, gap: 10 },
  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // Compact card — vertical layout with image on top
  card: { borderRadius: 12, borderWidth: 1, overflow: 'hidden', elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3 },
  cardImgBox: { height: 140, position: 'relative' },
  cardImg: { width: '100%', height: '100%' },
  cardImgPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  likeBtn: { position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.35)', borderRadius: 14, padding: 5 },
  cardBody: { padding: 10, gap: 4 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 6 },
  cardName: { fontSize: 14, fontWeight: '800', flex: 1, lineHeight: 18 },
  catBadge: { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, flexShrink: 0 },
  catBadgeText: { fontSize: 10, fontWeight: '700' },
  cardDesc: { fontSize: 12, lineHeight: 16, color: '#888' },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardCity: { fontSize: 11 },
  socialRow: { flexDirection: 'row', gap: 3 },
  socialIcon: { fontSize: 12 },

  empty: { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyTitle: { fontSize: 17, fontWeight: '700' },
  emptySub: { fontSize: 13, textAlign: 'center', paddingHorizontal: 32 },
});