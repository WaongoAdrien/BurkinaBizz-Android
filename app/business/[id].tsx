// app/business/[id].tsx — Business Detail Screen

import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Image, Share,
  StyleSheet, Linking, Alert, ActivityIndicator, FlatList,
  Dimensions, TextInput, Modal, KeyboardAvoidingView, Platform,
  StatusBar,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  doc, getDoc, collection, query, orderBy,
  onSnapshot, addDoc, updateDoc,
  serverTimestamp, increment, runTransaction,
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { containsProfanity } from '../../lib/profanityFilter';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../lib/AuthContext';
import { useLikes } from '../../hooks/useLikes';
import { Business } from '../../types';
import { Colors, CATEGORIES, WHATSAPP_GREETING } from '../../constants';
import { useColorTheme } from '../../hooks/useColorTheme';
import { CategoryIcon } from '../../components/CategoryIcon';
import { ContentContainer } from '../../components/ContentContainer';
import { AppHeader } from '../../components/AppHeader';
import { OpenStatusBadge } from '../../components/OpenStatusBadge';
import { DAYS_MONDAY_FIRST, DAY_LABELS_FR, DAY_KEYS_BY_UTC_INDEX, formatDayHours } from '../../lib/openingHours';
import { useTranslation, registerTranslations } from '../../lib/LanguageContext';

registerTranslations({
  'Utilisateur': 'User',
  'Entreprise introuvable': 'Business not found',
  "Impossible d'ouvrir Facebook.": 'Unable to open Facebook.',
  "Impossible d'ouvrir.": 'Unable to open.',
  "Impossible d'ouvrir Google Maps.": 'Unable to open Google Maps.',
  'Erreur': 'Error',
  'Connexion requise': 'Login required',
  'Connectez-vous pour sauvegarder des favoris.': 'Log in to save favorites.',
  'Se connecter': 'Log in',
  'Annuler': 'Cancel',
  'Connectez-vous pour signaler une annonce.': 'Log in to report a listing.',
  'Motif requis': 'Reason required',
  'Veuillez indiquer la raison du signalement.': 'Please indicate the reason for the report.',
  '✅ Signalement envoyé': '✅ Report sent',
  'Notre équipe examinera cette annonce. Merci!': 'Our team will review this listing. Thank you!',
  "Impossible d'envoyer le signalement.": 'Unable to send the report.',
  'Note requise': 'Rating required',
  'Veuillez sélectionner une note.': 'Please select a rating.',
  '⚠️ Langage inapproprié': '⚠️ Inappropriate language',
  'Votre avis contient des mots inappropriés. Merci de reformuler poliment et de le soumettre à nouveau.\n\nYour review contains inappropriate language. Please rephrase politely and resubmit.':
    'Your review contains inappropriate language. Please rephrase politely and resubmit.',
  '✅ Avis modifié!': '✅ Review updated!',
  'Votre avis a été mis à jour.': 'Your review has been updated.',
  '✅ Avis publié!': '✅ Review posted!',
  'Merci pour votre retour.': 'Thank you for your feedback.',
  "Impossible de publier l'avis.": 'Unable to post the review.',
  'Supprimer votre avis?': 'Delete your review?',
  'Supprimer': 'Delete',
  'Impossible de supprimer.': 'Unable to delete.',
  '📌 Épinglée!': '📌 Pinned!',
  'Désépinglée': 'Unpinned',
  "Cette entreprise apparaîtra en tête de l'annuaire.": 'This business will appear at the top of the directory.',
  "L'entreprise n'est plus épinglée.": 'The business is no longer pinned.',
  'Impossible de modifier.': 'Unable to update.',
  'Entreprise mise en avant': 'Featured business',
  'Vérifié': 'Verified',
  'À propos': 'About',
  'Contacter': 'Contact',
  'Appeler': 'Call',
  'WhatsApp': 'WhatsApp',
  'Réseaux sociaux': 'Social media',
  "Impossible d'ouvrir le site web.": 'Unable to open the website.',
  'Site web': 'Website',
  'Localisation': 'Location',
  'Voir aussi': 'See also',
  'Voir dans Maps': 'View on Maps',
  'Partager': 'Share',
  'Signaler': 'Report',
  'Horaires': 'Hours',
  'Lundi': 'Monday',
  'Mardi': 'Tuesday',
  'Mercredi': 'Wednesday',
  'Jeudi': 'Thursday',
  'Vendredi': 'Friday',
  'Samedi': 'Saturday',
  'Dimanche': 'Sunday',
  'Téléphone': 'Phone',
  'Ville': 'City',
  'Avis': 'Reviews',
  'avis': 'reviews',
  'Modifier mon avis': 'Edit my review',
  'Laisser un avis': 'Write a review',
  'Aucun avis pour le moment. Soyez le premier!': 'No reviews yet. Be the first!',
  'Note *': 'Rating *',
  'Commentaire (optionnel)': 'Comment (optional)',
  'Partagez votre expérience...': 'Share your experience...',
  'Publier': 'Post',
  'Signaler cette annonce': 'Report this listing',
  'Motif du signalement *': 'Reason for report *',
  'Informations incorrectes': 'Incorrect information',
  'Entreprise fermée': 'Business closed',
  'Contenu inapproprié': 'Inappropriate content',
  'Arnaque / Fraude': 'Scam / Fraud',
  'Doublon': 'Duplicate',
  'Autre': 'Other',
  'Trouvé sur BurkinaBizz': 'Found on BurkinaBizz',
});

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
  const { t, language } = useTranslation();
  const date = review.createdAt?.toDate?.() ?? new Date(review.createdAt ?? 0);
  const dateLocale = language === 'en' ? 'en-GB' : 'fr-FR';
  return (
    <View style={[rvStyles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={rvStyles.header}>
        <View style={[rvStyles.avatar, { backgroundColor: Colors.primary + '33' }]}>
          <Text style={[rvStyles.avatarText, { color: Colors.primary }]}>{(review.userName || 'U')[0].toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[rvStyles.name, { color: theme.text }]}>{review.userName || t('Utilisateur')}</Text>
          <Text style={[rvStyles.date, { color: theme.textSecondary }]}>{date.toLocaleDateString(dateLocale)}</Text>
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
  card: {
    borderRadius: 7, borderWidth: 1, padding: 12, marginBottom: 10,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6 },
      android: { elevation: 2 },
    }),
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  avatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontWeight: '400', fontSize: 15 },
  name: { fontSize: 13, fontWeight: '400' },
  date: { fontSize: 11, marginTop: 1 },
  comment: { fontSize: 13, lineHeight: 19, marginTop: 4 },
  deleteBtn: { padding: 4 },
});
// ─────────────────────────────────────────────────────────────────────────────

