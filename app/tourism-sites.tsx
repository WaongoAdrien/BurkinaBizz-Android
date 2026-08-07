// app/tourism-sites.tsx — Tourism sites & sights

import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, Image, ScrollView, TextInput, TouchableOpacity, StyleSheet, StatusBar, ActivityIndicator, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ExpoLocation from 'expo-location';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Colors } from '../constants';
import { useColorTheme } from '../hooks/useColorTheme';
import { useTranslation, registerTranslations } from '../lib/LanguageContext';
import SitesMapView, { distanceKm, MapSite } from '../components/SitesMapView';
import { AppHeader } from '../components/AppHeader';

registerTranslations({
  'Sites touristiques': 'Tourist sites',
  'Voir moins': 'See less',
  'Lire la suite': 'Read more',
  'Envie de sortir ?': 'Feeling like going out?',
  'Découvrez les événements à ne pas manquer près de chez vous': "Discover the events you shouldn't miss near you",
  'Voir sur la carte': 'View on map',
  'Rechercher un site...': 'Search a site...',
  '🌍 Tous': '🌍 All',
  'Aucun site ne correspond à votre recherche': 'No site matches your search',
});

const HERO_IMAGE = require('../assets/tourism.png');
const EVENTS_CTA_IMAGE = require('../assets/imageindex.png');

interface Attraction {
  id: string;
  name: string;
  image: string;
  photos?: string[];
  category: string;
  location: string;
  phone?: string;
  description: string;
  mapLink?: string;
  facebook?: string;
  website?: string;
  schedule?: string;
  priority?: number;
  latitude?: number;
  longitude?: number;
}

