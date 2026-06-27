// app/business/[id].tsx — Business Detail Screen

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Image, Share,
  StyleSheet, Linking, Alert, ActivityIndicator, FlatList,
  Dimensions, TextInput, Modal, KeyboardAvoidingView, Platform,
  StatusBar,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import {
  doc, getDoc, collection, query, orderBy,
  onSnapshot, addDoc, updateDoc, deleteDoc,
  serverTimestamp, increment,
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../lib/AuthContext';
import { useLikes } from '../../hooks/useLikes';
import { Business } from '../../types';
import { Colors, CATEGORIES, WHATSAPP_GREETING } from '../../constants';
import { useColorTheme } from '../../hooks/useColorTheme';
import { CategoryIcon } from '../../components/CategoryIcon';
import { ContentContainer } from '../../components/ContentContainer';

const { width } = Dimensions.get('window');

// ── Star Rating Component ─────────────────────────────────────────────────────
function StarRating({ rating, size = 20, onPress }: { rating: number; size?: number; onPress?: (r: number) => void }) {
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1, 2, 3, 4, 5].map(star => (
        <TouchableOpacity key={star} onPress={() => onPress?.(star)} disabled={!onPress} activeOpacity={0.7}>
          <Text style={{ fontSize: size, color: star <= rating ? '#FFA726' : '#E0E0E0' }}>★</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ── Review Card ───────────────────────────────────────────────────────────────
function ReviewCard({ review, isOwn, onDelete, theme }: { review: any; isOwn: boolean; onDelete: () => void; theme: any }) {
  const date = review.createdAt?.toDate?.() ?? new Date(review.createdAt ?? 0);
  return (
    <View style={[rvStyles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={rvStyles.header}>
        <View style={[rvStyles.avatar, { backgroundColor: Colors.primary + '33' }]}>
          <Text style={[rvStyles.avatarText, { color: Colors.primary }]}>{(review.userName || 'U')[0].toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[rvStyles.name, { color: theme.text }]}>{review.userName || 'Utilisateur'}</Text>
          <Text style={[rvStyles.date, { color: theme.textSecondary }]}>{date.toLocaleDateString('fr-FR')}</Text>
        </View>
        <StarRating rating={review.rating} size={14} />
        {isOwn && (
          <TouchableOpacity onPress={onDelete} style={rvStyles.deleteBtn}>
            <Ionicons name="trash-outline" size={16} color="#D32F2F" />
          </TouchableOpacity>
        )}
      </View>
      {review.comment ? <Text style={[rvStyles.comment, { color: theme.textSecondary }]}>{review.comment}</Text> : null}
    </View>
  );
}

const rvStyles = StyleSheet.create({
  card: { borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 10 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  avatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontWeight: '800', fontSize: 15 },
  name: { fontSize: 13, fontWeight: '700' },
  date: { fontSize: 11, marginTop: 1 },
  comment: { fontSize: 13, lineHeight: 19, marginTop: 4 },
  deleteBtn: { padding: 4 },
});
// ─────────────────────────────────────────────────────────────────────────────

export default function BusinessDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { theme } = useColorTheme();
  const router = useRouter();
  const { user, userProfile, isAdmin } = useAuth();
  const { isLiked, toggleLike } = useLikes(user?.uid);

  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [activePhoto, setActivePhoto] = useState(0);
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [viewerPhotoIndex, setViewerPhotoIndex] = useState(0);
  const [likeLoading, setLikeLoading] = useState(false);

  // Reviews
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [myRating, setMyRating] = useState(0);
  const [myComment, setMyComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Report
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);

  useEffect(() => {
    if (!id) return;
    getDoc(doc(db, 'businesses', id)).then(snap => {
      if (snap.exists()) setBusiness({ id: snap.id, ...snap.data() } as Business);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  // Real-time reviews
  useEffect(() => {
    if (!id) return;
    const q = query(collection(db, 'reviews', id, 'items'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, snap => {
      setReviews(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setReviewsLoading(false);
    });
  }, [id]);

  const avgRating = reviews.length
    ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10
    : 0;

  const myExistingReview = reviews.find(r => r.userId === user?.uid);

  // ── Actions ───────────────────────────────────────────────────────────────
  const openPhone = () => business?.phone && Linking.openURL(`tel:${business.phone}`);

  const openWhatsApp = () => {
    if (!business?.whatsapp && !business?.phone) return;
    const num = (business.whatsapp || business.phone).replace(/\D/g, '');
    Linking.openURL(`https://wa.me/${num}?text=${encodeURIComponent(WHATSAPP_GREETING)}`);
  };

  const openFacebook = () => {
    if (!business?.facebook) return;
    const url = business.facebook.startsWith('http') ? business.facebook : `https://facebook.com/${business.facebook}`;
    Linking.openURL(url).catch(() => Alert.alert('Erreur', "Impossible d'ouvrir Facebook."));
  };

  const openInstagram = () => {
    if (!business?.instagram) return;
    const handle = business.instagram.replace('@', '');
    Linking.openURL(`https://instagram.com/${handle}`).catch(() => Alert.alert('Erreur', "Impossible d'ouvrir."));
  };

  const openMaps = () => {
    if (!business?.location) return;
    const { latitude, longitude, address } = business.location;
    const url = latitude && longitude
      ? `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`
      : address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}` : '';
    if (url) Linking.openURL(url).catch(() => Alert.alert('Erreur', "Impossible d'ouvrir Google Maps."));
  };

  const handleLike = async () => {
    if (!user) {
      Alert.alert('Connexion requise', 'Connectez-vous pour sauvegarder des favoris.',
        [{ text: 'Se connecter', onPress: () => router.push('/auth') }, { text: 'Annuler', style: 'cancel' }]);
      return;
    }
    if (!business) return;
    setLikeLoading(true);
    try { await toggleLike(business as any); } finally { setLikeLoading(false); }
  };

  // ── SHARE ─────────────────────────────────────────────────────────────────
  const handleShare = async () => {
    if (!business) return;
    try {
      await Share.share({
        message: `${business.name}\n${business.city} • ${business.category}\n\n${business.description?.slice(0, 100)}...\n\nTrouvé sur BurkinaBizz`,
        title: business.name,
      });
    } catch {}
  };

  // ── REPORT ────────────────────────────────────────────────────────────────
  const handleReport = async () => {
    if (!user) {
      Alert.alert('Connexion requise', 'Connectez-vous pour signaler une annonce.',
        [{ text: 'Se connecter', onPress: () => router.push('/auth') }, { text: 'Annuler', style: 'cancel' }]);
      return;
    }
    if (!reportReason.trim()) { Alert.alert('Motif requis', 'Veuillez indiquer la raison du signalement.'); return; }
    setSubmittingReport(true);
    try {
      await addDoc(collection(db, 'reports'), {
        businessId: id,
        businessName: business?.name,
        reason: reportReason.trim(),
        reportedBy: user.uid,
        reporterName: userProfile?.name || user.email || '',
        createdAt: serverTimestamp(),
        status: 'pending',
      });
      setShowReportModal(false);
      setReportReason('');
      Alert.alert('✅ Signalement envoyé', 'Notre équipe examinera cette annonce. Merci!');
    } catch {
      Alert.alert('Erreur', 'Impossible d\'envoyer le signalement.');
    } finally { setSubmittingReport(false); }
  };

  // ── REVIEW ────────────────────────────────────────────────────────────────
  const handleSubmitReview = async () => {
    if (!user) {
      Alert.alert('Connexion requise', '', [{ text: 'Se connecter', onPress: () => router.push('/auth') }, { text: 'Annuler', style: 'cancel' }]);
      return;
    }
    if (myRating === 0) { Alert.alert('Note requise', 'Veuillez sélectionner une note.'); return; }
    setSubmittingReview(true);
    
    try {
      if (myExistingReview) {
        // UPDATE existing review
        await updateDoc(doc(db, 'reviews', id!, 'items', myExistingReview.id), {
          rating: myRating,
          comment: myComment.trim() || null,
        });
        // Update business rating (remove old, add new)
        await updateDoc(doc(db, 'businesses', id!), {
          ratingSum: increment(myRating - myExistingReview.rating),
        });
        Alert.alert('✅ Avis modifié!', 'Votre avis a été mis à jour.');
      } else {
        // CREATE new review
        await addDoc(collection(db, 'reviews', id!, 'items'), {
          userId: user.uid,
          userName: userProfile?.name || user.email || 'Utilisateur',
          rating: myRating,
          comment: myComment.trim() || null,
          createdAt: serverTimestamp(),
        });
        // Update avg rating on business doc
        await updateDoc(doc(db, 'businesses', id!), {
          ratingSum: increment(myRating),
          ratingCount: increment(1),
        });
        Alert.alert('✅ Avis publié!', 'Merci pour votre retour.');
      }
      
      setShowReviewModal(false);
      setMyRating(0);
      setMyComment('');
    } catch (e: any) {
      Alert.alert('Erreur', e?.message || 'Impossible de publier l\'avis.');
    } finally { setSubmittingReview(false); }
  };

  const handleDeleteReview = async (review: any) => {
    Alert.alert('Supprimer votre avis?', '', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer', style: 'destructive', onPress: async () => {
          try {
            await deleteDoc(doc(db, 'reviews', id!, 'items', review.id));
            await updateDoc(doc(db, 'businesses', id!), {
              ratingSum: increment(-review.rating),
              ratingCount: increment(-1),
            });
          } catch { Alert.alert('Erreur', 'Impossible de supprimer.'); }
        },
      },
    ]);
  };

  // ── ADMIN PIN ──────────────────────────────────────────────────────────────
  const handleTogglePin = async () => {
    if (!business) return;
    const newPinned = !business.pinned;
    try {
      await updateDoc(doc(db, 'businesses', id!), { pinned: newPinned });
      setBusiness(prev => prev ? { ...prev, pinned: newPinned } : prev);
      Alert.alert(newPinned ? '📌 Épinglée!' : 'Désépinglée', newPinned ? 'Cette entreprise apparaîtra en tête de l\'annuaire.' : 'L\'entreprise n\'est plus épinglée.');
    } catch { Alert.alert('Erreur', 'Impossible de modifier.'); }
  };

  if (loading) return (
    <View style={[styles.center, { backgroundColor: theme.background }]}>
      <ActivityIndicator color={Colors.primary} size="large" />
    </View>
  );

  if (!business) return (
    <View style={[styles.center, { backgroundColor: theme.background }]}>
      <Text style={{ fontSize: 48 }}>😕</Text>
      <Text style={[styles.errorText, { color: theme.text }]}>Entreprise introuvable</Text>
    </View>
  );

  const cat = CATEGORIES.find(c => c.label === business.category);
  const liked = isLiked(business.id);
  const photos = business.photos?.length ? business.photos : business.coverPhoto ? [business.coverPhoto] : [];

  return (
    <>
      <Stack.Screen options={{
        title: business.name,
        headerShown: true,
        headerBackVisible: true,
        headerBackTitle: '',
        headerTitleStyle: {
          fontSize: 16,
        },
        /*headerRight: () => (
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {isAdmin && (
              <TouchableOpacity onPress={handleTogglePin} style={styles.headerBtn}>
                <Ionicons name={business.pinned ? "pin" : "pin-outline"} size={22} color="#fff" />
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={handleShare} style={styles.headerBtn}>
              <Ionicons name="share-outline" size={22} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowReportModal(true)} style={styles.headerBtn}>
              <Ionicons name="flag-outline" size={22} color="#fff" />
            </TouchableOpacity>
          </View>
        ),*/
      }} />

      <ScrollView style={[styles.container, { backgroundColor: theme.background }]} showsVerticalScrollIndicator={false}>

        {/* PINNED BANNER */}
        {business.pinned && (
          <View style={{ width: '100%', alignItems: 'center' }}>
            <View style={{ width: '100%', maxWidth: 600, paddingHorizontal: 16 }}>
              <View style={[styles.pinnedBanner, { backgroundColor: Colors.cta + '22' }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="pin" size={16} color={Colors.cta} />
                  <Text style={[styles.pinnedText, { color: Colors.cta }]}>Entreprise mise en avant</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* PHOTO GALLERY */}
        <View style={{ width: '100%', alignItems: 'center' }}>
          <View style={{ width: '100%', maxWidth: 600 }}>
            {photos.length > 0 ? (
              <View style={{ width: '100%', height: 280, marginBottom: 16, position: 'relative' }}>
                <FlatList
                  data={photos} 
                  horizontal 
                  pagingEnabled 
                  showsHorizontalScrollIndicator={false}
                  keyExtractor={(_, i) => String(i)}
                  onScroll={(e) => {
                    const offsetX = e.nativeEvent.contentOffset.x;
                    const containerWidth = e.nativeEvent.layoutMeasurement.width;
                    setActivePhoto(Math.round(offsetX / containerWidth));
                  }}
                  scrollEventThrottle={16}
                  renderItem={({ item, index }) => (
                    <TouchableOpacity 
                      activeOpacity={0.9}
                      onPress={() => {
                        setViewerPhotoIndex(index);
                        setShowImageViewer(true);
                      }}
                      style={{ width: Math.min(width, 600) }}
                    >
                      <Image source={{ uri: item }} style={[styles.photo, { width: Math.min(width, 600) }]} resizeMode="cover" />
                    </TouchableOpacity>
                  )}
                />
                {photos.length > 1 && (
                  <View style={styles.dotRow}>
                    {photos.map((_, i) => (
                      <View key={i} style={[styles.dot, { backgroundColor: i === activePhoto ? '#fff' : 'rgba(255,255,255,0.4)' }]} />
                    ))}
                  </View>
                )}
              </View>
            ) : (
              <View style={[styles.photoPlaceholder, { backgroundColor: (cat?.color || Colors.primary) + '22' }]}>
                {cat ? (
                  <CategoryIcon iconName={cat.icon} iconFamily={cat.iconFamily} size={72} color={cat.color} />
                ) : (
                  <MaterialCommunityIcons name="office-building" size={72} color={Colors.primary} />
                )}
              </View>
            )}
          </View>
        </View>

        <ContentContainer maxWidth={600} style={styles.body}>
          {/* NAME + LIKE */}
          <View style={styles.titleRow}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <Text style={[styles.name, { color: theme.text, flex: 1 }]}>{business.name}</Text>
                {business.verified && (
                  <View style={{ backgroundColor: '#4CAF50', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Ionicons name="checkmark-circle" size={14} color="#fff" />
                    <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>Vérifié</Text>
                  </View>
                )}
              </View>
              <View style={styles.metaRow}>
                {/* Show all categories if multiple */}
                {business.categories && business.categories.length > 0 ? (
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, flex: 1 }}>
                    {business.categories.map((catLabel, idx) => {
                      const categoryData = CATEGORIES.find(c => c.label === catLabel);
                      return (
                        <View key={idx} style={[styles.catBadge, { backgroundColor: (categoryData?.color || Colors.primary) + '22' }]}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                            {categoryData && <CategoryIcon iconName={categoryData.icon} iconFamily={categoryData.iconFamily} size={14} color={categoryData.color} />}
                            <Text style={[styles.catBadgeText, { color: categoryData?.color || Colors.primary }]}>
                              {catLabel}
                            </Text>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                ) : (
                  <View style={[styles.catBadge, { backgroundColor: (cat?.color || Colors.primary) + '22' }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      {cat && <CategoryIcon iconName={cat.icon} iconFamily={cat.iconFamily} size={14} color={cat.color} />}
                      <Text style={[styles.catBadgeText, { color: cat?.color || Colors.primary }]}>{business.category}</Text>
                    </View>
                  </View>
                )}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Ionicons name="location" size={14} color={theme.textSecondary} />
                  <Text style={[styles.city, { color: theme.textSecondary }]}>{business.city}</Text>
                </View>
              </View>
              {/* RATING SUMMARY */}
              {reviews.length > 0 && (
                <View style={styles.ratingRow}>
                  <StarRating rating={Math.round(avgRating)} size={14} />
                  <Text style={[styles.ratingText, { color: theme.textSecondary }]}>
                    {avgRating} ({reviews.length} avis)
                  </Text>
                </View>
              )}
            </View>
            <TouchableOpacity
              style={[styles.likeBtn, { backgroundColor: liked ? '#FFEBEE' : theme.surface, borderColor: theme.border }]}
              onPress={handleLike} disabled={likeLoading}
            >
              {likeLoading ? (
                <ActivityIndicator size="small" color={Colors.primary} />
              ) : (
                <Ionicons name={liked ? "heart" : "heart-outline"} size={28} color={liked ? "#D32F2F" : theme.textSecondary} />
              )}
            </TouchableOpacity>
          </View>

          {/* DESCRIPTION */}
          <View style={[styles.section, { borderColor: theme.border }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>À propos</Text>
            <Text style={[styles.description, { color: theme.textSecondary }]}>{business.description}</Text>
          </View>

          {/* CONTACT BUTTONS */}
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Contacter</Text>
          <View style={styles.contactRow}>
            {business.phone && (
              <TouchableOpacity style={[styles.contactBtn, { backgroundColor: '#1096c3' }]} onPress={openPhone}>
                <Ionicons name="call" size={20} color="#fff" />
                <Text style={styles.contactBtnText}>Appeler</Text>
              </TouchableOpacity>
            )}
            {(business.whatsapp || business.phone) && (
              <TouchableOpacity style={[styles.contactBtn, { backgroundColor: '#2b7847' }]} onPress={openWhatsApp}>
                <Ionicons name="logo-whatsapp" size={20} color="#fff" />
                <Text style={styles.contactBtnText}>WhatsApp</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* SOCIAL */}
          {(business.facebook || business.instagram || business.website) && (
            <>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Réseaux sociaux</Text>
              <View style={styles.socialRow}>
                {business.facebook && (
                  <TouchableOpacity style={[styles.socialBtn, { backgroundColor: '#1a4173' }]} onPress={openFacebook}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Ionicons name="logo-facebook" size={18} color="#fff" />
                      <Text style={styles.socialBtnText}>Facebook</Text>
                    </View>
                  </TouchableOpacity>
                )}
                {business.instagram && (
                  <TouchableOpacity style={[styles.socialBtn, { backgroundColor: '#E4405F' }]} onPress={openInstagram}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Ionicons name="logo-instagram" size={18} color="#fff" />
                      <Text style={styles.socialBtnText}>Instagram</Text>
                    </View>
                  </TouchableOpacity>
                )}
                {business.website && (
                  <TouchableOpacity 
                    style={[styles.socialBtn, { backgroundColor: Colors.primary }]} 
                    onPress={() => {
                      const url = business.website!.startsWith('http') ? business.website : `https://${business.website}`;
                      Linking.openURL(url!).catch(() => Alert.alert('Erreur', "Impossible d'ouvrir le site web."));
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Ionicons name="globe-outline" size={18} color="#fff" />
                      <Text style={styles.socialBtnText}>Site web</Text>
                    </View>
                  </TouchableOpacity>
                )}
              </View>
            </>
          )}

          {/* LOCATION */}
          {business.location && (business.location.address || business.location.latitude) && (
            <>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Localisation</Text>
              <TouchableOpacity style={[styles.mapsBtn, { borderColor: theme.border }]} onPress={openMaps} activeOpacity={0.8}>
                <View style={{ flex: 1 }}>
                  {business.location.address && (
                    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 6 }}>
                      <Ionicons name="location" size={16} color={theme.text} style={{ marginTop: 2 }} />
                      <Text style={[styles.mapsBtnAddress, { color: theme.text, flex: 1 }]} numberOfLines={2}>
                        {business.location.address}
                      </Text>
                    </View>
                  )}
                  {business.location.latitude && (
                    <Text style={[styles.mapsBtnCoords, { color: theme.textSecondary }]}>
                      {business.location.latitude.toFixed(4)}, {business.location.longitude?.toFixed(4)}
                    </Text>
                  )}
                </View>
                <View style={styles.mapsBtnIcon}>
                  <Ionicons name="map" size={24} color={Colors.primary} />
                  <Text style={styles.mapsBtnIconText}>Ouvrir</Text>
                </View>
              </TouchableOpacity>
            </>
          )}

          {/* SHARE + REPORT ROW */}
          <View style={styles.actionRow}>
            <TouchableOpacity style={[styles.actionBtn, { borderColor: theme.border }]} onPress={handleShare}>
              <Ionicons name="share-outline" size={18} color={theme.text} />
              <Text style={[styles.actionBtnText, { color: theme.text }]}>Partager</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, { borderColor: '#D32F2F22' }]} onPress={() => setShowReportModal(true)}>
              <Ionicons name="flag-outline" size={18} color="#D32F2F" />
              <Text style={[styles.actionBtnText, { color: '#D32F2F' }]}>Signaler</Text>
            </TouchableOpacity>
          </View>

          {/* CONTACT INFO CARD */}
          <View style={[styles.infoCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            {business.phone && <InfoRow iconName="call" label="Téléphone" value={business.phone} theme={theme} />}
            {business.whatsapp && <InfoRow iconName="logo-whatsapp" label="WhatsApp" value={business.whatsapp} theme={theme} />}
            {business.facebook && <InfoRow iconName="logo-facebook" label="Facebook" value={business.facebook} theme={theme} />}
            {business.instagram && <InfoRow iconName="logo-instagram" label="Instagram" value={business.instagram} theme={theme} />}
            <InfoRow iconName="location" label="Ville" value={business.city} theme={theme} />
          </View>

          {/* ── REVIEWS SECTION ──────────────────────────────────────────── */}
          <View style={styles.reviewsHeader}>
            <View>
              <Text style={[styles.sectionTitle, { color: theme.text, marginBottom: 2 }]}>
                Avis ({reviews.length})
              </Text>
              {reviews.length > 0 && <StarRating rating={Math.round(avgRating)} size={16} />}
            </View>
            <TouchableOpacity
              style={styles.addReviewBtn}
              onPress={() => {
                if (!user) { 
                  Alert.alert('Connexion requise', '', [
                    { text: 'Se connecter', onPress: () => router.push('/auth') }, 
                    { text: 'Annuler', style: 'cancel' }
                  ]); 
                  return; 
                }
                if (myExistingReview) {
                  setMyRating(myExistingReview.rating);
                  setMyComment(myExistingReview.comment || '');
                }
                setShowReviewModal(true);
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="create-outline" size={16} color="#fff" />
                <Text style={styles.addReviewBtnText}>
                  {myExistingReview ? 'Modifier mon avis' : 'Laisser un avis'}
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {reviewsLoading ? (
            <ActivityIndicator color={Colors.primary} />
          ) : reviews.length === 0 ? (
            <View style={[styles.emptyReviews, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Ionicons name="chatbubbles-outline" size={40} color={theme.textSecondary} />
              <Text style={[{ color: theme.textSecondary, fontSize: 13, textAlign: 'center' }]}>
                Aucun avis pour le moment. Soyez le premier!
              </Text>
            </View>
          ) : (
            reviews.map(r => (
              <ReviewCard
                key={r.id} review={r}
                isOwn={r.userId === user?.uid || isAdmin}
                onDelete={() => handleDeleteReview(r)}
                theme={theme}
              />
            ))
          )}
        </ContentContainer>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ── REVIEW MODAL ──────────────────────────────────────────────────── */}
      <Modal visible={showReviewModal} animationType="slide" transparent onRequestClose={() => setShowReviewModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalSheet, { backgroundColor: theme.card }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <Ionicons name="create-outline" size={24} color={theme.text} />
                <Text style={[styles.modalTitle, { color: theme.text, marginBottom: 0 }]}>Laisser un avis</Text>
              </View>
              <Text style={[styles.modalSub, { color: theme.textSecondary }]}>Note *</Text>
              <StarRating rating={myRating} size={36} onPress={setMyRating} />
              <Text style={[styles.modalSub, { color: theme.textSecondary, marginTop: 16 }]}>Commentaire (optionnel)</Text>
              <TextInput
                style={[styles.reviewInput, { borderColor: theme.border, backgroundColor: theme.surface, color: theme.text }]}
                placeholder="Partagez votre expérience..."
                placeholderTextColor={theme.textSecondary}
                value={myComment} onChangeText={setMyComment}
                multiline numberOfLines={4} maxLength={400}
                textAlignVertical="top"
              />
              <View style={styles.modalBtns}>
                <TouchableOpacity style={[styles.modalCancelBtn, { borderColor: theme.border }]} onPress={() => { setShowReviewModal(false); setMyRating(0); setMyComment(''); }}>
                  <Text style={[styles.modalCancelText, { color: theme.textSecondary }]}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalSubmitBtn, submittingReview && { opacity: 0.6 }]} onPress={handleSubmitReview} disabled={submittingReview}>
                  {submittingReview ? <ActivityIndicator color="#1A1A1A" /> : <Text style={styles.modalSubmitText}>Publier</Text>}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── REPORT MODAL ──────────────────────────────────────────────────── */}
      <Modal visible={showReportModal} animationType="slide" transparent onRequestClose={() => setShowReportModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: theme.card }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <Ionicons name="flag" size={24} color="#D32F2F" />
              <Text style={[styles.modalTitle, { color: theme.text, marginBottom: 0 }]}>Signaler cette annonce</Text>
            </View>
            <Text style={[styles.modalSub, { color: theme.textSecondary }]}>Motif du signalement *</Text>
            {['Informations incorrectes', 'Entreprise fermée', 'Contenu inapproprié', 'Arnaque / Fraude', 'Doublon', 'Autre'].map(reason => (
              <TouchableOpacity
                key={reason}
                style={[styles.reportOption, { borderColor: reportReason === reason ? Colors.primary : theme.border, backgroundColor: reportReason === reason ? Colors.primary + '15' : 'transparent' }]}
                onPress={() => setReportReason(reason)}
              >
                <Text style={[styles.reportOptionText, { color: reportReason === reason ? Colors.primary : theme.text }]}>{reason}</Text>
                {reportReason === reason && <Ionicons name="checkmark" size={20} color={Colors.primary} />}
              </TouchableOpacity>
            ))}
            <View style={styles.modalBtns}>
              <TouchableOpacity style={[styles.modalCancelBtn, { borderColor: theme.border }]} onPress={() => { setShowReportModal(false); setReportReason(''); }}>
                <Text style={[styles.modalCancelText, { color: theme.textSecondary }]}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalSubmitBtn, { backgroundColor: '#D32F2F' }, submittingReport && { opacity: 0.6 }]} onPress={handleReport} disabled={submittingReport}>
                {submittingReport ? <ActivityIndicator color="#fff" /> : <Text style={[styles.modalSubmitText, { color: '#fff' }]}>Signaler</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* FULL-SCREEN IMAGE VIEWER */}
      <Modal
        visible={showImageViewer}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowImageViewer(false)}
      >
        <View style={styles.imageViewerContainer}>
          <StatusBar barStyle="light-content" backgroundColor="#000" />
          
          <TouchableOpacity 
            style={styles.imageViewerClose}
            onPress={() => setShowImageViewer(false)}
          >
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>

          {photos.length > 1 && (
            <View style={styles.imageViewerCounter}>
              <Text style={styles.imageViewerCounterText}>
                {viewerPhotoIndex + 1} / {photos.length}
              </Text>
            </View>
          )}

          <FlatList
            data={photos}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(_, i) => `viewer-${i}`}
            initialScrollIndex={viewerPhotoIndex}
            getItemLayout={(_, index) => ({
              length: width,
              offset: width * index,
              index,
            })}
            onMomentumScrollEnd={e => setViewerPhotoIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
            renderItem={({ item }) => (
              <View style={styles.imageViewerSlide}>
                <Image 
                  source={{ uri: item }} 
                  style={styles.imageViewerPhoto} 
                  resizeMode="contain"
                />
              </View>
            )}
          />

          {photos.length > 1 && (
            <View style={styles.imageViewerDots}>
              {photos.map((_, i) => (
                <View 
                  key={i} 
                  style={[
                    styles.imageViewerDot, 
                    { backgroundColor: i === viewerPhotoIndex ? '#fff' : 'rgba(255,255,255,0.4)' }
                  ]} 
                />
              ))}
            </View>
          )}
        </View>
      </Modal>
    </>
  );
}

function InfoRow({ iconName, label, value, theme }: { 
  iconName: string; 
  label: string; 
  value: string; 
  theme: any 
}) {
  return (
    <View style={infoStyles.row}>
      <Ionicons name={iconName as any} size={18} color={theme.textSecondary} />
      <Text style={[infoStyles.label, { color: theme.textSecondary }]}>{label}</Text>
      <Text style={[infoStyles.value, { color: theme.text }]} numberOfLines={1}>{value}</Text>
    </View>
  );
}

const infoStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 10 },
  label: { fontSize: 13, width: 90 },
  value: { flex: 1, fontSize: 13, fontWeight: '600', textAlign: 'right' },
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  errorText: { fontSize: 16, fontWeight: '700' },
  headerBtn: { paddingHorizontal: 6 },
  pinnedBanner: { paddingVertical: 8, paddingHorizontal: 16, alignItems: 'center' },
  pinnedText: { fontSize: 13, fontWeight: '700' },
  photo: { height: 280 },
  photoPlaceholder: { height: 220, alignItems: 'center', justifyContent: 'center' },
  dotRow: { position: 'absolute', bottom: 12, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  body: { padding: 16, gap: 16 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  name: { fontSize: 22, fontWeight: '900', lineHeight: 28 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6, flexWrap: 'wrap' },
  catBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  catBadgeText: { fontSize: 12, fontWeight: '700' },
  city: { fontSize: 13 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  ratingText: { fontSize: 12 },
  likeBtn: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', borderWidth: 1, flexShrink: 0 },
  section: { borderTopWidth: 1, paddingTop: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '800', marginBottom: 10 },
  description: { fontSize: 14, lineHeight: 22 },
  contactRow: { flexDirection: 'row', gap: 10 },
  contactBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 12, gap: 6 },
  contactBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  socialRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  socialBtn: { flex: 1, minWidth: 140, alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 12 },
  socialBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  mapsBtn: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderRadius: 14, padding: 14, gap: 12, marginBottom: 4 },
  mapsBtnAddress: { fontSize: 14, fontWeight: '600', lineHeight: 20 },
  mapsBtnCoords: { fontSize: 11, marginTop: 2 },
  mapsBtnIcon: { alignItems: 'center', gap: 2 },
  mapsBtnIconText: { fontSize: 11, color: '#1976D2', fontWeight: '700' },
  actionRow: { flexDirection: 'row', gap: 10 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 12, borderWidth: 1.5 },
  actionBtnText: { fontSize: 14, fontWeight: '700' },
  infoCard: { borderRadius: 14, borderWidth: 1, paddingHorizontal: 14 },
  reviewsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  addReviewBtn: { backgroundColor: Colors.primary, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  addReviewBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  emptyReviews: { alignItems: 'center', padding: 24, borderRadius: 14, borderWidth: 1, gap: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalTitle: { fontSize: 18, fontWeight: '800' },
  modalSub: { fontSize: 13, fontWeight: '600', marginBottom: 10 },
  reviewInput: { borderWidth: 1.5, borderRadius: 12, padding: 12, fontSize: 14, minHeight: 100, marginTop: 4 },
  reportOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1.5, borderRadius: 10, padding: 12, marginBottom: 8 },
  reportOptionText: { fontSize: 14, fontWeight: '500' },
  modalBtns: { flexDirection: 'row', gap: 10, marginTop: 20 },
  modalCancelBtn: { flex: 1, borderWidth: 1.5, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  modalCancelText: { fontSize: 15, fontWeight: '600' },
  modalSubmitBtn: { flex: 1, backgroundColor: Colors.primary, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  modalSubmitText: { fontSize: 15, fontWeight: '800', color: '#1A1A1A' },
  imageViewerContainer: { flex: 1, backgroundColor: '#000', justifyContent: 'center' },
  imageViewerClose: { position: 'absolute', top: 50, right: 20, zIndex: 10, backgroundColor: 'rgba(0,0,0,0.5)', width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  imageViewerCounter: { position: 'absolute', top: 50, left: 20, zIndex: 10, backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  imageViewerCounterText: { fontSize: 14, color: '#fff', fontWeight: '600' },
  imageViewerSlide: { width, height: '100%', justifyContent: 'center', alignItems: 'center' },
  imageViewerPhoto: { width: '100%', height: '100%' },
  imageViewerDots: { position: 'absolute', bottom: 40, alignSelf: 'center', flexDirection: 'row', gap: 6 },
  imageViewerDot: { width: 8, height: 8, borderRadius: 4 },
});