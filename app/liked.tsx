// app/liked.tsx — Favorites/Liked Businesses Screen

import React from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, Image, StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../lib/AuthContext';
import { useLikes } from '../hooks/useLikes';
import { Colors, CATEGORIES } from '../constants';
import { useColorTheme } from '../hooks/useColorTheme';
import { useTranslation, registerTranslations } from '../lib/LanguageContext';
import { AppHeader } from '../components/AppHeader';

registerTranslations({
  'Favoris ❤️': 'Favorites ❤️',
  'Connexion requise': 'Login required',
  'Connectez-vous pour sauvegarder vos entreprises favorites': 'Log in to save your favorite businesses',
  '🔑 Se connecter': '🔑 Log in',
  'Aucun favori': 'No favorites yet',
  "Parcourez l'annuaire et appuyez sur ❤️ pour sauvegarder vos entreprises préférées": 'Browse the directory and tap ❤️ to save your favorite businesses',
  "🔍 Parcourir l'annuaire": '🔍 Browse directory',
});

export default function LikedScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { theme } = useColorTheme();
  const { t } = useTranslation();
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
              {cat?.icon} {t(item.category)} • 📍 {item.city}
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
      <LinearGradient
        colors={(theme.backgroundGradient || [theme.background, theme.background]) as [string, string, ...string[]]}
        style={styles.container}
      >
        <StatusBar barStyle="dark-content" backgroundColor={theme.background} />
        <AppHeader title={t('Favoris ❤️')} />
        <View style={styles.emptyContainer}>
          <Text style={{ fontSize: 64 }}>🔑</Text>
          <Text style={[styles.emptyTitle, { color: theme.text }]}>
            {t('Connexion requise')}
          </Text>
          <Text style={[styles.emptySub, { color: theme.textSecondary }]}>
            {t('Connectez-vous pour sauvegarder vos entreprises favorites')}
          </Text>
          <TouchableOpacity
            style={[styles.loginBtn, { backgroundColor: Colors.primary }]}
            onPress={() => router.push('/auth')}
          >
            <Text style={styles.loginBtnText}>{t('🔑 Se connecter')}</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={(theme.backgroundGradient || [theme.background, theme.background]) as [string, string, ...string[]]}
      style={styles.container}
    >
      <StatusBar barStyle="dark-content" backgroundColor={theme.background} />
      <AppHeader title={t('Favoris ❤️')} />

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
                {t('Aucun favori')}
              </Text>
              <Text style={[styles.emptySub, { color: theme.textSecondary }]}>
                {t("Parcourez l'annuaire et appuyez sur ❤️ pour sauvegarder vos entreprises préférées")}
              </Text>
              <TouchableOpacity
                style={[styles.browseBtn, { backgroundColor: Colors.primary }]}
                onPress={() => router.push('/annuaire')}
              >
                <Text style={styles.browseBtnText}>{t("🔍 Parcourir l'annuaire")}</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listContent: { padding: 16, paddingBottom: 24 },
  card: {
    flexDirection: 'row',
    borderRadius: 7,
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
  cardName: { fontSize: 14, fontWeight: '400' },
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
  emptyTitle: { fontSize: 20, fontWeight: '400', textAlign: 'center' },
  emptySub: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 8,
  },
  browseBtn: {
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 7,
    marginTop: 8,
  },
  browseBtnText: { color: '#fff', fontSize: 15, fontWeight: '400' },
  loginBtn: {
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 7,
    marginTop: 8,
  },
  loginBtnText: { color: '#fff', fontSize: 15, fontWeight: '400' },
});