function AttractionCard({ item, liked, onToggleLike, userLoc }: {
  item: Attraction; liked: boolean; onToggleLike: () => void; userLoc: { lat: number; lng: number } | null;
}) {
  const [expanded, setExpanded] = useState(false);
  const canExpand = (item.description?.length || 0) > 90;
  const { t } = useTranslation();
  const router = useRouter();
  const distance = userLoc && item.latitude != null && item.longitude != null
    ? distanceKm(userLoc.lat, userLoc.lng, item.latitude, item.longitude)
    : null;

  return (
    <TouchableOpacity style={styles.card} onPress={() => router.push(`/tourism/${item.id}`)} activeOpacity={0.9}>
      <View style={styles.cardImageWrap}>
        <Image source={{ uri: item.image }} style={styles.cardImage} resizeMode="cover" />

        <View style={styles.categoryBadge}>
          <Text style={styles.categoryBadgeText}>{item.category}</Text>
        </View>

        <TouchableOpacity
          style={styles.likeBtn}
          onPress={onToggleLike}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name={liked ? 'heart' : 'heart-outline'} size={20} color={liked ? '#E0245E' : '#fff'} />
        </TouchableOpacity>
      </View>

      <View style={styles.cardBody}>
        <Text style={styles.cardName}>{item.name}</Text>
        <Text style={styles.cardDesc} numberOfLines={expanded ? undefined : 2}>{item.description}</Text>
        {canExpand && (
          <TouchableOpacity onPress={() => setExpanded(v => !v)} hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}>
            <Text style={styles.readMore}>{expanded ? t('Voir moins') : t('Lire la suite')}</Text>
          </TouchableOpacity>
        )}
        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={14} color="#8A8A8A" />
          <Text style={styles.infoText}>{item.location}</Text>
          {distance !== null && (
            <View style={styles.distanceBadge}>
              <Text style={styles.distanceBadgeText}>{distance.toFixed(1)} km</Text>
            </View>
          )}
        </View>
        {item.phone && (
          <TouchableOpacity
            style={styles.infoRow}
            onPress={() => Linking.openURL(`tel:${item.phone!.replace(/\s+/g, '')}`)}
          >
            <Ionicons name="call-outline" size={14} color={Colors.primary} />
            <Text style={[styles.infoText, styles.phoneText]}>{item.phone}</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

export default function TourismSitesScreen() {
  const router = useRouter();
  const [attractions, setAttractions] = useState<Attraction[]>([]);
  const [loading, setLoading] = useState(true);
  const [likedIds, setLikedIds] = useState<string[]>([]);
  const [userLoc, setUserLoc] = useState<{ lat: number; lng: number } | null>(null);
  const [mapVisible, setMapVisible] = useState(false);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('Tous');
  const { t } = useTranslation();
  const { theme } = useColorTheme();

  useEffect(() => {
    const q = query(collection(db, 'touristSites'), orderBy('createdAt', 'asc'));
    const unsub = onSnapshot(q, (snap) => {
      setAttractions(snap.docs.map(d => ({ id: d.id, ...d.data() } as Attraction)));
      setLoading(false);
    });
    return unsub;
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;
        const loc = await ExpoLocation.getCurrentPositionAsync({ accuracy: ExpoLocation.Accuracy.Balanced });
        setUserLoc({ lat: loc.coords.latitude, lng: loc.coords.longitude });
      } catch {}
    })();
  }, []);

  const sitesWithCoords: MapSite[] = attractions
    .filter(a => a.latitude != null && a.longitude != null)
    .map(a => ({ id: a.id, name: a.name, latitude: a.latitude!, longitude: a.longitude! }));

  const toggleLike = (id: string) => {
    setLikedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [id, ...prev]);
  };

  const byPriority = (a: Attraction, b: Attraction) => (b.priority || 0) - (a.priority || 0);
  const sortedAttractions = [
    ...likedIds.map(id => attractions.find(a => a.id === id)!).filter(Boolean).sort(byPriority),
    ...attractions.filter(a => !likedIds.includes(a.id)).sort(byPriority),
  ];

  const categories = useMemo(() => {
    const set = new Set(attractions.map(a => a.category).filter(Boolean));
    return ['Tous', ...Array.from(set).sort()];
  }, [attractions]);

  const normalize = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

  const displayedAttractions = sortedAttractions.filter(a => {
    if (activeCategory !== 'Tous' && a.category !== activeCategory) return false;
    if (search.trim() && !normalize(a.name).includes(normalize(search.trim()))) return false;
    return true;
  });

  return (
    <View style={{ flex: 1, backgroundColor: '#e8ecf0' }}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.headerGradient[0]} />
      <AppHeader title={t('Sites touristiques')} />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* HERO */}
        <View style={styles.hero}>
          <Image source={HERO_IMAGE} style={styles.heroImage} resizeMode="cover" />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.65)']}
            style={styles.heroOverlay}
          />
          {sitesWithCoords.length > 0 && (
            <TouchableOpacity style={styles.mapFab} onPress={() => setMapVisible(true)} activeOpacity={0.85}>
              <Ionicons name="map" size={18} color="#fff" />
              <Text style={styles.mapFabText}>{t('Voir sur la carte')}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* BODY */}
        <View style={styles.body}>
          {/* SEARCH */}
          <View style={[styles.searchBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Ionicons name="search" size={17} color={theme.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: theme.text }]}
              placeholder={t('Rechercher un site...')}
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
          ) : displayedAttractions.length === 0 ? (
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              {t('Aucun site ne correspond à votre recherche')}
            </Text>
          ) : (
            displayedAttractions.map(item => (
              <AttractionCard
                key={item.id}
                item={item}
                liked={likedIds.includes(item.id)}
                onToggleLike={() => toggleLike(item.id)}
                userLoc={userLoc}
              />
            ))
          )}

          {/* EVENTS CTA */}
          <TouchableOpacity
            style={styles.crossCta}
            onPress={() => router.push('/evenement')}
            activeOpacity={0.9}
          >
            <Image source={EVENTS_CTA_IMAGE} style={styles.crossCtaImage} resizeMode="cover" />
            <LinearGradient
              colors={['rgba(11,30,61,0.35)', 'rgba(11,30,61,0.92)']}
              style={styles.crossCtaOverlay}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.crossCtaTitle}>{t('Envie de sortir ?')}</Text>
                <Text style={styles.crossCtaSub}>{t('Découvrez les événements à ne pas manquer près de chez vous')}</Text>
              </View>
              <View style={styles.crossCtaArrow}>
                <Ionicons name="arrow-forward" size={20} color={Colors.headerGradient[1]} />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <SitesMapView
        visible={mapVisible}
        onClose={() => setMapVisible(false)}
        sites={sitesWithCoords}
        theme={theme}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { height: 340, width: '100%' },
  heroImage: { width: '100%', height: '100%' },
  mapFab: {
    position: 'absolute', top: 16, right: 16, zIndex: 20,
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(11,30,61,0.85)', borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 9,
    elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4,
  },
  mapFabText: { color: '#fff', fontSize: 12.5, fontWeight: '600' },
  heroOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 140,
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingBottom: 22,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '300',
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.75)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  body: { paddingHorizontal: 10, paddingTop: 20, paddingBottom: 40, gap: 18 },
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
    borderRadius: 6,
    backgroundColor: '#fff',
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },
  cardImageWrap: { width: '100%', height: 180 },
  cardImage: { width: '100%', height: '100%' },
  categoryBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  categoryBadgeText: { color: '#fff', fontSize: 11, fontWeight: '400' },
  likeBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: { padding: 14, gap: 6 },
  cardName: { fontSize: 16, fontWeight: '400', color: '#1A1A1A' },
  cardDesc: { fontSize: 13, lineHeight: 18, color: '#5A5A5A', marginBottom: 4 },
  readMore: { fontSize: 12, fontWeight: '600', color: Colors.primary, marginBottom: 6 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  infoText: { fontSize: 12, color: '#8A8A8A' },
  phoneText: { color: Colors.primary, textDecorationLine: 'underline' },
  distanceBadge: { backgroundColor: Colors.primary + '18', borderRadius: 5, paddingHorizontal: 6, paddingVertical: 2 },
  distanceBadgeText: { fontSize: 11, fontWeight: '600', color: Colors.primary },
  crossCta: {
    height: 150, borderRadius: 12, overflow: 'hidden', marginTop: 4,
    elevation: 4, shadowColor: Colors.headerGradient[0],
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8,
  },
  crossCtaImage: { width: '100%', height: '100%', position: 'absolute' },
  crossCtaOverlay: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    padding: 18, gap: 14,
  },
  crossCtaTitle: { fontSize: 17, fontWeight: '600', color: '#fff', marginBottom: 4 },
  crossCtaSub: { fontSize: 12.5, lineHeight: 17, color: 'rgba(255,255,255,0.85)' },
  crossCtaArrow: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
  },
});
