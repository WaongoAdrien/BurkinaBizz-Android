// app/vendor/dashboard.tsx - Updated with improved date sorting

import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Alert, Image, ActivityIndicator, RefreshControl, StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { collection, query, where, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../lib/AuthContext';
import { useLikes } from '../../hooks/useLikes';
import { Business, Product } from '../../types';
import { Colors, CATEGORIES, PRODUCT_CATEGORIES } from '../../constants';
import { useColorTheme } from '../../hooks/useColorTheme';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation, registerTranslations } from '../../lib/LanguageContext';
import { AppHeader } from '../../components/AppHeader';

registerTranslations({
  'Supprimer': 'Delete',
  'Annuler': 'Cancel',
  'Erreur': 'Error',
  'Impossible de supprimer.': 'Unable to delete.',
  'Retirer des favoris?': 'Remove from favorites?',
  'Retirer': 'Remove',
  'de vos favoris?': 'from your favorites?',
  'Publié': 'Published',
  'En attente': 'Pending',
  'Mon espace': 'My space',
  'Utilisateur': 'User',
  'Admin': 'Admin',
  'Publiées': 'Published',
  'Favoris': 'Favorites',
  '+ Référencer mon entreprise': '+ List my business',
  '+ Vendre un produit': '+ Sell a product',
  'Mes entreprises': 'My businesses',
  'Mes produits': 'My products',
  'Aucune entreprise soumise': 'No business submitted',
  "Appuyez sur \"Référencer\" pour ajouter votre entreprise à l'annuaire.": 'Tap "List" to add your business to the directory.',
  'Aucun produit soumis': 'No product submitted',
  "Appuyez sur \"Vendre un produit\" pour le mettre en vente.": 'Tap "Sell a product" to list it for sale.',
  'Supprimer ce produit?': 'Delete this product?',
  'Aucun favori': 'No favorites',
  "Parcourez l'annuaire et appuyez sur le cœur pour sauvegarder des entreprises.": 'Browse the directory and tap the heart to save businesses.',
  "Voir l'annuaire": 'View directory',
  "Voir plus d'entreprises": 'See more businesses',
});

type Tab = 'businesses' | 'products' | 'liked';

