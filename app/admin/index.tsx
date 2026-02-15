// app/admin/index.tsx — Admin Panel

import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator,
  SafeAreaView, RefreshControl, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  collection, query, where, onSnapshot,
  doc, updateDoc, deleteDoc,
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../lib/AuthContext';
import { Colors } from '../../constants';
import { useColorTheme } from '../../hooks/useColorTheme';

type Tab = 'businesses' | 'users';

export default function AdminScreen() {
  const router = useRouter();
  const { user, isAdmin, signOut } = useAuth();
  const { theme } = useColorTheme();

  const [tab, setTab] = useState<Tab>('businesses');

  // Businesses
  const [pendingBiz, setPendingBiz] = useState<any[]>([]);
  const [approvedBiz, setApprovedBiz] = useState<any[]>([]);

  // Users
  const [pendingUsers, setPendingUsers] = useState<any[]>([]);
  const [approvedUsers, setApprovedUsers] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [bizTab, setBizTab] = useState<'pending' | 'approved'>('pending');
  const [userTab, setUserTab] = useState<'pending' | 'approved'>('pending');

  useEffect(() => {
    if (!user) { router.replace('/auth'); return; }
    if (!isAdmin) { router.replace('/'); }
  }, [user, isAdmin]);

  useEffect(() => {
    if (!isAdmin) return;

    const sort = (a: any, b: any) => {
      const at = a.createdAt?.toDate?.() ?? new Date(a.createdAt ?? 0);
      const bt = b.createdAt?.toDate?.() ?? new Date(b.createdAt ?? 0);
      return bt.getTime() - at.getTime();
    };

    // ── Businesses ──────────────────────────────────────────────────────
    const u1 = onSnapshot(
      query(collection(db, 'businesses'), where('status', '==', 'pending')),
      snap => { setPendingBiz(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort(sort)); setLoading(false); setRefreshing(false); }
    );
    const u2 = onSnapshot(
      query(collection(db, 'businesses'), where('status', '==', 'approved')),
      snap => { setApprovedBiz(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort(sort)); }
    );

    // ── Users ────────────────────────────────────────────────────────────
    const u3 = onSnapshot(
      query(collection(db, 'users'), where('role', '==', 'pending')),
      snap => { setPendingUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort(sort)); }
    );
    const u4 = onSnapshot(
      query(collection(db, 'users'), where('role', '==', 'vendor')),
      snap => { setApprovedUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort(sort)); }
    );

    return () => { u1(); u2(); u3(); u4(); };
  }, [isAdmin]);

  // ── Business actions ────────────────────────────────────────────────────
  const approveBusiness = (item: any) => {
    Alert.alert('Approuver cette entreprise?', `"${item.name}" apparaîtra dans l'annuaire.`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: '✅ Approuver', onPress: async () => {
          setActionId(item.id);
          try {
            await updateDoc(doc(db, 'businesses', item.id), { status: 'approved' });
          } catch (e: any) {
            Alert.alert('Erreur', e?.message || 'Impossible d\'approuver.');
          } finally { setActionId(null); }
        },
      },
    ]);
  };

  const rejectBusiness = (item: any) => {
    Alert.alert('Rejeter cette entreprise?', `"${item.name}" sera supprimée définitivement.`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: '🗑️ Rejeter', style: 'destructive', onPress: async () => {
          setActionId(item.id);
          try {
            await deleteDoc(doc(db, 'businesses', item.id));
          } catch (e: any) {
            Alert.alert('Erreur', e?.message || 'Impossible de rejeter.');
          } finally { setActionId(null); }
        },
      },
    ]);
  };

  const revokeBusiness = (item: any) => {
    Alert.alert('Retirer de l\'annuaire?', `"${item.name}" ne sera plus visible.`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: '⛔ Retirer', style: 'destructive', onPress: async () => {
          setActionId(item.id);
          try {
            await updateDoc(doc(db, 'businesses', item.id), { status: 'pending' });
          } catch (e: any) {
            Alert.alert('Erreur', e?.message || 'Impossible.');
          } finally { setActionId(null); }
        },
      },
    ]);
  };

  // ── User actions ────────────────────────────────────────────────────────
  const approveUser = (item: any) => {
    Alert.alert('Approuver ce vendeur?', `${item.name} pourra soumettre des entreprises.`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: '✅ Approuver', onPress: async () => {
          setActionId(item.id);
          try {
            await updateDoc(doc(db, 'users', item.id), { role: 'vendor' });
          } catch (e: any) {
            Alert.alert('Erreur', e?.message || 'Impossible d\'approuver.');
          } finally { setActionId(null); }
        },
      },
    ]);
  };

  const rejectUser = (item: any) => {
    Alert.alert('Rejeter ce vendeur?', `Le compte de ${item.name} sera supprimé.`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: '🗑️ Rejeter', style: 'destructive', onPress: async () => {
          setActionId(item.id);
          try {
            await deleteDoc(doc(db, 'users', item.id));
          } catch (e: any) {
            Alert.alert('Erreur', e?.message || 'Impossible de rejeter.');
          } finally { setActionId(null); }
        },
      },
    ]);
  };

  const revokeUser = (item: any) => {
    Alert.alert('Révoquer ce vendeur?', `${item.name} repassera en "En attente".`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: '⛔ Révoquer', style: 'destructive', onPress: async () => {
          setActionId(item.id);
          try {
            await updateDoc(doc(db, 'users', item.id), { role: 'pending' });
          } catch (e: any) {
            Alert.alert('Erreur', e?.message || 'Impossible.');
          } finally { setActionId(null); }
        },
      },
    ]);
  };

  // ── RENDER CARDS ────────────────────────────────────────────────────────
  const renderPendingBusiness = ({ item }: { item: any }) => (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={styles.cardTop}>
        <View style={[styles.avatar, { backgroundColor: Colors.cta + '33' }]}>
          <Text style={styles.avatarText}>{(item.name || '?')[0].toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.name, { color: theme.text }]}>{item.name}</Text>
          <Text style={[styles.meta, { color: theme.textSecondary }]}>{item.category} • 📍 {item.city}</Text>
          <Text style={[styles.meta, { color: theme.textSecondary }]}>👤 {item.ownerName}</Text>
          <Text style={[styles.meta, { color: theme.textSecondary }]}>📱 {item.phone}</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: Colors.cta + '22' }]}>
          <Text style={[styles.badgeText, { color: Colors.cta }]}>En attente</Text>
        </View>
      </View>
      {item.description ? (
        <Text style={[styles.desc, { color: theme.textSecondary }]} numberOfLines={2}>{item.description}</Text>
      ) : null}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[styles.rejectBtn]}
          onPress={() => rejectBusiness(item)}
          disabled={actionId === item.id}
        >
          {actionId === item.id
            ? <ActivityIndicator size="small" color="#D32F2F" />
            : <Text style={styles.rejectText}>✕ Rejeter</Text>
          }
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.approveBtn}
          onPress={() => approveBusiness(item)}
          disabled={actionId === item.id}
        >
          {actionId === item.id
            ? <ActivityIndicator size="small" color="#fff" />
            : <Text style={styles.approveText}>✓ Approuver</Text>
          }
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderApprovedBusiness = ({ item }: { item: any }) => (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={styles.cardTop}>
        <View style={[styles.avatar, { backgroundColor: Colors.primary + '33' }]}>
          <Text style={styles.avatarText}>{(item.name || '?')[0].toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.name, { color: theme.text }]}>{item.name}</Text>
          <Text style={[styles.meta, { color: theme.textSecondary }]}>{item.category} • 📍 {item.city}</Text>
          <Text style={[styles.meta, { color: theme.textSecondary }]}>👤 {item.ownerName}</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: Colors.primary + '22' }]}>
          <Text style={[styles.badgeText, { color: Colors.primary }]}>✓ Publié</Text>
        </View>
      </View>
      <TouchableOpacity
        style={[styles.revokeBtn, { borderColor: theme.border }]}
        onPress={() => revokeBusiness(item)}
        disabled={actionId === item.id}
      >
        {actionId === item.id
          ? <ActivityIndicator size="small" color={theme.textSecondary} />
          : <Text style={[styles.revokeText, { color: theme.textSecondary }]}>⛔ Retirer de l'annuaire</Text>
        }
      </TouchableOpacity>
    </View>
  );

  const renderPendingUser = ({ item }: { item: any }) => (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={styles.cardTop}>
        <View style={[styles.avatar, { backgroundColor: Colors.cta + '33' }]}>
          <Text style={styles.avatarText}>{(item.name || '?')[0].toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.name, { color: theme.text }]}>{item.name}</Text>
          <Text style={[styles.meta, { color: theme.textSecondary }]}>✉️ {item.email}</Text>
          {item.phone && <Text style={[styles.meta, { color: theme.textSecondary }]}>📱 {item.phone}</Text>}
          {item.createdAt && (
            <Text style={[styles.meta, { color: theme.textSecondary }]}>
              🗓 {(item.createdAt?.toDate?.() ?? new Date(item.createdAt)).toLocaleDateString('fr-FR')}
            </Text>
          )}
        </View>
        <View style={[styles.badge, { backgroundColor: Colors.cta + '22' }]}>
          <Text style={[styles.badgeText, { color: Colors.cta }]}>En attente</Text>
        </View>
      </View>
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={styles.rejectBtn}
          onPress={() => rejectUser(item)}
          disabled={actionId === item.id}
        >
          {actionId === item.id
            ? <ActivityIndicator size="small" color="#D32F2F" />
            : <Text style={styles.rejectText}>✕ Rejeter</Text>
          }
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.approveBtn}
          onPress={() => approveUser(item)}
          disabled={actionId === item.id}
        >
          {actionId === item.id
            ? <ActivityIndicator size="small" color="#fff" />
            : <Text style={styles.approveText}>✓ Approuver</Text>
          }
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderApprovedUser = ({ item }: { item: any }) => (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={styles.cardTop}>
        <View style={[styles.avatar, { backgroundColor: Colors.primary + '33' }]}>
          <Text style={styles.avatarText}>{(item.name || '?')[0].toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.name, { color: theme.text }]}>{item.name}</Text>
          <Text style={[styles.meta, { color: theme.textSecondary }]}>✉️ {item.email}</Text>
          {item.phone && <Text style={[styles.meta, { color: theme.textSecondary }]}>📱 {item.phone}</Text>}
        </View>
        <View style={[styles.badge, { backgroundColor: Colors.primary + '22' }]}>
          <Text style={[styles.badgeText, { color: Colors.primary }]}>✓ Vendeur</Text>
        </View>
      </View>
      <TouchableOpacity
        style={[styles.revokeBtn, { borderColor: theme.border }]}
        onPress={() => revokeUser(item)}
        disabled={actionId === item.id}
      >
        {actionId === item.id
          ? <ActivityIndicator size="small" color={theme.textSecondary} />
          : <Text style={[styles.revokeText, { color: theme.textSecondary }]}>⛔ Révoquer le vendeur</Text>
        }
      </TouchableOpacity>
    </View>
  );

  if (!isAdmin) return null;

  const totalPending = pendingBiz.length + pendingUsers.length;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>

      {/* HEADER */}
      <View style={[styles.header, { backgroundColor: Colors.primary }]}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>🛡️ Admin Panel</Text>
            <Text style={styles.headerSub}>BurkinaBizz</Text>
          </View>
          <TouchableOpacity style={styles.signOutBtn} onPress={async () => { await signOut(); router.replace('/'); }}>
            <Text style={styles.signOutText}>Déconnexion</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNum}>{pendingBiz.length}</Text>
            <Text style={styles.statLbl}>Entreprises en attente</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNum}>{pendingUsers.length}</Text>
            <Text style={styles.statLbl}>Vendeurs en attente</Text>
          </View>
        </View>
      </View>

      {/* MAIN TABS */}
      <View style={[styles.mainTabRow, { borderColor: theme.border }]}>
        <TouchableOpacity
          style={[styles.mainTabBtn, tab === 'businesses' && { borderBottomColor: Colors.primary, borderBottomWidth: 2.5 }]}
          onPress={() => setTab('businesses')}
        >
          <Text style={[styles.mainTabText, { color: tab === 'businesses' ? Colors.primary : theme.textSecondary }]}>
            🏪 Entreprises {pendingBiz.length > 0 ? `(${pendingBiz.length})` : ''}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.mainTabBtn, tab === 'users' && { borderBottomColor: Colors.cta, borderBottomWidth: 2.5 }]}
          onPress={() => setTab('users')}
        >
          <Text style={[styles.mainTabText, { color: tab === 'users' ? Colors.cta : theme.textSecondary }]}>
            👥 Vendeurs {pendingUsers.length > 0 ? `(${pendingUsers.length})` : ''}
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={Colors.primary} size="large" />
          <Text style={[{ color: theme.textSecondary, marginTop: 8 }]}>Chargement...</Text>
        </View>
      ) : tab === 'businesses' ? (
        <>
          {/* Business sub-tabs */}
          <View style={[styles.subTabRow, { backgroundColor: theme.surface }]}>
            {(['pending', 'approved'] as const).map(t => (
              <TouchableOpacity
                key={t}
                style={[styles.subTabBtn, bizTab === t && { backgroundColor: Colors.primary }]}
                onPress={() => setBizTab(t)}
              >
                <Text style={[styles.subTabText, { color: bizTab === t ? '#fff' : theme.textSecondary }]}>
                  {t === 'pending' ? `En attente (${pendingBiz.length})` : `Publiées (${approvedBiz.length})`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <FlatList
            data={bizTab === 'pending' ? pendingBiz : approvedBiz}
            keyExtractor={item => item.id}
            renderItem={bizTab === 'pending' ? renderPendingBusiness : renderApprovedBusiness}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => setRefreshing(true)} tintColor={Colors.primary} colors={[Colors.primary]} />}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={{ fontSize: 48 }}>{bizTab === 'pending' ? '🎉' : '🏪'}</Text>
                <Text style={[styles.emptyText, { color: theme.text }]}>
                  {bizTab === 'pending' ? 'Aucune entreprise en attente' : 'Aucune entreprise publiée'}
                </Text>
              </View>
            }
          />
        </>
      ) : (
        <>
          {/* User sub-tabs */}
          <View style={[styles.subTabRow, { backgroundColor: theme.surface }]}>
            {(['pending', 'approved'] as const).map(t => (
              <TouchableOpacity
                key={t}
                style={[styles.subTabBtn, userTab === t && { backgroundColor: Colors.primary }]}
                onPress={() => setUserTab(t)}
              >
                <Text style={[styles.subTabText, { color: userTab === t ? '#fff' : theme.textSecondary }]}>
                  {t === 'pending' ? `En attente (${pendingUsers.length})` : `Approuvés (${approvedUsers.length})`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <FlatList
            data={userTab === 'pending' ? pendingUsers : approvedUsers}
            keyExtractor={item => item.id}
            renderItem={userTab === 'pending' ? renderPendingUser : renderApprovedUser}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => setRefreshing(true)} tintColor={Colors.primary} colors={[Colors.primary]} />}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={{ fontSize: 48 }}>{userTab === 'pending' ? '🎉' : '👥'}</Text>
                <Text style={[styles.emptyText, { color: theme.text }]}>
                  {userTab === 'pending' ? 'Aucun vendeur en attente' : 'Aucun vendeur approuvé'}
                </Text>
              </View>
            }
          />
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#fff' },
  headerSub: { fontSize: 12, color: '#A5D6A7', marginTop: 1 },
  signOutBtn: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8 },
  signOutText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  statsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 32 },
  statItem: { alignItems: 'center' },
  statNum: { fontSize: 26, fontWeight: '900', color: '#fff' },
  statLbl: { fontSize: 11, color: '#A5D6A7', marginTop: 1 },
  statDivider: { width: 1, height: 32, backgroundColor: 'rgba(255,255,255,0.3)' },
  mainTabRow: { flexDirection: 'row', borderBottomWidth: 1 },
  mainTabBtn: { flex: 1, alignItems: 'center', paddingVertical: 13 },
  mainTabText: { fontSize: 14, fontWeight: '700' },
  subTabRow: { flexDirection: 'row', margin: 12, borderRadius: 10, padding: 4, gap: 4 },
  subTabBtn: { flex: 1, paddingVertical: 8, borderRadius: 7, alignItems: 'center' },
  subTabText: { fontSize: 13, fontWeight: '600' },
  listContent: { padding: 16 },
  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  card: { borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 12, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3 },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 10 },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  avatarText: { fontSize: 18, fontWeight: '800' },
  name: { fontSize: 15, fontWeight: '700' },
  meta: { fontSize: 12, marginTop: 2 },
  desc: { fontSize: 12, lineHeight: 17, marginBottom: 10 },
  badge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start' },
  badgeText: { fontSize: 11, fontWeight: '700' },
  actionRow: { flexDirection: 'row', gap: 10 },
  rejectBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1.5, borderColor: '#D32F2F', alignItems: 'center' },
  rejectText: { color: '#D32F2F', fontWeight: '700', fontSize: 14 },
  approveBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: Colors.primary, alignItems: 'center' },
  approveText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  revokeBtn: { paddingVertical: 10, borderRadius: 10, borderWidth: 1, alignItems: 'center' },
  revokeText: { fontWeight: '600', fontSize: 13 },
  empty: { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyText: { fontSize: 16, fontWeight: '700' },
});