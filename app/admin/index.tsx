// app/admin/index.tsx — Admin Panel

import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, TextInput,
  StyleSheet, Alert, ActivityIndicator, Modal,
  SafeAreaView, RefreshControl, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import {
  collection, query, where, onSnapshot,
  doc, updateDoc, deleteDoc,
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../lib/AuthContext';
import { Colors } from '../../constants';
import { useColorTheme } from '../../hooks/useColorTheme';

type Tab = 'businesses' | 'users' | 'reports';

// ── Duplicate detection ─────────────────────────────────────────────────────
const normStr = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim();

const diceSimilarity = (a: string, b: string): number => {
  const na = normStr(a), nb = normStr(b);
  if (na.length < 3 || nb.length < 3) return na === nb ? 1 : 0;
  const tris = (s: string) => new Set(Array.from({ length: s.length - 2 }, (_, i) => s.slice(i, i + 3)));
  const ta = tris(na), tb = tris(nb);
  let overlap = 0;
  ta.forEach(t => { if (tb.has(t)) overlap++; });
  return (2 * overlap) / (ta.size + tb.size);
};

const levenshtein = (a: string, b: string): number => {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
  return dp[m][n];
};

const wordOverlapScore = (a: string, b: string): number => {
  const wa = normStr(a).split(' ').filter(w => w.length > 2);
  const wb = normStr(b).split(' ').filter(w => w.length > 2);
  if (!wa.length || !wb.length) return 0;
  const scores = wa.map(w => Math.max(...wb.map(ww => 1 - levenshtein(w, ww) / Math.max(w.length, ww.length))));
  return scores.reduce((s, v) => s + v, 0) / scores.length;
};

const DUPE_THRESHOLD = 0.8;
const WORD_OVERLAP_THRESHOLD = 0.75;
const isSameIgnoringSpacesAndPunct = (a: string, b: string) =>
  a.toLowerCase().replace(/[\s.,\-']/g, '') === b.toLowerCase().replace(/[\s.,\-']/g, '');
// ───────────────────────────────────────────────────────────────────────────

export default function AdminScreen() {
  const router = useRouter();
  const { user, isAdmin, loading: authLoading } = useAuth();
  const { theme } = useColorTheme();

  const [tab, setTab] = useState<Tab>('businesses');

  // Businesses
  const [pendingBiz, setPendingBiz] = useState<any[]>([]);
  const [approvedBiz, setApprovedBiz] = useState<any[]>([]);

  // Users
  const [pendingUsers, setPendingUsers] = useState<any[]>([]);
  const [approvedUsers, setApprovedUsers] = useState<any[]>([]);

  // Reports
  const [reports, setReports] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [bizTab, setBizTab] = useState<'pending' | 'approved'>('pending');
  const [userTab, setUserTab] = useState<'pending' | 'approved'>('pending');
  
  // Search
  const [bizSearch, setBizSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');

  // Priority modal
  const [priorityModal, setPriorityModal] = useState<{ visible: boolean; item: any | null; value: string }>({ visible: false, item: null, value: '' });

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.replace('/auth'); return; }
    if (!isAdmin) { router.replace('/'); }
  }, [user, isAdmin, authLoading]);

  if (authLoading) return <ActivityIndicator style={{ flex: 1 }} color={Colors.primary} size="large" />;

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

    // ── Reports ──────────────────────────────────────────────────────────
    const u5 = onSnapshot(
      query(collection(db, 'reports'), where('status', '==', 'pending')),
      snap => { setReports(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort(sort)); }
    );

    return () => { u1(); u2(); u3(); u4(); u5(); };
  }, [isAdmin]);

  // ── Business actions ────────────────────────────────────────────────────
  const approveBusiness = (item: any) => {
    const dupes = approvedBiz
      .filter(b => b.id !== item.id && b.city === item.city)
      .map(b => ({ ...b, _exact: isSameIgnoringSpacesAndPunct(b.name, item.name), _score: diceSimilarity(b.name, item.name), _wordScore: wordOverlapScore(b.name, item.name) }))
      .filter(b => b._exact || b._score >= DUPE_THRESHOLD || b._wordScore >= WORD_OVERLAP_THRESHOLD);
    const dupeNote = dupes.length > 0
      ? `\n\n⚠️ Doublon avec : ${dupes.map(b => `"${b.name}"${b._exact ? ' (identique)' : b._score >= DUPE_THRESHOLD ? ' (très similaire)' : ' (faute probable)'}`).join(', ')}`
      : '';
    Alert.alert(
      dupes.length > 0 ? '⚠️ Doublon détecté' : 'Approuver cette entreprise?',
      `"${item.name}" apparaîtra dans l'annuaire.${dupeNote}`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: '✅ Approuver quand même', onPress: async () => {
            setActionId(item.id);
            try {
              await updateDoc(doc(db, 'businesses', item.id), { status: 'approved' });
            } catch (e: any) {
              Alert.alert('Erreur', e?.message || 'Impossible d\'approuver.');
            } finally { setActionId(null); }
          },
        },
      ]
    );
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
  const renderPendingBusiness = ({ item }: { item: any }) => {
    const dupes = approvedBiz
      .filter(b => b.city === item.city)
      .map(b => ({ ...b, _exact: isSameIgnoringSpacesAndPunct(b.name, item.name), _score: diceSimilarity(b.name, item.name), _wordScore: wordOverlapScore(b.name, item.name) }))
      .filter(b => b._exact || b._score >= DUPE_THRESHOLD || b._wordScore >= WORD_OVERLAP_THRESHOLD);
    return (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: dupes.length > 0 ? '#FFB300' : theme.border, borderWidth: dupes.length > 0 ? 2 : 1 }]}>
      {dupes.length > 0 && (
        <View style={styles.dupeBanner}>
          <MaterialIcons name="warning" size={14} color="#E65100" />
          <Text style={styles.dupeBannerText}>
            {dupes.some(b => b._exact) ? '⚠️ Nom quasi-identique' : '⚠️ Doublon possible'}{' — '}
            {dupes.map(b => `"${b.name}"${b._exact ? ' (identique)' : b._score >= DUPE_THRESHOLD ? ' (très similaire)' : ' (faute probable)'}`).join(', ')}
          </Text>
        </View>
      )}
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
  };

  const renderApprovedBusiness = ({ item }: { item: any }) => (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={styles.cardTop}>
        <View style={[styles.avatar, { backgroundColor: Colors.primary + '33' }]}>
          <Text style={styles.avatarText}>{(item.name || '?')[0].toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={[styles.name, { color: theme.text, flex: 1 }]} numberOfLines={1}>{item.name}</Text>
            {item.verified && <Text style={{ fontSize: 16 }}>✓</Text>}
            {item.pinned && <Text style={{ fontSize: 16 }}>📌</Text>}
            {item.priority > 0 && (
              <View style={[styles.priorityBadge, { backgroundColor: Colors.cta + '22' }]}>
                <Text style={[styles.priorityText, { color: Colors.cta }]}>⭐ {item.priority}</Text>
              </View>
            )}
          </View>
          <Text style={[styles.meta, { color: theme.textSecondary }]}>{item.category} • 📍 {item.city}</Text>
          <Text style={[styles.meta, { color: theme.textSecondary }]}>👤 {item.ownerName}</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: Colors.primary + '22' }]}>
          <Text style={[styles.badgeText, { color: Colors.primary }]}>✓ Publié</Text>
        </View>
      </View>
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[styles.quickActionBtn, { backgroundColor: item.verified ? '#4CAF50' : 'transparent', borderColor: '#4CAF50' }]}
          onPress={async () => {
            try {
              await updateDoc(doc(db, 'businesses', item.id), { verified: !item.verified });
              Alert.alert('✅', item.verified ? 'Badge vérifié retiré' : 'Entreprise vérifiée');
            } catch {
              Alert.alert('Erreur', 'Impossible de modifier');
            }
          }}
        >
          <Text style={{ fontSize: 16 }}>✓</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.quickActionBtn, { backgroundColor: item.pinned ? Colors.primary : 'transparent', borderColor: Colors.primary }]}
          onPress={async () => {
            try {
              await updateDoc(doc(db, 'businesses', item.id), { pinned: !item.pinned });
              Alert.alert('✅', item.pinned ? 'Épinglage retiré' : 'Entreprise épinglée');
            } catch {
              Alert.alert('Erreur', 'Impossible de modifier');
            }
          }}
        >
          <Text style={{ fontSize: 16 }}>{item.pinned ? '📌' : '📍'}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.quickActionBtn, { borderColor: Colors.cta }]}
          onPress={() => setPriorityModal({ visible: true, item, value: String(item.priority || 0) })}
        >
          <Text style={{ fontSize: 14 }}>⭐</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.editAdminBtn, { borderColor: Colors.cta, backgroundColor: Colors.cta + '22' }]}
          onPress={() => router.push(`/vendor/edit-business?id=${item.id}`)}
        >
          <Text style={[styles.editAdminText, { color: Colors.cta }]}>✏️ Modifier</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.revokeBtn, { borderColor: theme.border }]}
          onPress={() => revokeBusiness(item)}
          disabled={actionId === item.id}
        >
          {actionId === item.id
            ? <ActivityIndicator size="small" color={theme.textSecondary} />
            : <Text style={[styles.revokeText, { color: theme.textSecondary }]}>⛔ Retirer</Text>
          }
        </TouchableOpacity>
      </View>
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
        <TouchableOpacity
          style={[styles.mainTabBtn, tab === 'reports' && { borderBottomColor: '#D32F2F', borderBottomWidth: 2.5 }]}
          onPress={() => setTab('reports')}
        >
          <Text style={[styles.mainTabText, { color: tab === 'reports' ? '#D32F2F' : theme.textSecondary }]}>
            🚩 Signalements {reports.length > 0 ? `(${reports.length})` : ''}
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={Colors.primary} size="large" />
          <Text style={[{ color: theme.textSecondary, marginTop: 8 }]}>Chargement...</Text>
        </View>
      ) : null}

      {!loading && tab === 'businesses' && (
        <>
          {/* SEARCH BAR */}
          <View style={[styles.searchBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={[styles.searchInput, { color: theme.text }]}
              placeholder="Rechercher une entreprise..."
              placeholderTextColor={theme.textSecondary}
              value={bizSearch}
              onChangeText={setBizSearch}
              autoCorrect={false}
            />
            {bizSearch.length > 0 && (
              <TouchableOpacity onPress={() => setBizSearch('')}>
                <Text style={{ color: theme.textSecondary, fontSize: 14 }}>✕</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={[styles.subTabRow, { backgroundColor: theme.surface }]}>
            {(['pending', 'approved'] as const).map(t => (
              <TouchableOpacity key={t}
                style={[styles.subTabBtn, bizTab === t && { backgroundColor: Colors.primary }]}
                onPress={() => setBizTab(t)}>
                <Text style={[styles.subTabText, { color: bizTab === t ? '#fff' : theme.textSecondary }]}>
                  {t === 'pending' ? `En attente (${pendingBiz.length})` : `Publiées (${approvedBiz.length})`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <FlatList
            data={(bizTab === 'pending' ? pendingBiz : approvedBiz).filter(b => {
              if (!bizSearch.trim()) return true;
              const s = bizSearch.toLowerCase();
              return b.name.toLowerCase().includes(s) || 
                     b.ownerName?.toLowerCase().includes(s) ||
                     b.city?.toLowerCase().includes(s);
            })}
            keyExtractor={item => item.id}
            renderItem={bizTab === 'pending' ? renderPendingBusiness : renderApprovedBusiness}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => setRefreshing(true)} tintColor={Colors.primary} colors={[Colors.primary]} />}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={{ fontSize: 48 }}>{bizSearch ? '🔍' : bizTab === 'pending' ? '🎉' : '🏪'}</Text>
                <Text style={[styles.emptyText, { color: theme.text }]}>
                  {bizSearch ? 'Aucun résultat' : bizTab === 'pending' ? 'Aucune entreprise en attente' : 'Aucune entreprise publiée'}
                </Text>
              </View>
            }
          />
        </>
      )}

      {!loading && tab === 'users' && (
        <>
          {/* SEARCH BAR */}
          <View style={[styles.searchBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={[styles.searchInput, { color: theme.text }]}
              placeholder="Rechercher un vendeur..."
              placeholderTextColor={theme.textSecondary}
              value={userSearch}
              onChangeText={setUserSearch}
              autoCorrect={false}
            />
            {userSearch.length > 0 && (
              <TouchableOpacity onPress={() => setUserSearch('')}>
                <Text style={{ color: theme.textSecondary, fontSize: 14 }}>✕</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={[styles.subTabRow, { backgroundColor: theme.surface }]}>
            {(['pending', 'approved'] as const).map(t => (
              <TouchableOpacity key={t}
                style={[styles.subTabBtn, userTab === t && { backgroundColor: Colors.primary }]}
                onPress={() => setUserTab(t)}>
                <Text style={[styles.subTabText, { color: userTab === t ? '#fff' : theme.textSecondary }]}>
                  {t === 'pending' ? `En attente (${pendingUsers.length})` : `Approuvés (${approvedUsers.length})`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <FlatList
            data={(userTab === 'pending' ? pendingUsers : approvedUsers).filter(u => {
              if (!userSearch.trim()) return true;
              const s = userSearch.toLowerCase();
              return u.name?.toLowerCase().includes(s) || 
                     u.email?.toLowerCase().includes(s) ||
                     u.phone?.toLowerCase().includes(s);
            })}
            keyExtractor={item => item.id}
            renderItem={userTab === 'pending' ? renderPendingUser : renderApprovedUser}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => setRefreshing(true)} tintColor={Colors.primary} colors={[Colors.primary]} />}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={{ fontSize: 48 }}>{userSearch ? '🔍' : userTab === 'pending' ? '🎉' : '👥'}</Text>
                <Text style={[styles.emptyText, { color: theme.text }]}>
                  {userSearch ? 'Aucun résultat' : userTab === 'pending' ? 'Aucun vendeur en attente' : 'Aucun vendeur approuvé'}
                </Text>
              </View>
            }
          />
        </>
      )}

      {!loading && tab === 'reports' && (
        <FlatList
          data={reports}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => setRefreshing(true)} tintColor={Colors.primary} colors={[Colors.primary]} />}
          renderItem={({ item }) => (
            <View style={[styles.card, { backgroundColor: theme.card, borderColor: '#D32F2F33' }]}>
              <View style={styles.cardTop}>
                <Text style={{ fontSize: 28 }}>🚩</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.name, { color: theme.text }]}>{item.businessName}</Text>
                  <Text style={[styles.meta, { color: theme.textSecondary }]}>Motif: {item.reason}</Text>
                  <Text style={[styles.meta, { color: theme.textSecondary }]}>Par: {item.reporterName}</Text>
                </View>
              </View>
              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.rejectBtn}
                  onPress={() => Alert.alert('Ignorer?', '', [
                    { text: 'Annuler', style: 'cancel' },
                    { text: 'Ignorer', onPress: async () => { try { await deleteDoc(doc(db, 'reports', item.id)); } catch {} } },
                  ])}>
                  <Text style={styles.rejectText}>✕ Ignorer</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.approveBtn, { backgroundColor: '#D32F2F' }]}
                  onPress={() => Alert.alert("Retirer l'annonce?", `"${item.businessName}" sera remise en attente.`, [
                    { text: 'Annuler', style: 'cancel' },
                    { text: '⛔ Retirer', style: 'destructive', onPress: async () => {
                      try {
                        await updateDoc(doc(db, 'businesses', item.businessId), { status: 'pending' });
                        await deleteDoc(doc(db, 'reports', item.id));
                      } catch {}
                    }},
                  ])}>
                  <Text style={styles.approveText}>⛔ Retirer</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={{ fontSize: 48 }}>✅</Text>
              <Text style={[styles.emptyText, { color: theme.text }]}>Aucun signalement en attente</Text>
            </View>
          }
        />
      )}

      {/* PRIORITY MODAL */}
      <Modal
        visible={priorityModal.visible}
        transparent
        animationType="fade"
        onRequestClose={() => setPriorityModal({ visible: false, item: null, value: '' })}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: theme.card }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>⭐ Priorité</Text>
            <Text style={[styles.modalSub, { color: theme.textSecondary }]}>
              Entrez un nombre entre 0 et 100{'\n'}(Plus élevé = apparaît en premier)
            </Text>
            <TextInput
              style={[styles.modalInput, { borderColor: '#9CA3AF', color: theme.text, backgroundColor: '#fff' }]}
              value={priorityModal.value}
              onChangeText={v => setPriorityModal(prev => ({ ...prev, value: v }))}
              keyboardType="number-pad"
              maxLength={3}
              autoFocus
            />
            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={[styles.modalBtn, { borderColor: theme.border }]}
                onPress={() => setPriorityModal({ visible: false, item: null, value: '' })}
              >
                <Text style={[styles.modalBtnText, { color: theme.textSecondary }]}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: Colors.cta, borderColor: Colors.cta }]}
                onPress={async () => {
                  const num = parseInt(priorityModal.value || '0');
                  if (isNaN(num) || num < 0 || num > 100) {
                    Alert.alert('Erreur', 'Entrez un nombre entre 0 et 100');
                    return;
                  }
                  try {
                    await updateDoc(doc(db, 'businesses', priorityModal.item.id), { priority: num });
                    setPriorityModal({ visible: false, item: null, value: '' });
                    Alert.alert('✅', `Priorité mise à ${num}`);
                  } catch {
                    Alert.alert('Erreur', 'Impossible de modifier');
                  }
                }}
              >
                <Text style={[styles.modalBtnText, { color: '#1A1A1A', fontWeight: '800' }]}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 32 },
  modalBox: { width: '100%', borderRadius: 16, padding: 24, elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 12 },
  modalTitle: { fontSize: 18, fontWeight: '800', marginBottom: 6 },
  modalSub: { fontSize: 13, lineHeight: 18, marginBottom: 16 },
  modalInput: { borderWidth: 2, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 22, fontWeight: '700', textAlign: 'center', marginBottom: 20 },
  modalBtns: { flexDirection: 'row', gap: 12 },
  modalBtn: { flex: 1, paddingVertical: 13, borderRadius: 10, borderWidth: 1.5, alignItems: 'center' },
  modalBtnText: { fontSize: 15, fontWeight: '700' },
  safe: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#fff' },
  headerSub: { fontSize: 12, color: '#A5D6A7', marginTop: 1 },
  statsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 32 },
  statItem: { alignItems: 'center' },
  statNum: { fontSize: 26, fontWeight: '900', color: '#fff' },
  statLbl: { fontSize: 11, color: '#A5D6A7', marginTop: 1 },
  statDivider: { width: 1, height: 32, backgroundColor: 'rgba(255,255,255,0.3)' },
  mainTabRow: { flexDirection: 'row', borderBottomWidth: 1 },
  mainTabBtn: { flex: 1, alignItems: 'center', paddingVertical: 13 },
  mainTabText: { fontSize: 14, fontWeight: '700' },
  searchBox: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 12, marginTop: 12, marginBottom: 8, borderRadius: 10, borderWidth: 1.5, paddingHorizontal: 12, paddingVertical: 10 },
  searchIcon: { fontSize: 14, marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14, paddingVertical: 2 },
  subTabRow: { flexDirection: 'row', margin: 12, borderRadius: 10, padding: 4, gap: 4 },
  subTabBtn: { flex: 1, paddingVertical: 8, borderRadius: 7, alignItems: 'center' },
  subTabText: { fontSize: 13, fontWeight: '600' },
  listContent: { padding: 16 },
  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  card: { borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 12, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3 },
  dupeBanner: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, backgroundColor: '#FFF3E0', borderRadius: 8, padding: 8, marginBottom: 10 },
  dupeBannerText: { flex: 1, fontSize: 12, color: '#BF360C', fontWeight: '700', lineHeight: 17 },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 10 },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  avatarText: { fontSize: 18, fontWeight: '800' },
  name: { fontSize: 15, fontWeight: '700' },
  meta: { fontSize: 12, marginTop: 2 },
  desc: { fontSize: 12, lineHeight: 17, marginBottom: 10 },
  badge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start' },
  badgeText: { fontSize: 11, fontWeight: '700' },
  actionRow: { flexDirection: 'row', gap: 10 },
  editAdminBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1.5, alignItems: 'center' },
  editAdminText: { fontWeight: '700', fontSize: 14 },
  rejectBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1.5, borderColor: '#D32F2F', alignItems: 'center' },
  rejectText: { color: '#D32F2F', fontWeight: '700', fontSize: 14 },
  approveBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: Colors.primary, alignItems: 'center' },
  approveText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  revokeBtn: { paddingVertical: 10, borderRadius: 10, borderWidth: 1, alignItems: 'center' },
  revokeText: { fontWeight: '600', fontSize: 13 },
  priorityBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  priorityText: { fontSize: 10, fontWeight: '700' },
  quickActionBtn: { width: 40, height: 40, borderRadius: 10, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyText: { fontSize: 16, fontWeight: '700' },
});