// ── Section Header ───────────────────────────────────────────────────────────
function SectionHeader({ icon, color, title, theme }: { icon: keyof typeof Ionicons.glyphMap; color: string; title: string; theme: any }) {
  return (
    <View style={shStyles.row}>
      <View style={[shStyles.badge, { backgroundColor: color + '22' }]}>
        <Ionicons name={icon} size={16} color={color} />
      </View>
      <Text style={[shStyles.title, { color: theme.text }]}>{title}</Text>
    </View>
  );
}

const shStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  badge: { width: 28, height: 28, borderRadius: 5, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 16, fontWeight: '400' },
});
// ─────────────────────────────────────────────────────────────────────────────

export default function BusinessDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { theme } = useColorTheme();
  const router = useRouter();
  const { user, userProfile, isAdmin } = useAuth();
  const { isLiked, toggleLike } = useLikes(user?.uid);
  const { t } = useTranslation();

  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [relatedBusiness, setRelatedBusiness] = useState<Business | null>(null);
  const [activePhoto, setActivePhoto] = useState(0);
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [viewerPhotoIndex, setViewerPhotoIndex] = useState(0);
  const [likeLoading, setLikeLoading] = useState(false);
  const [nameWidth, setNameWidth] = useState(0);
  const imageViewerRef = useRef<FlatList>(null);
  const scrollViewRef = useRef<ScrollView>(null);

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
    scrollViewRef.current?.scrollTo({ y: 0, animated: false });
    getDoc(doc(db, 'businesses', id)).then(snap => {
      if (snap.exists()) setBusiness({ id: snap.id, ...snap.data() } as Business);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  // Related ("see also") business
  useEffect(() => {
    if (!business?.relatedBusinessId) { setRelatedBusiness(null); return; }
    getDoc(doc(db, 'businesses', business.relatedBusinessId)).then(snap => {
      setRelatedBusiness(snap.exists() ? ({ id: snap.id, ...snap.data() } as Business) : null);
    }).catch(() => setRelatedBusiness(null));
  }, [business?.relatedBusinessId]);

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

  // Businesses created after strictWhatsapp was introduced only show the button
  // when an explicit WhatsApp number was provided — no more assuming phone == WhatsApp.
  // Older businesses (no strictWhatsapp flag) keep the legacy phone fallback.
  const whatsappNumber = business?.whatsapp || (!business?.strictWhatsapp ? business?.phone : null);

  const openWhatsApp = () => {
    if (!whatsappNumber) return;
    const num = whatsappNumber.replace(/\D/g, '');
    Linking.openURL(`https://wa.me/${num}?text=${encodeURIComponent(WHATSAPP_GREETING)}`);
  };

  const openFacebook = () => {
    if (!business?.facebook) return;
    const url = business.facebook.startsWith('http') ? business.facebook : `https://facebook.com/${business.facebook}`;
    Linking.openURL(url).catch(() => Alert.alert(t('Erreur'), t("Impossible d'ouvrir Facebook.")));
  };

  const openInstagram = () => {
    if (!business?.instagram) return;
    const handle = business.instagram.replace('@', '');
    Linking.openURL(`https://instagram.com/${handle}`).catch(() => Alert.alert(t('Erreur'), t("Impossible d'ouvrir.")));
  };

  const openMaps = () => {
    if (!business?.location) return;
    const { latitude, longitude, address } = business.location;
    const url = latitude && longitude
      ? `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`
      : address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}` : '';
    if (url) Linking.openURL(url).catch(() => Alert.alert(t('Erreur'), t("Impossible d'ouvrir Google Maps.")));
  };

  const handleLike = async () => {
    if (!user) {
      Alert.alert(t('Connexion requise'), t('Connectez-vous pour sauvegarder des favoris.'),
        [{ text: t('Se connecter'), onPress: () => router.push('/auth') }, { text: t('Annuler'), style: 'cancel' }]);
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
        message: `${business.name}\n${business.city} • ${business.category}\n\n${business.description?.slice(0, 100)}...\n\n${t('Trouvé sur BurkinaBizz')}`,
        title: business.name,
      });
    } catch {}
  };

  // ── REPORT ────────────────────────────────────────────────────────────────
  const handleReport = async () => {
    if (!user) {
      Alert.alert(t('Connexion requise'), t('Connectez-vous pour signaler une annonce.'),
        [{ text: t('Se connecter'), onPress: () => router.push('/auth') }, { text: t('Annuler'), style: 'cancel' }]);
      return;
    }
    if (!reportReason.trim()) { Alert.alert(t('Motif requis'), t('Veuillez indiquer la raison du signalement.')); return; }
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
      Alert.alert(t('✅ Signalement envoyé'), t('Notre équipe examinera cette annonce. Merci!'));
    } catch {
      Alert.alert(t('Erreur'), t("Impossible d'envoyer le signalement."));
    } finally { setSubmittingReport(false); }
  };

  // ── REVIEW ────────────────────────────────────────────────────────────────
  const handleSubmitReview = async () => {
    if (!user) {
      Alert.alert(t('Connexion requise'), '', [{ text: t('Se connecter'), onPress: () => router.push('/auth') }, { text: t('Annuler'), style: 'cancel' }]);
      return;
    }
    if (myRating === 0) { Alert.alert(t('Note requise'), t('Veuillez sélectionner une note.')); return; }
    if (containsProfanity(myComment)) {
      Alert.alert(
        t('⚠️ Langage inapproprié'),
        t('Votre avis contient des mots inappropriés. Merci de reformuler poliment et de le soumettre à nouveau.\n\nYour review contains inappropriate language. Please rephrase politely and resubmit.')
      );
      return;
    }
    setSubmittingReview(true);

    try {
      const businessRef = doc(db, 'businesses', id!);
      if (myExistingReview) {
        // UPDATE existing review — review edit + rating adjustment as one atomic transaction,
        // so the business doc's aggregate rating can never drift from the reviews subcollection.
        const reviewRef = doc(db, 'reviews', id!, 'items', myExistingReview.id);
        await runTransaction(db, async (transaction) => {
          transaction.update(reviewRef, {
            rating: myRating,
            comment: myComment.trim() || null,
          });
          transaction.update(businessRef, {
            ratingSum: increment(myRating - myExistingReview.rating),
          });
        });
        Alert.alert(t('✅ Avis modifié!'), t('Votre avis a été mis à jour.'));
      } else {
        // CREATE new review — same atomicity guarantee as the update path above.
        const reviewRef = doc(collection(db, 'reviews', id!, 'items'));
        await runTransaction(db, async (transaction) => {
          transaction.set(reviewRef, {
            userId: user.uid,
            userName: userProfile?.name || user.email || t('Utilisateur'),
            rating: myRating,
            comment: myComment.trim() || null,
            createdAt: serverTimestamp(),
          });
          transaction.update(businessRef, {
            ratingSum: increment(myRating),
            ratingCount: increment(1),
          });
        });
        Alert.alert(t('✅ Avis publié!'), t('Merci pour votre retour.'));
      }

      setShowReviewModal(false);
      setMyRating(0);
      setMyComment('');
    } catch (e: any) {
      Alert.alert(t('Erreur'), e?.message || t("Impossible de publier l'avis."));
    } finally { setSubmittingReview(false); }
  };

  const handleDeleteReview = async (review: any) => {
    Alert.alert(t('Supprimer votre avis?'), '', [
      { text: t('Annuler'), style: 'cancel' },
      {
        text: t('Supprimer'), style: 'destructive', onPress: async () => {
          try {
            const businessRef = doc(db, 'businesses', id!);
            const reviewRef = doc(db, 'reviews', id!, 'items', review.id);
            await runTransaction(db, async (transaction) => {
              transaction.delete(reviewRef);
              transaction.update(businessRef, {
                ratingSum: increment(-review.rating),
                ratingCount: increment(-1),
              });
            });
          } catch { Alert.alert(t('Erreur'), t('Impossible de supprimer.')); }
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
      Alert.alert(newPinned ? t('📌 Épinglée!') : t('Désépinglée'), newPinned ? t("Cette entreprise apparaîtra en tête de l'annuaire.") : t("L'entreprise n'est plus épinglée."));
    } catch { Alert.alert(t('Erreur'), t('Impossible de modifier.')); }
  };

  if (loading) return (
    <View style={{ flex: 1 }}>
      <AppHeader title={t('Entreprise')} />
      <LinearGradient
        colors={(theme.backgroundGradient || [theme.background, theme.background]) as [string, string, ...string[]]}
        style={styles.center}
      >
        <ActivityIndicator color={Colors.primary} size="large" />
      </LinearGradient>
    </View>
  );

  if (!business) return (
    <View style={{ flex: 1 }}>
      <AppHeader title={t('Entreprise')} />
      <LinearGradient
        colors={(theme.backgroundGradient || [theme.background, theme.background]) as [string, string, ...string[]]}
        style={styles.center}
      >
        <Text style={{ fontSize: 48 }}>😕</Text>
        <Text style={[styles.errorText, { color: theme.text }]}>{t('Entreprise introuvable')}</Text>
      </LinearGradient>
    </View>
  );

  const cat = CATEGORIES.find(c => c.label === business.category);
  const liked = isLiked(business.id);
  const photos = business.photos?.length ? business.photos : business.coverPhoto ? [business.coverPhoto] : [];

  return (
    <>
      <AppHeader
        title={business.name}
        rightElement={isAdmin ? (
          <TouchableOpacity onPress={handleTogglePin} style={styles.headerBtn}>
            <Ionicons name={business.pinned ? "pin" : "pin-outline"} size={22} color="#fff" />
          </TouchableOpacity>
        ) : undefined}
      />

      <LinearGradient
        colors={(theme.backgroundGradient || [theme.background, theme.background]) as [string, string, ...string[]]}
        style={{ flex: 1 }}
      >
      <ScrollView ref={scrollViewRef} style={styles.container} showsVerticalScrollIndicator={false}>

        {/* PINNED BANNER */}
        {business.pinned && (
          <View style={{ width: '100%', alignItems: 'center' }}>
            <View style={{ width: '100%', maxWidth: 600, paddingHorizontal: 16 }}>
              <View style={[styles.pinnedBanner, { backgroundColor: Colors.cta + '22' }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="pin" size={16} color={Colors.cta} />
                  <Text style={[styles.pinnedText, { color: Colors.cta }]}>{t('Entreprise mise en avant')}</Text>
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

        {/* AVATAR — overlaps the rounded hero photo bottom edge, left-aligned */}
        <View style={{ width: '100%', alignItems: 'center' }}>
          <View style={{ width: '100%', maxWidth: 600, paddingHorizontal: 16 }}>
            <View style={styles.avatarWrap}>
              <View style={[styles.avatarCircle, { borderColor: theme.background }, styles.cardShadow]}>
                {photos.length > 0 ? (
                  <Image source={{ uri: photos[0] }} style={styles.avatarImage} resizeMode="cover" />
                ) : (
                  <View style={[styles.avatarPlaceholder, { backgroundColor: (cat?.color || Colors.primary) + '22' }]}>
                    {cat ? (
                      <CategoryIcon iconName={cat.icon} iconFamily={cat.iconFamily} size={36} color={cat.color} />
                    ) : (
                      <MaterialCommunityIcons name="office-building" size={36} color={Colors.primary} />
                    )}
                  </View>
                )}
              </View>
            </View>
          </View>
        </View>

        <ContentContainer maxWidth={600} style={styles.body}>
          {/* NAME + LIKE */}
          <View style={styles.titleRow}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <Text
                  style={[styles.name, { color: theme.text, flex: 1 }]}
                  onTextLayout={e => setNameWidth(e.nativeEvent.lines[0]?.width ?? 0)}
                >
                  {business.name}
                </Text>
                {business.verified && (
                  <View style={{ backgroundColor: '#4CAF50', borderRadius: 7, paddingHorizontal: 8, paddingVertical: 2, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Ionicons name="checkmark-circle" size={14} color="#fff" />
                    <Text style={{ color: '#fff', fontSize: 12, fontWeight: '400' }}>{t('Vérifié')}</Text>
                  </View>
                )}
              </View>
              {nameWidth > 0 && (
                <View style={[styles.nameAccent, { width: nameWidth / 2 }]}>
                  <View style={[styles.nameAccentHalf, { backgroundColor: '#1B5E20' }]} />
                  <View style={[styles.nameAccentHalf, { backgroundColor: '#FFC107' }]} />
                </View>
              )}
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
              {business.openingHours && (
                <View style={{ marginTop: 6 }}>
                  <OpenStatusBadge openingHours={business.openingHours} />
                </View>
              )}
              {/* RATING SUMMARY */}
              {reviews.length > 0 && (
                <View style={styles.ratingRow}>
                  <StarRating rating={Math.round(avgRating)} size={14} />
                  <Text style={[styles.ratingText, { color: theme.textSecondary }]}>
                    {avgRating} ({reviews.length} {t('avis')})
                  </Text>
                </View>
              )}
            </View>
            <TouchableOpacity
              style={[styles.likeBtn, { backgroundColor: liked ? '#FFEBEE' : theme.surface, borderColor: theme.border }, styles.cardShadow]}
              onPress={handleLike} disabled={likeLoading}
              activeOpacity={0.8}
            >
              {likeLoading ? (
                <ActivityIndicator size="small" color={Colors.primary} />
              ) : (
                <Ionicons name={liked ? "heart" : "heart-outline"} size={28} color={liked ? "#D32F2F" : theme.textSecondary} />
              )}
            </TouchableOpacity>
          </View>

          {/* DESCRIPTION */}
          <View style={[styles.sectionCard, { backgroundColor: theme.card }]}>
            <SectionHeader icon="document-text-outline" color={Colors.primary} title={t('À propos')} theme={theme} />
            <Text style={[styles.description, { color: theme.textSecondary }]}>{business.description}</Text>
          </View>

          {/* VOIR AUSSI (related business) */}
          {relatedBusiness && (
            <TouchableOpacity
              style={[styles.infoCard, styles.relatedCard, { backgroundColor: theme.card, borderColor: theme.border }]}
              onPress={() => router.push(`/business/${relatedBusiness.id}`)}
              activeOpacity={0.8}
            >
              {relatedBusiness.coverPhoto ? (
                <Image source={{ uri: relatedBusiness.coverPhoto }} style={styles.relatedCardImage} />
              ) : (
                <View style={[styles.relatedCardImage, styles.relatedCardImageFallback, { backgroundColor: Colors.primary + '22' }]}>
                  <Ionicons name="storefront" size={22} color={Colors.primary} />
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={[styles.relatedCardLabel, { color: theme.textSecondary }]}>{t('Voir aussi')}</Text>
                <Text style={[styles.relatedCardName, { color: theme.text }]} numberOfLines={1}>{relatedBusiness.name}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
            </TouchableOpacity>
          )}

          {/* CONTACT BUTTONS */}
          <View style={[styles.sectionCard, { backgroundColor: theme.card }]}>
            <SectionHeader icon="call" color="#1096c3" title={t('Contacter')} theme={theme} />
            <View style={styles.contactRow}>
              {business.phone && (
                <TouchableOpacity style={[styles.contactBtn, { backgroundColor: Colors.headerGradient[0] }]} onPress={openPhone}>
                  <Ionicons name="call" size={20} color="#fff" />
                  <Text style={styles.contactBtnText}>{t('Appeler')}</Text>
                </TouchableOpacity>
              )}
              {whatsappNumber && (
                <TouchableOpacity style={[styles.contactBtn, { backgroundColor: '#1B5E20' }]} onPress={openWhatsApp}>
                  <Ionicons name="logo-whatsapp" size={20} color="#fff" />
                  <Text style={styles.contactBtnText}>{t('WhatsApp')}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* HORAIRES */}
          {business.openingHours && (
            <View style={[styles.sectionCard, { backgroundColor: theme.card }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <SectionHeader icon="time-outline" color="#EF6C00" title={t('Horaires')} theme={theme} />
                <OpenStatusBadge openingHours={business.openingHours} size="sm" />
              </View>
              {DAYS_MONDAY_FIRST.map(day => {
                const isToday = day === DAY_KEYS_BY_UTC_INDEX[new Date().getUTCDay()];
                return (
                  <View key={day} style={styles.hoursRow}>
                    <Text style={[styles.hoursDay, { color: isToday ? Colors.primary : theme.text }, isToday && { fontWeight: '600' }]}>
                      {t(DAY_LABELS_FR[day])}
                    </Text>
                    <Text style={[styles.hoursValue, { color: isToday ? Colors.primary : theme.textSecondary }, isToday && { fontWeight: '600' }]}>
                      {t(formatDayHours(business.openingHours![day]))}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}

          {/* SOCIAL */}
          {(business.facebook || business.instagram || business.website) && (
            <View style={[styles.sectionCard, { backgroundColor: theme.card }]}>
              <SectionHeader icon="share-social" color="#8e44ad" title={t('Réseaux sociaux')} theme={theme} />
              <View style={styles.socialRow}>
                {business.facebook && (
                  <TouchableOpacity style={[styles.socialBtn, { backgroundColor: Colors.headerGradient[0] }]} onPress={openFacebook}>
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
                    style={[styles.socialBtn, { backgroundColor: Colors.headerGradient[0] }]}
                    onPress={() => {
                      const url = business.website!.startsWith('http') ? business.website : `https://${business.website}`;
                      Linking.openURL(url!).catch(() => Alert.alert(t('Erreur'), t("Impossible d'ouvrir le site web.")));
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Ionicons name="globe-outline" size={18} color="#fff" />
                      <Text style={styles.socialBtnText}>{t('Site web')}</Text>
                    </View>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

          {/* LOCATION */}
          {business.location && (business.location.address || business.location.latitude) && (
            <View style={[styles.sectionCard, { backgroundColor: theme.card }]}>
              <SectionHeader icon="location" color="#0097A7" title={t('Localisation')} theme={theme} />
              {(business.location.address || business.location.latitude) && (
                <View style={{ marginBottom: 14 }}>
                  {business.location.address && (
                    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 6 }}>
                      <Ionicons name="location" size={16} color={theme.text} style={{ marginTop: 2 }} />
                      <Text style={[styles.mapsBtnAddress, { color: theme.text, flex: 1 }]} numberOfLines={2}>
                        {business.location.address}
                      </Text>
                    </View>
                  )}
                  {business.location.latitude && (
                    <Text style={[styles.mapsBtnCoords, { color: theme.textSecondary, marginLeft: business.location.address ? 22 : 0 }]}>
                      {business.location.latitude.toFixed(4)}, {business.location.longitude?.toFixed(4)}
                    </Text>
                  )}
                </View>
              )}
              <TouchableOpacity style={styles.mapsNavBtn} onPress={openMaps} activeOpacity={0.85}>
                <Ionicons name="navigate" size={18} color="#fff" />
                <Text style={styles.mapsNavBtnText}>{t('Voir dans Maps')}</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* SHARE + REPORT ROW */}
          <View style={styles.actionRow}>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: Colors.headerGradient[0] }]} onPress={handleShare} activeOpacity={0.85}>
              <Ionicons name="share-outline" size={18} color="#fff" />
              <Text style={styles.actionBtnText}>{t('Partager')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#B71C1C' }]} onPress={() => setShowReportModal(true)} activeOpacity={0.85}>
              <Ionicons name="flag-outline" size={18} color="#fff" />
              <Text style={styles.actionBtnText}>{t('Signaler')}</Text>
            </TouchableOpacity>
          </View>

          {/* CONTACT INFO CARD */}
          <View style={[styles.infoCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            {business.phone && <InfoRow iconName="call" label={t('Téléphone')} value={business.phone} theme={theme} />}
            {business.whatsapp && <InfoRow iconName="logo-whatsapp" label={t('WhatsApp')} value={business.whatsapp} theme={theme} />}
            {business.instagram && <InfoRow iconName="logo-instagram" label="Instagram" value={business.instagram} theme={theme} />}
            <InfoRow iconName="location" label={t('Ville')} value={business.city} theme={theme} />
          </View>

          {/* ── REVIEWS SECTION ──────────────────────────────────────────── */}
          <View style={styles.reviewsHeader}>
            <View>
              <Text style={[styles.sectionTitle, { color: theme.text, marginBottom: 2 }]}>
                {t('Avis')} ({reviews.length})
              </Text>
              {reviews.length > 0 && <StarRating rating={Math.round(avgRating)} size={16} />}
            </View>
            <TouchableOpacity
              style={styles.addReviewBtn}
              onPress={() => {
                if (!user) {
                  Alert.alert(t('Connexion requise'), '', [
                    { text: t('Se connecter'), onPress: () => router.push('/auth') },
                    { text: t('Annuler'), style: 'cancel' }
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
                  {myExistingReview ? t('Modifier mon avis') : t('Laisser un avis')}
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {reviewsLoading ? (
            <ActivityIndicator color={Colors.primary} />
          ) : reviews.length === 0 ? (
            <View style={[styles.emptyReviews, { backgroundColor: theme.card, borderColor: theme.border }, styles.cardShadow]}>
              <Ionicons name="chatbubbles-outline" size={40} color={theme.textSecondary} />
              <Text style={[{ color: theme.textSecondary, fontSize: 13, textAlign: 'center' }]}>
                {t('Aucun avis pour le moment. Soyez le premier!')}
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
      </LinearGradient>

      {/* ── REVIEW MODAL ──────────────────────────────────────────────────── */}
      <Modal visible={showReviewModal} animationType="slide" transparent onRequestClose={() => setShowReviewModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalSheet, { backgroundColor: theme.card }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <Ionicons name="create-outline" size={24} color={theme.text} />
                <Text style={[styles.modalTitle, { color: theme.text, marginBottom: 0 }]}>{t('Laisser un avis')}</Text>
              </View>
              <Text style={[styles.modalSub, { color: theme.textSecondary }]}>{t('Note *')}</Text>
              <StarRating rating={myRating} size={36} onPress={setMyRating} />
              <Text style={[styles.modalSub, { color: theme.textSecondary, marginTop: 16 }]}>{t('Commentaire (optionnel)')}</Text>
              <TextInput
                style={[styles.reviewInput, { borderColor: theme.border, backgroundColor: theme.surface, color: theme.text }]}
                placeholder={t('Partagez votre expérience...')}
                placeholderTextColor={theme.textSecondary}
                value={myComment} onChangeText={setMyComment}
                multiline numberOfLines={4} maxLength={400}
                textAlignVertical="top"
              />
              <View style={styles.modalBtns}>
                <TouchableOpacity style={[styles.modalCancelBtn, { borderColor: theme.border }]} onPress={() => { setShowReviewModal(false); setMyRating(0); setMyComment(''); }}>
                  <Text style={[styles.modalCancelText, { color: theme.textSecondary }]}>{t('Annuler')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalSubmitBtn, submittingReview && { opacity: 0.6 }]} onPress={handleSubmitReview} disabled={submittingReview}>
                  {submittingReview ? <ActivityIndicator color="#fff" /> : <Text style={styles.modalSubmitText}>{t('Publier')}</Text>}
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
              <Text style={[styles.modalTitle, { color: theme.text, marginBottom: 0 }]}>{t('Signaler cette annonce')}</Text>
            </View>
            <Text style={[styles.modalSub, { color: theme.textSecondary }]}>{t('Motif du signalement *')}</Text>
            {['Informations incorrectes', 'Entreprise fermée', 'Contenu inapproprié', 'Arnaque / Fraude', 'Doublon', 'Autre'].map(reason => (
              <TouchableOpacity
                key={reason}
                style={[styles.reportOption, { borderColor: reportReason === reason ? Colors.primary : theme.border, backgroundColor: reportReason === reason ? Colors.primary + '15' : 'transparent' }]}
                onPress={() => setReportReason(reason)}
              >
                <Text style={[styles.reportOptionText, { color: reportReason === reason ? Colors.primary : theme.text }]}>{t(reason)}</Text>
                {reportReason === reason && <Ionicons name="checkmark" size={20} color={Colors.primary} />}
              </TouchableOpacity>
            ))}
            <View style={styles.modalBtns}>
              <TouchableOpacity style={[styles.modalCancelBtn, { borderColor: theme.border }]} onPress={() => { setShowReportModal(false); setReportReason(''); }}>
                <Text style={[styles.modalCancelText, { color: theme.textSecondary }]}>{t('Annuler')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalSubmitBtn, { backgroundColor: '#B71C1C' }, submittingReport && { opacity: 0.6 }]} onPress={handleReport} disabled={submittingReport}>
                {submittingReport ? <ActivityIndicator color="#fff" /> : <Text style={[styles.modalSubmitText, { color: '#fff' }]}>{t('Signaler')}</Text>}
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
            ref={imageViewerRef}
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
            onScrollToIndexFailed={(info) => {
              setTimeout(() => {
                imageViewerRef.current?.scrollToIndex({ index: info.index, animated: false });
              }, 50);
            }}
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
  value: { flex: 1, fontSize: 13, fontWeight: '400', textAlign: 'right' },
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  errorText: { fontSize: 16, fontWeight: '400' },
  headerBtn: { paddingHorizontal: 6 },
  cardShadow: {
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8 },
      android: { elevation: 3 },
    }),
  },
  sectionCard: {
    borderRadius: 10, padding: 16,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8 },
      android: { elevation: 3 },
    }),
  },
  pinnedBanner: { paddingVertical: 8, paddingHorizontal: 16, alignItems: 'center' },
  pinnedText: { fontSize: 13, fontWeight: '400' },
  photo: { height: 280, borderBottomLeftRadius: 20, borderBottomRightRadius: 20 },
  photoPlaceholder: { height: 220, alignItems: 'center', justifyContent: 'center', borderBottomLeftRadius: 20, borderBottomRightRadius: 20, overflow: 'hidden' },
  avatarWrap: { marginTop: -40, alignItems: 'flex-start' },
  avatarCircle: { width: 80, height: 80, borderRadius: 40, borderWidth: 3, overflow: 'hidden', backgroundColor: '#fff' },
  avatarImage: { width: '100%', height: '100%' },
  avatarPlaceholder: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  dotRow: { position: 'absolute', bottom: 12, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  body: { padding: 16, gap: 16 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  name: { fontSize: 22, fontWeight: '600', lineHeight: 28 },
  nameAccent: { flexDirection: 'row', height: 4, borderRadius: 2, overflow: 'hidden', marginTop: 6, minWidth: 24 },
  nameAccentHalf: { flex: 1 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6, flexWrap: 'wrap' },
  catBadge: { borderRadius: 5, paddingHorizontal: 10, paddingVertical: 4 },
  catBadgeText: { fontSize: 12, fontWeight: '400' },
  city: { fontSize: 13 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  ratingText: { fontSize: 12 },
  likeBtn: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', borderWidth: 1, flexShrink: 0 },
  sectionTitle: { fontSize: 16, fontWeight: '400', marginBottom: 10 },
  description: { fontSize: 14, lineHeight: 22 },
  contactRow: { flexDirection: 'row', gap: 10 },
  contactBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 7, gap: 6 },
  contactBtnText: { color: '#fff', fontSize: 15, fontWeight: '400' },
  socialRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  socialBtn: { flex: 1, minWidth: 140, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 7 },
  socialBtnText: { color: '#fff', fontSize: 14, fontWeight: '400' },
  mapsBtnAddress: { fontSize: 14, fontWeight: '400', lineHeight: 20 },
  mapsBtnCoords: { fontSize: 11, marginTop: 2 },
  hoursRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  hoursDay: { fontSize: 13 },
  hoursValue: { fontSize: 13 },
  mapsNavBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.headerGradient[0], borderRadius: 7, paddingHorizontal: 12, paddingVertical: 8,
  },
  mapsNavBtnText: { color: '#fff', fontSize: 14, fontWeight: '400' },
  actionRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 16 },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 5,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 6 },
      android: { elevation: 3 },
    }),
  },
  actionBtnText: { fontSize: 14, fontWeight: '400', color: '#fff' },
  infoCard: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 14 },
  relatedCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 12,
  },
  relatedCardImage: { width: 48, height: 48, borderRadius: 8 },
  relatedCardImageFallback: { alignItems: 'center', justifyContent: 'center' },
  relatedCardLabel: { fontSize: 11, marginBottom: 2 },
  relatedCardName: { fontSize: 15, fontWeight: '600' },
  reviewsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  addReviewBtn: { backgroundColor: Colors.headerGradient[0], paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6 },
  addReviewBtnText: { color: '#fff', fontSize: 13, fontWeight: '400' },
  emptyReviews: { alignItems: 'center', padding: 24, borderRadius: 8, borderWidth: 1, gap: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: { borderTopLeftRadius: 14, borderTopRightRadius: 14, padding: 24, paddingBottom: 40 },
  modalTitle: { fontSize: 18, fontWeight: '400' },
  modalSub: { fontSize: 13, fontWeight: '400', marginBottom: 10 },
  reviewInput: { borderWidth: 1.5, borderRadius: 7, padding: 12, fontSize: 14, minHeight: 100, marginTop: 4 },
  reportOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1.5, borderRadius: 6, padding: 12, marginBottom: 8 },
  reportOptionText: { fontSize: 14, fontWeight: '400' },
  modalBtns: { flexDirection: 'row', gap: 10, marginTop: 20 },
  modalCancelBtn: { flex: 1, borderWidth: 1.5, borderRadius: 7, paddingHorizontal: 12, paddingVertical: 8, alignItems: 'center' },
  modalCancelText: { fontSize: 15, fontWeight: '400' },
  modalSubmitBtn: { flex: 1, backgroundColor: Colors.headerGradient[0], borderRadius: 7, paddingHorizontal: 12, paddingVertical: 8, alignItems: 'center' },
  modalSubmitText: { fontSize: 15, fontWeight: '400', color: '#fff' },
  imageViewerContainer: { flex: 1, backgroundColor: '#000', justifyContent: 'center' },
  imageViewerClose: { position: 'absolute', top: 50, right: 20, zIndex: 10, backgroundColor: 'rgba(0,0,0,0.5)', width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  imageViewerCounter: { position: 'absolute', top: 50, left: 20, zIndex: 10, backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 7 },
  imageViewerCounterText: { fontSize: 14, color: '#fff', fontWeight: '400' },
  imageViewerSlide: { width, height: '100%', justifyContent: 'center', alignItems: 'center' },
  imageViewerPhoto: { width: '100%', height: '100%' },
  imageViewerDots: { position: 'absolute', bottom: 40, alignSelf: 'center', flexDirection: 'row', gap: 6 },
  imageViewerDot: { width: 8, height: 8, borderRadius: 4 },
});