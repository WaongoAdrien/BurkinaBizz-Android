// app/annuaire.tsx — Directory Screen with Auto-hide Filters

import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, TextInput,
  StyleSheet, ActivityIndicator, RefreshControl, Image,
  Keyboard, TouchableWithoutFeedback,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

import { db } from '../lib/firebase';
import { useLikes } from '../hooks/useLikes';
import { useAuth } from '../lib/AuthContext';
import { Business, Category } from '../types';
import { Colors, CATEGORIES, CITIES, CITY_CATEGORIES } from '../constants';
import { useColorTheme } from '../hooks/useColorTheme';
import { CategoryIcon } from '../components/CategoryIcon';
import { ContentContainer } from '../components/ContentContainer';
import { AppHeader } from '../components/AppHeader';
import { useTranslation, registerTranslations } from '../lib/LanguageContext';

registerTranslations({
  'Rechercher une entreprise...': 'Search for a business...',
  '🌍 Toutes les villes': '🌍 All cities',
  '🌍 Tous': '🌍 All',
  'entreprise trouvée': 'business found',
  'entreprises trouvées': 'businesses found',
  'Filtrer par description...': 'Filter by description...',
  'Annuaire': 'Directory',
  'Aucune entreprise trouvée': 'No businesses found',
  "Essayez d'autres filtres ou revenez plus tard.": 'Try different filters or check back later.',
});