export default function VendorDashboardScreen() {
  const router = useRouter();
  const { user, userProfile, isAdmin, isPending } = useAuth();
  const { theme, isDark } = useColorTheme();
  const { likedProducts: likedBusinesses, unlike, loading: likesLoading } = useLikes(user?.uid);

  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('businesses');
  const { t } = useTranslation();

  useEffect(() => {
    if (!user) { router.replace('/'); return; }
    if (isPending) { router.replace('/vendor/pending'); return; }
  }, [user, isPending]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'businesses'), where('ownerId', '==', user.uid));
    return onSnapshot(q, snap => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as Business));
      
      // Sort by newest first (handles Date, string, and Firestore Timestamp)
      data.sort((a, b) => {
        let at: Date;
        let bt: Date;
        
        // Handle different date formats for business A
        if (a.createdAt instanceof Date) {
          at = a.createdAt;
        } else if (typeof a.createdAt === 'string') {
          at = new Date(a.createdAt);
        } else if (a.createdAt && typeof a.createdAt === 'object' && 'toDate' in a.createdAt) {
          // Firestore Timestamp
          at = (a.createdAt as any).toDate();
        } else {
          at = new Date(0); // Fallback for missing date
        }
        
        // Handle different date formats for business B
        if (b.createdAt instanceof Date) {
          bt = b.createdAt;
        } else if (typeof b.createdAt === 'string') {
          bt = new Date(b.createdAt);
        } else if (b.createdAt && typeof b.createdAt === 'object' && 'toDate' in b.createdAt) {
          // Firestore Timestamp
          bt = (b.createdAt as any).toDate();
        } else {
          bt = new Date(0); // Fallback for missing date
        }
        
        // Newest first (bt - at gives descending order)
        return bt.getTime() - at.getTime();
      });
      
      setBusinesses(data);
      setLoading(false);
      setRefreshing(false);
    });
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'products'), where('ownerId', '==', user.uid));
    return onSnapshot(q, snap => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as Product));
      const toMs = (v: any) => v?.toDate?.()?.getTime?.() ?? (v instanceof Date ? v.getTime() : new Date(v ?? 0).getTime());
      data.sort((a, b) => toMs(b.createdAt) - toMs(a.createdAt));
      setProducts(data);
      setProductsLoading(false);
      setRefreshing(false);
    });
  }, [user]);

  const handleDelete = (b: Business) => {
    Alert.alert(t('Supprimer'), `${t('Supprimer')} "${b.name}" ?`, [
      { text: t('Annuler'), style: 'cancel' },
      {
        text: t('Supprimer'), style: 'destructive',
        onPress: async () => {
          setDeletingId(b.id);
          try { await deleteDoc(doc(db, 'businesses', b.id)); }
          catch { Alert.alert(t('Erreur'), t('Impossible de supprimer.')); }
          finally { setDeletingId(null); }
        },
      },
    ]);
  };

  const handleDeleteProduct = (p: Product) => {
    Alert.alert(t('Supprimer ce produit?'), `${t('Supprimer')} "${p.name}" ?`, [
      { text: t('Annuler'), style: 'cancel' },
      {
        text: t('Supprimer'), style: 'destructive',
        onPress: async () => {
          setDeletingProductId(p.id);
          try { await deleteDoc(doc(db, 'products', p.id)); }
          catch { Alert.alert(t('Erreur'), t('Impossible de supprimer.')); }
          finally { setDeletingProductId(null); }
        },
      },
    ]);
  };

  const handleUnlike = (b: any) => {
    Alert.alert(t('Retirer des favoris?'), `${t('Retirer')} "${b.name}" ${t('de vos favoris?')}`, [
      { text: t('Annuler'), style: 'cancel' },
      { text: t('Retirer'), style: 'destructive', onPress: () => unlike(b.id) },
    ]);
  };

  const StatusBadge = ({ status }: { status: string }) => (
    <View style={[styles.statusBadge, {
      backgroundColor: status === 'approved' ? Colors.primary + '22' : Colors.cta + '22'
    }]}>
      <MaterialIcons
        name={status === 'approved' ? 'check-circle' : 'schedule'}
        size={12}
        color={status === 'approved' ? Colors.primary : Colors.cta}
      />
      <Text style={[styles.statusText, { color: status === 'approved' ? Colors.primary : Colors.cta }]}>
        {status === 'approved' ? t('Publié') : t('En attente')}
      </Text>
    </View>
  );

  const renderBusiness = ({ item }: { item: Business }) => {
    const cat = CATEGORIES.find(c => c.label === item.category);
    return (
      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <TouchableOpacity style={styles.cardInner} onPress={() => router.push(`/business/${item.id}`)} activeOpacity={0.8}>
          {item.coverPhoto
            ? <Image source={{ uri: item.coverPhoto }} style={styles.thumb} resizeMode="cover" />
            : <View style={[styles.thumbPlaceholder, { backgroundColor: (cat?.color || Colors.primary) + '22' }]}>
                <MaterialIcons name={(cat?.icon as any) || 'store'} size={28} color={cat?.color || Colors.primary} />
              </View>
          }
          <View style={styles.cardInfo}>
            <Text style={[styles.cardName, { color: theme.text }]} numberOfLines={1}>{item.name}</Text>
            <View style={styles.metaRow}>
              <MaterialIcons name={(cat?.icon as any) || 'store'} size={12} color={theme.textSecondary} />
              <Text style={[styles.cardMeta, { color: theme.textSecondary }]}>{item.category}</Text>
              <MaterialIcons name="place" size={12} color={theme.textSecondary} />
              <Text style={[styles.cardMeta, { color: theme.textSecondary }]}>{item.city}</Text>
            </View>
            <StatusBadge status={item.status} />
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.editBtn} onPress={() => router.push(`/vendor/edit-business?id=${item.id}`)}>
          <MaterialIcons name="edit" size={18} color={Colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item)} disabled={deletingId === item.id}>
          {deletingId === item.id
            ? <ActivityIndicator size="small" color="#D32F2F" />
            : <MaterialIcons name="delete-outline" size={20} color="#D32F2F" />
          }
        </TouchableOpacity>
      </View>
    );
  };

  const renderProduct = ({ item }: { item: Product }) => {
    const cat = PRODUCT_CATEGORIES.find(c => c.label === item.category);
    const cover = item.photos?.[0] || item.imageUrl;
    return (
      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <TouchableOpacity style={styles.cardInner} onPress={() => router.push(`/product/${item.id}`)} activeOpacity={0.8}>
          {cover
            ? <Image source={{ uri: cover }} style={styles.thumb} resizeMode="cover" />
            : <View style={[styles.thumbPlaceholder, { backgroundColor: (cat?.color || Colors.primary) + '22' }]}>
                <MaterialIcons name={(cat?.icon as any) || 'sell'} size={28} color={cat?.color || Colors.primary} />
              </View>
          }
          <View style={styles.cardInfo}>
            <Text style={[styles.cardName, { color: theme.text }]} numberOfLines={1}>{item.name}</Text>
            <View style={styles.metaRow}>
              <MaterialIcons name={(cat?.icon as any) || 'sell'} size={12} color={theme.textSecondary} />
              <Text style={[styles.cardMeta, { color: theme.textSecondary }]}>{t(item.category)}</Text>
              <MaterialIcons name="place" size={12} color={theme.textSecondary} />
              <Text style={[styles.cardMeta, { color: theme.textSecondary }]}>{item.city}</Text>
            </View>
            <Text style={[styles.cardMeta, { color: Colors.primary, fontWeight: '400' }]}>{item.price.toLocaleString('fr-FR')} FCFA</Text>
            <StatusBadge status={item.status || 'pending'} />
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.editBtn} onPress={() => router.push(`/vendor/edit-product?id=${item.id}`)}>
          <MaterialIcons name="edit" size={18} color={Colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDeleteProduct(item)} disabled={deletingProductId === item.id}>
          {deletingProductId === item.id
            ? <ActivityIndicator size="small" color="#D32F2F" />
            : <MaterialIcons name="delete-outline" size={20} color="#D32F2F" />
          }
        </TouchableOpacity>
      </View>
    );
  };

  const renderLiked = ({ item }: { item: any }) => {
    const cat = CATEGORIES.find(c => c.label === item.category);
    return (
      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <TouchableOpacity style={styles.cardInner} onPress={() => router.push(`/business/${item.id}`)} activeOpacity={0.8}>
          {item.coverPhoto
            ? <Image source={{ uri: item.coverPhoto }} style={styles.thumb} resizeMode="cover" />
            : <View style={[styles.thumbPlaceholder, { backgroundColor: (cat?.color || Colors.primary) + '22' }]}>
                <MaterialIcons name={(cat?.icon as any) || 'store'} size={28} color={cat?.color || Colors.primary} />
              </View>
          }
          <View style={styles.cardInfo}>
            <Text style={[styles.cardName, { color: theme.text }]} numberOfLines={1}>{item.name}</Text>
            <View style={styles.metaRow}>
              <MaterialIcons name={(cat?.icon as any) || 'store'} size={12} color={theme.textSecondary} />
              <Text style={[styles.cardMeta, { color: theme.textSecondary }]}>{item.category}</Text>
              <MaterialIcons name="place" size={12} color={theme.textSecondary} />
              <Text style={[styles.cardMeta, { color: theme.textSecondary }]}>{item.city}</Text>
            </View>
            {item.phone && (
              <View style={styles.metaRow}>
                <MaterialIcons name="call" size={12} color={theme.textSecondary} />
                <Text style={[styles.cardPhone, { color: theme.textSecondary }]}>{item.phone}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteBtn} onPress={() => handleUnlike(item)}>
          <MaterialIcons name="favorite" size={20} color="#E91E63" />
        </TouchableOpacity>
      </View>
    );
  };

  if (!user) return null;

  return (
    <LinearGradient
      colors={(theme.backgroundGradient || [theme.background, theme.background]) as [string, string, ...string[]]}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
      <AppHeader title={t('Mon espace')} />
      {/* PROFILE CARD */}
      <LinearGradient
        colors={Colors.headerGradient}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={styles.profileCard}
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{(userProfile?.name || user.email || 'U')[0].toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.profileName}>{userProfile?.name || t('Utilisateur')}</Text>
          <Text style={styles.profileEmail}>{user.email}</Text>
        </View>
        {isAdmin && (
          <TouchableOpacity style={styles.adminBtn} onPress={() => router.push('/admin')}>
            <MaterialIcons name="admin-panel-settings" size={14} color="#fff" />
            <Text style={styles.adminBtnText}>{t('Admin')}</Text>
          </TouchableOpacity>
        )}
      </LinearGradient>

      {/* STATS */}
      <View style={[styles.statsRow, { backgroundColor: isDark ? '#E8F5E9' : '#E8F5E9' }]}>
        <View style={styles.statItem}>
          <Text style={[styles.statNum, { color: Colors.primary }]}>{businesses.filter(b => b.status === 'approved').length}</Text>
          <Text style={[styles.statLbl, { color: theme.textSecondary }]}>{t('Publiées')}</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
        <View style={styles.statItem}>
          <Text style={[styles.statNum, { color: Colors.cta }]}>{businesses.filter(b => b.status === 'pending').length}</Text>
          <Text style={[styles.statLbl, { color: theme.textSecondary }]}>{t('En attente')}</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
        <View style={styles.statItem}>
          <Text style={[styles.statNum, { color: '#E91E63' }]}>{likedBusinesses.length}</Text>
          <Text style={[styles.statLbl, { color: theme.textSecondary }]}>{t('Favoris')}</Text>
        </View>
      </View>

      {/* ADD BUTTON */}
      {tab !== 'liked' && (
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => router.push(tab === 'products' ? '/vendor/add-product' : '/vendor/add-business')}
          activeOpacity={0.85}
        >
          <Text style={styles.addBtnText}>{t(tab === 'products' ? '+ Vendre un produit' : '+ Référencer mon entreprise')}</Text>
        </TouchableOpacity>
      )}

      {/* TABS */}
      <View style={[styles.tabRow, { borderColor: theme.border }]}>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'businesses' && { borderBottomColor: Colors.primary, borderBottomWidth: 2.5 }]}
          onPress={() => setTab('businesses')}
        >
          <View style={styles.tabInner}>
            <MaterialIcons name="storefront" size={15} color={tab === 'businesses' ? Colors.primary : theme.textSecondary} />
            <Text style={[styles.tabText, { color: tab === 'businesses' ? Colors.primary : theme.textSecondary }]}>
              {t('Mes entreprises')} ({businesses.length})
            </Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'products' && { borderBottomColor: Colors.cta, borderBottomWidth: 2.5 }]}
          onPress={() => setTab('products')}
        >
          <View style={styles.tabInner}>
            <MaterialIcons name="sell" size={15} color={tab === 'products' ? Colors.cta : theme.textSecondary} />
            <Text style={[styles.tabText, { color: tab === 'products' ? Colors.cta : theme.textSecondary }]}>
              {t('Mes produits')} ({products.length})
            </Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'liked' && { borderBottomColor: '#E91E63', borderBottomWidth: 2.5 }]}
          onPress={() => setTab('liked')}
        >
          <View style={styles.tabInner}>
            <MaterialIcons name="favorite" size={15} color={tab === 'liked' ? '#E91E63' : theme.textSecondary} />
            <Text style={[styles.tabText, { color: tab === 'liked' ? '#E91E63' : theme.textSecondary }]}>
              {t('Favoris')} ({likedBusinesses.length})
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* LIST */}
      {(tab === 'businesses' ? loading : tab === 'products' ? productsLoading : likesLoading) ? (
        <View style={styles.loadingBox}><ActivityIndicator color={Colors.primary} /></View>
      ) : (
        <FlatList
          data={(tab === 'businesses' ? businesses : tab === 'products' ? products : likedBusinesses) as any[]}
          keyExtractor={item => item.id}
          renderItem={(tab === 'businesses' ? renderBusiness : tab === 'products' ? renderProduct : renderLiked) as any}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => setRefreshing(true)} tintColor={Colors.primary} colors={[Colors.primary]} />}
          ListEmptyComponent={
            tab === 'businesses' ? (
              <View style={styles.empty}>
                <View style={[styles.emptyIconCircle, { backgroundColor: Colors.primary + '18' }]}>
                  <MaterialIcons name="storefront" size={48} color={Colors.primary} />
                </View>
                <Text style={[styles.emptyTitle, { color: theme.text }]}>{t('Aucune entreprise soumise')}</Text>
                <Text style={[styles.emptySub, { color: theme.textSecondary }]}>{t("Appuyez sur \"Référencer\" pour ajouter votre entreprise à l'annuaire.")}</Text>
              </View>
            ) : tab === 'products' ? (
              <View style={styles.empty}>
                <View style={[styles.emptyIconCircle, { backgroundColor: Colors.cta + '18' }]}>
                  <MaterialIcons name="sell" size={48} color={Colors.cta} />
                </View>
                <Text style={[styles.emptyTitle, { color: theme.text }]}>{t('Aucun produit soumis')}</Text>
                <Text style={[styles.emptySub, { color: theme.textSecondary }]}>{t('Appuyez sur "Vendre un produit" pour le mettre en vente.')}</Text>
              </View>
            ) : (
              <View style={styles.empty}>
                <View style={[styles.emptyIconCircle, { backgroundColor: '#FFEBEE' }]}>
                  <MaterialIcons name="favorite-border" size={48} color="#E53935" />
                </View>
                <Text style={[styles.emptyTitle, { color: theme.text }]}>{t('Aucun favori')}</Text>
                <Text style={[styles.emptySub, { color: theme.textSecondary }]}>{t("Parcourez l'annuaire et appuyez sur le cœur pour sauvegarder des entreprises.")}</Text>
                <TouchableOpacity style={[styles.browseBtn, { backgroundColor: Colors.primary }]} onPress={() => router.push('/annuaire')}>
                  <Text style={styles.browseBtnText}>{t("Voir l'annuaire")}</Text>
                </TouchableOpacity>
              </View>
            )
          }
          ListFooterComponent={
            tab === 'liked' && likedBusinesses.length > 0 ? (
              <TouchableOpacity style={[styles.moreBtn, { borderColor: Colors.primary }]} onPress={() => router.push('/annuaire')}>
                <MaterialIcons name="search" size={16} color={Colors.primary} />
                <Text style={[styles.moreBtnText, { color: Colors.primary }]}>{t("Voir plus d'entreprises")}</Text>
              </TouchableOpacity>
            ) : null
          }
        />
      )}

    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 , maxWidth: 900, alignSelf: 'center', width: '100%' },
  profileCard: { flexDirection: 'row', alignItems: 'center', padding: 18, gap: 14, margin: 16, borderRadius: 10, elevation: 6, shadowColor: Colors.headerGradient[0], shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 10 },
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)' },
  avatarText: { fontSize: 22, fontWeight: '400', color: '#fff' },
  profileName: { fontSize: 16, fontWeight: '400', color: '#fff' },
  profileEmail: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 1 },
  adminBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(249,168,37,0.3)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 4 },
  adminBtnText: { color: '#fff', fontWeight: '400', fontSize: 11 },
  statsRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, marginHorizontal: 16, marginTop: 12, borderRadius: 7, paddingHorizontal: 16 },
  statItem: { flex: 1, alignItems: 'center' },
  statNum: { fontSize: 20, fontWeight: '400' },
  statLbl: { fontSize: 11, marginTop: 2 },
  statDivider: { width: 1, height: 28, opacity: 0.4 },
  addBtn: { backgroundColor: Colors.cta, marginHorizontal: 16, marginTop: 14, paddingVertical: 15, borderRadius: 7, alignItems: 'center', elevation: 2, shadowColor: Colors.cta, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.35, shadowRadius: 6 },
  addBtnText: { fontSize: 16, fontWeight: '400', color: '#1A1A1A' },
  tabRow: { flexDirection: 'row', marginTop: 14, borderBottomWidth: 1 },
  tabBtn: { flex: 1, alignItems: 'center', paddingVertical: 12 },
  tabInner: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  tabText: { fontSize: 13, fontWeight: '400' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'wrap' },
  listContent: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 24 },
  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  card: { flexDirection: 'row', borderRadius: 7, borderWidth: 1, marginBottom: 10, overflow: 'hidden', elevation: 1 },
  cardInner: { flex: 1, flexDirection: 'row' },
  thumb: { width: 80, height: 80 },
  thumbPlaceholder: { width: 80, height: 80, alignItems: 'center', justifyContent: 'center' },
  cardInfo: { flex: 1, padding: 10, gap: 4, justifyContent: 'center' },
  cardName: { fontSize: 14, fontWeight: '400' },
  cardMeta: { fontSize: 12 },
  cardPhone: { fontSize: 11 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', borderRadius: 4, paddingHorizontal: 7, paddingVertical: 2 },
  statusText: { fontSize: 11, fontWeight: '400' },
  editBtn: { padding: 8, alignItems: 'center', justifyContent: 'center', width: 40 },
  deleteBtn: { padding: 8, alignItems: 'center', justifyContent: 'center', width: 46 },
  empty: { alignItems: 'center', paddingTop: 48, gap: 12, paddingHorizontal: 24 },
  emptyIconCircle: { width: 88, height: 88, borderRadius: 44, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  emptyTitle: { fontSize: 17, fontWeight: '400', textAlign: 'center' },
  emptySub: { fontSize: 13, textAlign: 'center', lineHeight: 19 },
  browseBtn: { marginTop: 8, paddingVertical: 14, paddingHorizontal: 28, borderRadius: 7 },
  browseBtnText: { color: '#fff', fontSize: 15, fontWeight: '400' },
  moreBtn: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginHorizontal: 16, marginTop: 4, marginBottom: 8, paddingVertical: 14, borderRadius: 7, borderWidth: 2, alignItems: 'center' },
  moreBtnText: { fontSize: 15, fontWeight: '400' },
  homeBtn: { paddingHorizontal: 8, paddingVertical: 4 },
  homeBtnText: { fontSize: 22 },
});
