// app/marketplace.tsx — MarketplaceScreen

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  ScrollView,
  RefreshControl,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  where,
  Query,
  DocumentData,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Product, Category } from '../types/index';
import { Colors, CATEGORIES } from '../constants';
import { useColorTheme } from '../hooks/useColorTheme';
import ProductCard from '../components/ProductCard';
import CategoryBadge from '../components/CategoryBadge';
import EmptyState from '../components/EmptyState';
import { useTranslation, registerTranslations } from '../lib/LanguageContext';

registerTranslations({
  'Impossible de charger les produits. Vérifiez votre connexion.': 'Unable to load products. Check your connection.',
  'Erreur de connexion': 'Connection error',
  'Réessayer': 'Retry',
  'Rechercher un produit...': 'Search for a product...',
  'produit trouvé': 'product found',
  'produits trouvés': 'products found',
  'dans': 'in',
  'Chargement du marché...': 'Loading marketplace...',
  'Aucun produit trouvé': 'No products found',
  'Aucun produit dans': 'No products in',
  'pour le moment.': 'for now.',
  'Le marché est vide pour le moment. Revenez bientôt!': 'The marketplace is empty for now. Check back soon!',
});

export default function MarketplaceScreen() {
  const { category: paramCategory } = useLocalSearchParams<{ category?: string }>();
  const { theme } = useColorTheme();
  const { t } = useTranslation();

  const [products, setProducts] = useState<Product[]>([]);
  const [filtered, setFiltered] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    (paramCategory as Category) || null
  );
  const [searchText, setSearchText] = useState('');

  // Real-time Firestore listener
  useEffect(() => {
    setLoading(true);
    setError(null);

    let q: Query<DocumentData> = query(
      collection(db, 'products'),
      orderBy('createdAt', 'desc')
    );

    if (selectedCategory) {
      q = query(
        collection(db, 'products'),
        where('category', '==', selectedCategory),
        orderBy('createdAt', 'desc')
      );
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Product[];
        setProducts(data);
        setLoading(false);
        setRefreshing(false);
      },
      (err) => {
        console.error(err);
        setError(t('Impossible de charger les produits. Vérifiez votre connexion.'));
        setLoading(false);
        setRefreshing(false);
      }
    );

    return unsubscribe;
  }, [selectedCategory]);

  // Client-side search filter
  useEffect(() => {
    if (!searchText.trim()) {
      setFiltered(products);
    } else {
      const q = searchText.toLowerCase();
      setFiltered(
        products.filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            p.description.toLowerCase().includes(q) ||
            p.city.toLowerCase().includes(q)
        )
      );
    }
  }, [products, searchText]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
  }, []);

  const handleCategorySelect = (cat: Category | null) => {
    setSelectedCategory(cat);
    setSearchText('');
  };

  if (error) {
    return (
      <LinearGradient
        colors={(theme.backgroundGradient || [theme.background, theme.background]) as [string, string, ...string[]]}
        style={styles.container}
      >
        <EmptyState
          icon="📵"
          title={t('Erreur de connexion')}
          subtitle={error}
        />
        <TouchableOpacity
          style={[styles.retryBtn, { backgroundColor: Colors.primary }]}
          onPress={() => setSelectedCategory(selectedCategory)}
        >
          <Text style={{ color: '#fff', fontWeight: '400' }}>{t('Réessayer')}</Text>
        </TouchableOpacity>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={(theme.backgroundGradient || [theme.background, theme.background]) as [string, string, ...string[]]}
      style={styles.container}
    >
      {/* SEARCH BAR */}
      <View style={[styles.searchWrapper, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={[styles.searchInput, { color: theme.text }]}
          placeholder={t('Rechercher un produit...')}
          placeholderTextColor={theme.textSecondary}
          value={searchText}
          onChangeText={setSearchText}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
        {searchText.length > 0 && (
          <TouchableOpacity onPress={() => setSearchText('')}>
            <Text style={{ color: theme.textSecondary, fontSize: 18, paddingRight: 4 }}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* CATEGORY FILTER */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryScroll}
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 10 }}
      >
        <CategoryBadge
          category={selectedCategory}
          onSelect={handleCategorySelect}
          showAll={true}
        />
      </ScrollView>

      {/* RESULTS COUNT */}
      {!loading && (
        <Text style={[styles.resultCount, { color: theme.textSecondary }]}>
          {filtered.length} {t(filtered.length !== 1 ? 'produits trouvés' : 'produit trouvé')}
          {selectedCategory ? ` ${t('dans')} "${t(selectedCategory)}"` : ''}
        </Text>
      )}

      {/* PRODUCT LIST */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
            {t('Chargement du marché...')}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ProductCard product={item} />}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.primary}
              colors={[Colors.primary]}
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon="🛒"
              title={t('Aucun produit trouvé')}
              subtitle={
                selectedCategory
                  ? `${t('Aucun produit dans')} "${t(selectedCategory)}" ${t('pour le moment.')}`
                  : t('Le marché est vide pour le moment. Revenez bientôt!')
              }
            />
          }
          // Performance optimizations for low bandwidth
          removeClippedSubviews={true}
          maxToRenderPerBatch={6}
          windowSize={10}
          initialNumToRender={4}
        />
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 7,
    borderWidth: 1.5,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  searchIcon: {
    fontSize: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    padding: 0,
  },
  categoryScroll: {
    maxHeight: 56,
  },
  resultCount: {
    fontSize: 12,
    paddingHorizontal: 16,
    paddingBottom: 6,
    fontWeight: '400',
  },
  listContent: {
    paddingHorizontal: 10,
    paddingBottom: 24,
  },
  row: {
    justifyContent: 'space-between',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
  },
  retryBtn: {
    marginHorizontal: 32,
    padding: 14,
    borderRadius: 7,
    alignItems: 'center',
    marginBottom: 32,
  },
});
