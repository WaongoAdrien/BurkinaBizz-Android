// app/liked.tsx — Favorites/Liked Businesses Screen

import React from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, Image, StatusBar,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useAuth } from '../lib/AuthContext';
import { useLikes } from '../hooks/useLikes';
import { Colors, CATEGORIES } from '../constants';
import { useColorTheme } from '../hooks/useColorTheme';
import { TabBar } from '../components/TabBar';

export default function LikedScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { theme } = useColorTheme();
  const { likedProducts: likedBusinesses, unlike, loading } = useLikes(user?.uid);

  const handleUnlike = (item: any) => {
    unlike(item.id);
  };

  const renderBusiness = ({ item }: { item: any }) => {
    const cat = CATEGORIES.find(c => c.label === item.category);
    return (
      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <TouchableOpacity
          style={styles.cardInner}
          onPress={() => router.push(`/business/${item.id}`)}
          activeOpacity={0.8}
        >
          {item.coverPhoto ? (
            <Image source={{ uri: item.coverPhoto }} style={styles.thumb} resizeMode="cover" />
          ) : (
            <View style={[styles.thumbPlaceholder, { backgroundColor: (cat?.color || Colors.primary) + '22' }]}>
              <Text style={{ fontSize: 24 }}>{cat?.icon || '🏢'}</Text>
            </View>
          )}
          <View style={styles.cardInfo}>
            <Text style={[styles.cardName, { color: theme.text }]} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={[styles.cardMeta, { color: theme.textSecondary }]}>
              {cat?.icon} {item.category} • 📍 {item.city}
            </Text>
            {item.phone && (
              <Text style={[styles.cardPhone, { color: theme.textSecondary }]}>
                📞 {item.phone}
              </Text>
            )}
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.unlikeBtn}
          onPress={() => handleUnlike(item)}
        >
          <Text style={{ fontSize: 18 }}>💔</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (!user) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <StatusBar barStyle="dark-content" backgroundColor={theme.background} />
        <Stack.Screen options={{ title: 'Favoris ❤️', headerBackVisible: false }} />
        <View style={styles.emptyContainer}>
          <Text style={{ fontSize: 64 }}>🔑</Text>
          <Text style={[styles.emptyTitle, { color: theme.text }]}>
            Connexion requise
          </Text>
          <Text style={[styles.emptySub, { color: theme.textSecondary }]}>
            Connectez-vous pour sauvegarder vos entreprises favorites
          </Text>
          <TouchableOpacity
            style={[styles.loginBtn, { backgroundColor: Colors.primary }]}
            onPress={() => router.push('/auth')}
          >
            <Text style={styles.loginBtnText}>🔑 Se connecter</Text>
          </TouchableOpacity>
        </View>
        <TabBar />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.background} />
      <Stack.Screen options={{ title: 'Favoris ❤️', headerBackVisible: false }} />
      
      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={Colors.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={likedBusinesses}
          keyExtractor={item => item.id}
          renderItem={renderBusiness}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={{ fontSize: 64 }}>🤍</Text>
              <Text style={[styles.emptyTitle, { color: theme.text }]}>
                Aucun favori
              </Text>
              <Text style={[styles.emptySub, { color: theme.textSecondary }]}>
                Parcourez l'annuaire et appuyez sur ❤️ pour sauvegarder vos entreprises préférées
              </Text>
              <TouchableOpacity
                style={[styles.browseBtn, { backgroundColor: Colors.primary }]}
                onPress={() => router.push('/annuaire')}
              >
                <Text style={styles.browseBtnText}>🔍 Parcourir l'annuaire</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
      
      <TabBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listContent: { padding: 16, paddingBottom: 24 },
  card: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
    overflow: 'hidden',
    elevation: 1,
  },
  cardInner: { flex: 1, flexDirection: 'row' },
  thumb: { width: 80, height: 80 },
  thumbPlaceholder: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: { flex: 1, padding: 10, gap: 4, justifyContent: 'center' },
  cardName: { fontSize: 14, fontWeight: '700' },
  cardMeta: { fontSize: 12 },
  cardPhone: { fontSize: 11 },
  unlikeBtn: {
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    width: 46,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  emptyTitle: { fontSize: 20, fontWeight: '800', textAlign: 'center' },
  emptySub: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 8,
  },
  browseBtn: {
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 12,
    marginTop: 8,
  },
  browseBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  loginBtn: {
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 12,
    marginTop: 8,
  },
  loginBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
});