function ListHeader({
  theme, search, setSearch, activeCategory, setActiveCategory,
  activeCity, setActiveCity, loading, filteredCount, descSearch, setDescSearch, router,
}: {
  theme: any; search: string; setSearch: (s: string) => void;
  activeCategory: Category | 'Tous'; setActiveCategory: (c: Category | 'Tous') => void;
  activeCity: string; setActiveCity: (c: string) => void;
  loading: boolean; filteredCount: number;
  descSearch: string; setDescSearch: (s: string) => void;
  router: any;
}) {
  const { t } = useTranslation();
  return (
    <View style={{ width: '100%', alignItems: 'center' }}>
      <View style={{ width: '100%', maxWidth: 600, paddingHorizontal: 12, paddingTop: 12 }}>
      <View>
        {/* SEARCH */}
        <View style={[styles.searchBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder={t('Rechercher une entreprise...')}
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
                activeOpacity={1}
              >
                <Text style={[styles.cityChipText, { color: active ? Colors.primary : theme.textSecondary }]}>
                  {item === 'Toutes' ? t('🌍 Toutes les villes') : `📍 ${item}`}
                </Text>
              </TouchableOpacity>
            );
          }}
        />

        {/* CATEGORY FILTER */}
        <View style={{ height: 10 }} />
        <FlatList
          horizontal
          data={(() => {
            let availableCategories;
            if (activeCity === 'Toutes') {
              availableCategories = CATEGORIES.map(c => c.label);
            } else if (CITY_CATEGORIES[activeCity]) {
              availableCategories = CITY_CATEGORIES[activeCity];
            } else {
              availableCategories = CATEGORIES.map(c => c.label);
            }
            return ['Tous', ...availableCategories] as (Category | 'Tous')[];
          })()}
          keyExtractor={(item, index) => `${item}-${index}`}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
          renderItem={({ item }) => {
            const active = activeCategory === item;
            const cat = CATEGORIES.find(c => c.label === item);
            const activeColor = cat ? cat.color : Colors.primary;
            return (
              <TouchableOpacity
                style={[styles.filterChip, active && { backgroundColor: activeColor }]}
                onPress={() => setActiveCategory(item)}
                activeOpacity={1}
              >
                <Text style={[styles.filterChipText, { color: active ? '#fff' : theme.text }]}>
                  {item === 'Tous' ? t('🌍 Tous') : item}
                </Text>
              </TouchableOpacity>
            );
          }}
        />

        {/* RESULTS COUNT */}
        {!loading && (
          <Text style={[styles.resultCount, { color: theme.textSecondary }]}>
            {filteredCount} {t(filteredCount !== 1 ? 'entreprises trouvées' : 'entreprise trouvée')}
          </Text>
        )}

        {/* DESCRIPTION SEARCH */}
        {!loading && (activeCategory !== 'Tous' || activeCity !== 'Toutes') && (
          <View style={[styles.descSearchBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={styles.descSearchIcon}>🔎</Text>
            <TextInput
              style={[styles.descSearchInput, { color: theme.text }]}
              placeholder={t('Filtrer par description...')}
              placeholderTextColor={theme.textSecondary}
              value={descSearch}
              onChangeText={setDescSearch}
              autoCorrect={false}
            />
            {descSearch.length > 0 && (
              <TouchableOpacity onPress={() => setDescSearch('')}>
                <Text style={{ color: theme.textSecondary, fontSize: 14, paddingHorizontal: 4 }}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
      </View>
    </View>
  );
}

export default function AnnuaireScreen() {
  const router = useRouter();
  const { category: paramCategory, city: paramCity } = useLocalSearchParams<{ category?: string; city?: string }>();
  const { theme, isDark } = useColorTheme();
  const { user } = useAuth();
  const { isLiked, toggleLike } = useLikes(user?.uid);
  const { t } = useTranslation();

  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [filtered, setFiltered] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [descSearch, setDescSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<Category | 'Tous'>(
    (paramCategory as Category) || 'Tous'
  );
  const [activeCity, setActiveCity] = useState<string>(paramCity || 'Toutes');

  useEffect(() => {
    const q = query(
      collection(db, 'businesses'),
      where('status', '==', 'approved'),
      where('city', 'in', CITIES)
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
    if (activeCategory !== 'Tous') {
      result = result.filter(b => 
        b.category === activeCategory || 
        (b.categories && b.categories.includes(activeCategory))
      );
    }
    if (activeCity !== 'Toutes') result = result.filter(b => b.city === activeCity);
    if (search.trim()) {
      const s = search.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      result = result.filter(b => {
        const name = b.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const desc = (b.description ?? '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const city = b.city.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        return name.includes(s) || desc.includes(s) || city.includes(s);
      });
    }
    if (descSearch.trim()) {
      const ds = descSearch.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      result = result.filter(b => {
        const desc = (b.description ?? '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        return desc.includes(ds);
      });
    }
    result.sort((a, b) => {
      const aPinned = a.pinned ? 1 : 0;
      const bPinned = b.pinned ? 1 : 0;
      if (aPinned !== bPinned) return bPinned - aPinned;
      const aPriority = a.priority ?? 0;
      const bPriority = b.priority ?? 0;
      if (aPriority !== bPriority) return bPriority - aPriority;
      const toMs = (v: any) => v?.toDate?.()?.getTime?.() ?? (v instanceof Date ? v.getTime() : new Date(v).getTime());
      return toMs(b.createdAt) - toMs(a.createdAt);
    });
    setFiltered(result);
  }, [businesses, activeCategory, activeCity, search, descSearch]);


  const renderBusiness = ({ item }: { item: Business }) => {
    const liked = isLiked(item.id);
    const displayCategory =
      activeCategory !== 'Tous' &&
      (item.category === activeCategory || item.categories?.includes(activeCategory))
        ? activeCategory
        : item.category;
    const cat = CATEGORIES.find(c => c.label === displayCategory);
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
              <Text style={{ fontSize: 12 }}>{liked ? '❤️' : '🤍'}</Text>
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
                  {displayCategory}
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
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
    <LinearGradient
      colors={(theme.backgroundGradient?.length >= 2 ? theme.backgroundGradient : [theme.background, theme.background]) as [string, string, ...string[]]}
      style={{ flex: 1 }}
    >
      <AppHeader title={t('Annuaire')} />

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={Colors.primary} size="large" />
        </View>
      ) : (
        <>
          <ListHeader
            theme={theme}
            search={search}
            setSearch={setSearch}
            activeCategory={activeCategory}
            setActiveCategory={setActiveCategory}
            activeCity={activeCity}
            setActiveCity={setActiveCity}
            loading={loading}
            filteredCount={filtered.length}
            descSearch={descSearch}
            setDescSearch={setDescSearch}
            router={router}
          />
          
          <View style={{ flex: 1, width: '100%', alignItems: 'center' }}>
            <FlatList

              style={{ width: '100%', maxWidth: 600 }}
              data={filtered}
              keyExtractor={item => item.id}
              renderItem={renderBusiness}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"

              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={() => setRefreshing(true)} tintColor={Colors.primary} />
              }
              ListEmptyComponent={
                <View style={styles.empty}>
                  <Text style={{ fontSize: 48 }}>📋</Text>
                  <Text style={[styles.emptyTitle, { color: theme.text }]}>{t('Aucune entreprise trouvée')}</Text>
                  <Text style={[styles.emptySub, { color: theme.textSecondary }]}>
                    {t("Essayez d'autres filtres ou revenez plus tard.")}
                  </Text>
                </View>
              }
            />
          </View>

        </>
      )}
      
    </LinearGradient>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  searchBox: { flexDirection: 'row', alignItems: 'center', marginBottom: 4, borderRadius: 7, borderWidth: 1.5, paddingHorizontal: 4, paddingVertical: 8 },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, fontSize: 15, paddingVertical: 4 },

  filterRow: { paddingHorizontal: 6, paddingVertical: 2, gap: 6 },
  filterChip: { height: 32, paddingHorizontal: 10, borderRadius: 7, backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center' },
  filterChipText: { fontSize: 12, fontWeight: '400', lineHeight: 16 },
  cityChip: { height: 40, paddingHorizontal: 10, borderRadius: 8, borderWidth: 1, borderColor: '#E0E0E0', backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center' },
  cityChipText: { fontSize: 12, fontWeight: '400', lineHeight: 16 },

  resultCount: { fontSize: 12, paddingHorizontal: 6, paddingVertical: 4 },
  descSearchBox: { flexDirection: 'row', alignItems: 'center', marginTop: 8, marginBottom: 4, borderRadius: 6, borderWidth: 1.5, paddingHorizontal: 10, paddingVertical: 8 },
  descSearchIcon: { fontSize: 14, marginRight: 6 },
  descSearchInput: { flex: 1, fontSize: 14, paddingVertical: 2 },
  listContent: { paddingHorizontal: 12, paddingBottom: 24, gap: 12 },
  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  card: { borderRadius: 7, borderWidth: 2, overflow: 'hidden', elevation: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, shadowRadius: 6, marginBottom: 4, backgroundColor: '#FAFAFA' },
  cardRow: { flexDirection: 'row', alignItems: 'stretch' },
  cardImgBox: { width: 100, alignSelf: 'stretch', position: 'relative' },
  cardImg: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  cardImgPlaceholder: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
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
  homeBtn: { paddingHorizontal: 8, paddingVertical: 4 },
  homeBtnText: { fontSize: 22 },
  
});
