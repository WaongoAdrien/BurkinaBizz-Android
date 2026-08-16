// app/marketplace.tsx — Marketplace product listing

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
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Product, ProductCategory } from '../types/index';
import { Colors, PRODUCT_CATEGORIES } from '../constants';
import { useColorTheme } from '../hooks/useColorTheme';
import { CategoryIcon } from '../components/CategoryIcon';
import { ContentContainer } from '../components/ContentContainer';
import { AppHeader } from '../components/AppHeader';
import ProductCard from '../components/ProductCard';
import EmptyState from '../components/EmptyState';
import { useTranslation, registerTranslations } from '../lib/LanguageContext';

registerTranslations({
  'Produits à vendre': 'Products for sale',
  'Impossible de charger les produits. Vérifiez votre connexion.': 'Unable to load products. Check your connection.',
  'Erreur de connexion': 'Connection error',
  'Réessayer': 'Retry',
  'Rechercher un produit...': 'Search for a product...',
  '🌍 Tous': '🌍 All',
  'produit trouvé': 'product found',
  'produits trouvés': 'products found',
  'dans': 'in',
  'Chargement du marché...': 'Loading marketplace...',
  'Aucun produit trouvé': 'No products found',
  'Aucun produit dans': 'No products in',
  'pour le moment.': 'for now.',
  'Le marché est vide pour le moment. Revenez bientôt!': 'The marketplace is empty for now. Check back soon!',
  'Électronique': 'Electronics',
  'Téléphones & Tablettes': 'Phones & Tablets',
  'Vêtements & Mode': 'Clothing & Fashion',
  'Meubles & Maison': 'Furniture & Home',
  'Véhicules': 'Vehicles',
  'Beauté & Santé': 'Beauty & Health',
  'Sports & Loisirs': 'Sports & Leisure',
  'Livres & Éducation': 'Books & Education',
  'Bébé & Enfants': 'Baby & Kids',
  'Autres': 'Other',
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
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | null>(
    (paramCategory as ProductCategory) || null
  );
  const [searchText, setSearchText] = useState('');

  // Real-time Firestore listener — only approved listings, newest first.
  useEffect(() => {
    setLoading(true);
    setError(null);

    const q = selectedCategory
      ? query(
          collection(db, 'products'),
          where('status', '==', 'approved'),
          where('category', '==', selectedCategory),
          orderBy('createdAt', 'desc')
        )
      : query(
          collection(db, 'products'),
          where('status', '==', 'approved'),
          orderBy('createdAt', 'desc')
        );

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

  const handleCategorySelect = (cat: ProductCategory | null) => {
    setSelectedCategory(cat);
    setSearchText('');
  };

  if (error) {
    return (
      <View style={{ flex: 1 }}>
        <AppHeader title={t('Produits à vendre')} />
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
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <AppHeader title={t('Produits à vendre')} />
      <LinearGradient
        colors={(theme.backgroundGradient || [theme.background, theme.background]) as [string, string, ...string[]]}
        style={styles.container}
      >
        <View style={{ width: '100%', alignItems: 'center', flex: 1 }}>
          <View style={{ width: '100%', maxWidth: 600, flex: 1 }}>
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
              contentContainerStyle={styles.filterRow}
            >
              <TouchableOpacity
                style={[styles.filterChip, !selectedCategory && { backgroundColor: Colors.primary }]}
                onPress={() => handleCategorySelect(null)}
                activeOpacity={0.85}
              >
                <Text style={[styles.filterChipText, { color: !selectedCategory ? '#fff' : theme.text }]}>
                  {t('🌍 Tous')}
                </Text>
              </TouchableOpacity>
              {PRODUCT_CATEGORIES.map((cat) => {
                const active = selectedCategory === cat.label;
                return (
                  <TouchableOpacity
                    key={cat.label}
                    style={[styles.filterChip, active && { backgroundColor: cat.color }]}
                    onPress={() => handleCategorySelect(cat.label)}
                    activeOpacity={0.85}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                      <CategoryIcon iconName={cat.icon} iconFamily={cat.iconFamily} size={14} color={active ? '#fff' : cat.color} />
                      <Text style={[styles.filterChipText, { color: active ? '#fff' : theme.text }]}>
                        {t(cat.label)}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
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
          </View>
        </View>
      </LinearGradient>
    </View>
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
  filterRow: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  filterChip: {
    height: 32, paddingHorizontal: 12, borderRadius: 7,
    backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center',
  },
  filterChipText: { fontSize: 12.5, fontWeight: '400' },
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
