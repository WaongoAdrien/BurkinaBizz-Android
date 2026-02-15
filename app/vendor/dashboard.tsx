// app/vendor/dashboard.tsx

import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Alert, Image, ActivityIndicator, RefreshControl, SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { collection, query, where, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../lib/AuthContext';
import { useLikes } from '../../hooks/useLikes';
import { Business } from '../../types';
import { Colors, CATEGORIES } from '../../constants';
import { useColorTheme } from '../../hooks/useColorTheme';

type Tab = 'businesses' | 'liked';

export default function VendorDashboardScreen() {
  const router = useRouter();
  const { user, userProfile, signOut, isAdmin, isPending } = useAuth();
  const { theme, isDark } = useColorTheme();
  const { likedProducts: likedBusinesses, unlike, loading: likesLoading } = useLikes(user?.uid);

  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('businesses');

  useEffect(() => {
    if (!user) { router.replace('/auth'); return; }
    if (isPending) { router.replace('/vendor/pending'); return; }
  }, [user, isPending]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'businesses'), where('ownerId', '==', user.uid));
    return onSnapshot(q, snap => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as Business));
      data.sort((a, b) => {
        const at = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt as string);
        const bt = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt as string);
        return bt.getTime() - at.getTime();
      });
      setBusinesses(data);
      setLoading(false);
      setRefreshing(false);
    });
  }, [user]);

  const handleDelete = (b: Business) => {
    Alert.alert('Supprimer', `Supprimer "${b.name}" ?`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer', style: 'destructive',
        onPress: async () => {
          setDeletingId(b.id);
          try { await deleteDoc(doc(db, 'businesses', b.id)); }
          catch { Alert.alert('Erreur', 'Impossible de supprimer.'); }
          finally { setDeletingId(null); }
        },
      },
    ]);
  };

  const handleUnlike = (b: any) => {
    Alert.alert('Retirer des favoris?', `Retirer "${b.name}" de vos favoris?`, [
      { text: 'Annuler', style: 'cancel' },
      { text: '💔 Retirer', style: 'destructive', onPress: () => unlike(b.id) },
    ]);
  };

  const handleSignOut = () => {
    Alert.alert('Déconnexion', 'Voulez-vous vraiment vous déconnecter?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Déconnecter', style: 'destructive', onPress: async () => { await signOut(); router.replace('/'); } },
    ]);
  };

  const StatusBadge = ({ status }: { status: string }) => (
    <View style={[styles.statusBadge, {
      backgroundColor: status === 'approved' ? Colors.primary + '22' : Colors.cta + '22'
    }]}>
      <Text style={[styles.statusText, { color: status === 'approved' ? Colors.primary : Colors.cta }]}>
        {status === 'approved' ? '✓ Publié' : '⏳ En attente'}
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
                <Text style={{ fontSize: 24 }}>{cat?.icon || '🏢'}</Text>
              </View>
          }
          <View style={styles.cardInfo}>
            <Text style={[styles.cardName, { color: theme.text }]} numberOfLines={1}>{item.name}</Text>
            <Text style={[styles.cardMeta, { color: theme.textSecondary }]}>
              {cat?.icon} {item.category} • 📍 {item.city}
            </Text>
            <StatusBadge status={item.status} />
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item)} disabled={deletingId === item.id}>
          {deletingId === item.id
            ? <ActivityIndicator size="small" color="#D32F2F" />
            : <Text style={{ fontSize: 18 }}>🗑️</Text>
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
                <Text style={{ fontSize: 24 }}>{cat?.icon || '🏢'}</Text>
              </View>
          }
          <View style={styles.cardInfo}>
            <Text style={[styles.cardName, { color: theme.text }]} numberOfLines={1}>{item.name}</Text>
            <Text style={[styles.cardMeta, { color: theme.textSecondary }]}>
              {cat?.icon} {item.category} • 📍 {item.city}
            </Text>
            {item.phone && <Text style={[styles.cardPhone, { color: theme.textSecondary }]}>📞 {item.phone}</Text>}
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteBtn} onPress={() => handleUnlike(item)}>
          <Text style={{ fontSize: 18 }}>💔</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (!user) return null;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      {/* PROFILE CARD */}
      <View style={[styles.profileCard, { backgroundColor: Colors.primary }]}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{(userProfile?.name || user.email || 'U')[0].toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.profileName}>{userProfile?.name || 'Utilisateur'}</Text>
          <Text style={styles.profileEmail}>{user.email}</Text>
        </View>
        <View style={styles.headerActions}>
          {isAdmin && (
            <TouchableOpacity style={styles.adminBtn} onPress={() => router.push('/admin')}>
              <Text style={styles.adminBtnText}>🛡️ Admin</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.logoutBtn} onPress={handleSignOut}>
            <Text style={styles.logoutText}>Déconnexion</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* STATS */}
      <View style={[styles.statsRow, { backgroundColor: isDark ? '#1a2e1a' : '#E8F5E9' }]}>
        <View style={styles.statItem}>
          <Text style={[styles.statNum, { color: Colors.primary }]}>{businesses.filter(b => b.status === 'approved').length}</Text>
          <Text style={[styles.statLbl, { color: theme.textSecondary }]}>Publiées</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
        <View style={styles.statItem}>
          <Text style={[styles.statNum, { color: Colors.cta }]}>{businesses.filter(b => b.status === 'pending').length}</Text>
          <Text style={[styles.statLbl, { color: theme.textSecondary }]}>En attente</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
        <View style={styles.statItem}>
          <Text style={[styles.statNum, { color: '#E91E63' }]}>{likedBusinesses.length}</Text>
          <Text style={[styles.statLbl, { color: theme.textSecondary }]}>Favoris</Text>
        </View>
      </View>

      {/* ADD BUTTON */}
      <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/vendor/add-business')} activeOpacity={0.85}>
        <Text style={styles.addBtnText}>+ Référencer mon entreprise</Text>
      </TouchableOpacity>

      {/* TABS */}
      <View style={[styles.tabRow, { borderColor: theme.border }]}>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'businesses' && { borderBottomColor: Colors.primary, borderBottomWidth: 2.5 }]}
          onPress={() => setTab('businesses')}
        >
          <Text style={[styles.tabText, { color: tab === 'businesses' ? Colors.primary : theme.textSecondary }]}>
            🏪 Mes entreprises ({businesses.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'liked' && { borderBottomColor: '#E91E63', borderBottomWidth: 2.5 }]}
          onPress={() => setTab('liked')}
        >
          <Text style={[styles.tabText, { color: tab === 'liked' ? '#E91E63' : theme.textSecondary }]}>
            ❤️ Favoris ({likedBusinesses.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* LIST */}
      {(tab === 'businesses' ? loading : likesLoading) ? (
        <View style={styles.loadingBox}><ActivityIndicator color={Colors.primary} /></View>
      ) : (
        <FlatList
          data={tab === 'businesses' ? businesses : likedBusinesses}
          keyExtractor={item => item.id}
          renderItem={tab === 'businesses' ? renderBusiness : renderLiked}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => setRefreshing(true)} tintColor={Colors.primary} colors={[Colors.primary]} />}
          ListEmptyComponent={
            tab === 'businesses' ? (
              <View style={styles.empty}>
                <Text style={{ fontSize: 48 }}>🏪</Text>
                <Text style={[styles.emptyTitle, { color: theme.text }]}>Aucune entreprise soumise</Text>
                <Text style={[styles.emptySub, { color: theme.textSecondary }]}>Appuyez sur "Référencer" pour ajouter votre entreprise à l'annuaire.</Text>
              </View>
            ) : (
              <View style={styles.empty}>
                <Text style={{ fontSize: 48 }}>🤍</Text>
                <Text style={[styles.emptyTitle, { color: theme.text }]}>Aucun favori</Text>
                <Text style={[styles.emptySub, { color: theme.textSecondary }]}>Parcourez l'annuaire et appuyez sur ❤️ pour sauvegarder des entreprises.</Text>
                <TouchableOpacity style={[styles.browseBtn, { backgroundColor: Colors.primary }]} onPress={() => router.push('/annuaire')}>
                  <Text style={styles.browseBtnText}>🔍 Voir l'annuaire</Text>
                </TouchableOpacity>
              </View>
            )
          }
          ListFooterComponent={
            tab === 'liked' && likedBusinesses.length > 0 ? (
              <TouchableOpacity style={[styles.moreBtn, { borderColor: Colors.primary }]} onPress={() => router.push('/annuaire')}>
                <Text style={[styles.moreBtnText, { color: Colors.primary }]}>🔍 Voir plus d'entreprises</Text>
              </TouchableOpacity>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  profileCard: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 22, fontWeight: '800', color: '#fff' },
  profileName: { fontSize: 16, fontWeight: '800', color: '#fff' },
  profileEmail: { fontSize: 12, color: '#A5D6A7', marginTop: 1 },
  headerActions: { gap: 6, alignItems: 'flex-end' },
  adminBtn: { backgroundColor: 'rgba(249,168,37,0.3)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 7 },
  adminBtnText: { color: '#fff', fontWeight: '800', fontSize: 11 },
  logoutBtn: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8 },
  logoutText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  statsRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, marginHorizontal: 16, marginTop: 12, borderRadius: 12, paddingHorizontal: 16 },
  statItem: { flex: 1, alignItems: 'center' },
  statNum: { fontSize: 20, fontWeight: '800' },
  statLbl: { fontSize: 11, marginTop: 2 },
  statDivider: { width: 1, height: 28, opacity: 0.4 },
  addBtn: { backgroundColor: Colors.cta, marginHorizontal: 16, marginTop: 14, paddingVertical: 15, borderRadius: 12, alignItems: 'center', elevation: 2, shadowColor: Colors.cta, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.35, shadowRadius: 6 },
  addBtnText: { fontSize: 16, fontWeight: '800', color: '#1A1A1A' },
  tabRow: { flexDirection: 'row', marginTop: 14, borderBottomWidth: 1 },
  tabBtn: { flex: 1, alignItems: 'center', paddingVertical: 12 },
  tabText: { fontSize: 13, fontWeight: '700' },
  listContent: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 24 },
  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  card: { flexDirection: 'row', borderRadius: 12, borderWidth: 1, marginBottom: 10, overflow: 'hidden', elevation: 1 },
  cardInner: { flex: 1, flexDirection: 'row' },
  thumb: { width: 80, height: 80 },
  thumbPlaceholder: { width: 80, height: 80, alignItems: 'center', justifyContent: 'center' },
  cardInfo: { flex: 1, padding: 10, gap: 4, justifyContent: 'center' },
  cardName: { fontSize: 14, fontWeight: '700' },
  cardMeta: { fontSize: 12 },
  cardPhone: { fontSize: 11 },
  statusBadge: { alignSelf: 'flex-start', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  statusText: { fontSize: 11, fontWeight: '700' },
  deleteBtn: { padding: 12, alignItems: 'center', justifyContent: 'center', width: 46 },
  empty: { alignItems: 'center', paddingTop: 48, gap: 10, paddingHorizontal: 24 },
  emptyTitle: { fontSize: 17, fontWeight: '700', textAlign: 'center' },
  emptySub: { fontSize: 13, textAlign: 'center', lineHeight: 19 },
  browseBtn: { marginTop: 8, paddingVertical: 14, paddingHorizontal: 28, borderRadius: 12 },
  browseBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  moreBtn: { marginHorizontal: 16, marginTop: 4, marginBottom: 8, paddingVertical: 14, borderRadius: 12, borderWidth: 2, alignItems: 'center' },
  moreBtnText: { fontSize: 15, fontWeight: '800' },
});
