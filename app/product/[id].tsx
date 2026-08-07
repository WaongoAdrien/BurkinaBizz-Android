// app/business/[id].tsx — Business Detail Screen

import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Image,
  StyleSheet, Linking, Alert, ActivityIndicator, FlatList, Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../lib/AuthContext';
import { useLikes } from '../../hooks/useLikes';
import { Business } from '../../types/index2';
import { Colors, CATEGORIES, WHATSAPP_GREETING } from '../../constants';
import { useColorTheme } from '../../hooks/useColorTheme';
import { useTranslation, registerTranslations } from '../../lib/LanguageContext';

registerTranslations({
  'Entreprise introuvable': 'Business not found',
  'Erreur': 'Error',
  'Impossible douvrir Facebook.': 'Unable to open Facebook.',
  'Impossible d ouvrir la page.': 'Unable to open the page.',
  "Impossible douvrir Google Maps.": 'Unable to open Google Maps.',
  'Connexion requise': 'Login required',
  'Connectez-vous pour sauvegarder des favoris.': 'Log in to save favorites.',
  'Se connecter': 'Log in',
  'Annuler': 'Cancel',
  'À propos': 'About',
  'Contactez nous': 'Contact us',
  'Appeler': 'Call',
  'WhatsApp': 'WhatsApp',
  'Réseaux sociaux': 'Social media',
  'Facebook': 'Facebook',
  'Instagram': 'Instagram',
  'Localisation': 'Location',
  'Ouvrir': 'Open',
  'Téléphone': 'Phone',
  'Ville': 'City',
});

const { width } = Dimensions.get('window');

export default function BusinessDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { theme } = useColorTheme();
  const router = useRouter();
  const { user } = useAuth();
  const { isLiked, toggleLike } = useLikes(user?.uid);
  const { t } = useTranslation();

  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [activePhoto, setActivePhoto] = useState(0);
  const [likeLoading, setLikeLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    getDoc(doc(db, 'businesses', id)).then(snap => {
      if (snap.exists()) setBusiness({ id: snap.id, ...snap.data() } as Business);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  const openPhone = () => {
    if (!business?.phone) return;
    Linking.openURL(`tel:${business.phone}`);
  };

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
    Linking.openURL(url).catch(() => Alert.alert(t('Erreur'), t('Impossible douvrir Facebook.')));
  };

  const openInstagram = () => {
    if (!business?.instagram) return;
    const handle = business.instagram.replace('@', '');
    Linking.openURL(`https://instagram.com/${handle}`).catch(() => Alert.alert(t('Erreur'), t('Impossible d ouvrir la page.')));
  };

  const openMaps = () => {
    if (!business?.location) return;
    const { latitude, longitude, address } = business.location;
    let url = '';
    if (latitude && longitude) {
      // Coords → Google Maps directions
      url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
    } else if (address) {
      // Address → Google Maps search
      url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
    }
    if (url) Linking.openURL(url).catch(() => Alert.alert(t('Erreur'), t("Impossible douvrir Google Maps.")));
  };

  const handleLike = async () => {
    if (!user) {
      Alert.alert(t('Connexion requise'), t('Connectez-vous pour sauvegarder des favoris.'),
        [{ text: t('Se connecter'), onPress: () => router.push('/auth') }, { text: t('Annuler'), style: 'cancel' }]);
      return;
    }
    if (!business) return;
    setLikeLoading(true);
    try { await toggleLike(business as any); }
    finally { setLikeLoading(false); }
  };

  if (loading) return (
    <LinearGradient
      colors={(theme.backgroundGradient || [theme.background, theme.background]) as [string, string, ...string[]]}
      style={styles.center}
    >
      <ActivityIndicator color={Colors.primary} size="large" />
    </LinearGradient>
  );

  if (!business) return (
    <LinearGradient
      colors={(theme.backgroundGradient || [theme.background, theme.background]) as [string, string, ...string[]]}
      style={styles.center}
    >
      <Text style={{ fontSize: 48 }}>😕</Text>
      <Text style={[styles.errorText, { color: theme.text }]}>{t('Entreprise introuvable')}</Text>
    </LinearGradient>
  );

  const cat = CATEGORIES.find(c => c.label === business.category);
  const liked = isLiked(business.id);
  const photos = business.photos?.length ? business.photos : business.coverPhoto ? [business.coverPhoto] : [];

  return (
    <LinearGradient
      colors={(theme.backgroundGradient || [theme.background, theme.background]) as [string, string, ...string[]]}
      style={{ flex: 1 }}
    >
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

      {/* PHOTO GALLERY */}
      {photos.length > 0 ? (
        <View>
          <FlatList
            data={photos}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(_, i) => String(i)}
            onMomentumScrollEnd={(e) => {
              setActivePhoto(Math.round(e.nativeEvent.contentOffset.x / width));
            }}
            renderItem={({ item }) => (
              <Image source={{ uri: item }} style={[styles.photo, { width }]} resizeMode="cover" />
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
          <Text style={{ fontSize: 64 }}>{cat?.icon || '🏢'}</Text>
        </View>
      )}

      <View style={styles.body}>
        {/* NAME + LIKE */}
        <View style={styles.titleRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.name, { color: theme.text }]}>{business.name}</Text>
            <View style={styles.metaRow}>
              <View style={[styles.catBadge, { backgroundColor: (cat?.color || Colors.primary) + '22' }]}>
                <Text style={[styles.catBadgeText, { color: cat?.color || Colors.primary }]}>
                  {cat?.icon} {business.category}
                </Text>
              </View>
              <Text style={[styles.city, { color: theme.textSecondary }]}>📍 {business.city}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.likeBtn, { backgroundColor: liked ? '#FFEBEE' : theme.surface, borderColor: theme.border }]}
            onPress={handleLike}
            disabled={likeLoading}
          >
            {likeLoading
              ? <ActivityIndicator size="small" color={Colors.primary} />
              : <Text style={{ fontSize: 24 }}>{liked ? '❤️' : '🤍'}</Text>
            }
          </TouchableOpacity>
        </View>

        {/* DESCRIPTION */}
        <View style={[styles.section, { borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>{t('À propos')}</Text>
          <Text style={[styles.description, { color: theme.textSecondary }]}>{business.description}</Text>
        </View>

        {/* CONTACT BUTTONS */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>{t('Contactez nous')}</Text>
        <View style={styles.contactRow}>
          {business.phone && (
            <TouchableOpacity style={[styles.contactBtn, { backgroundColor: Colors.primary }]} onPress={openPhone}>
              <Text style={styles.contactIcon}>📞</Text>
              <Text style={styles.contactBtnText}>{t('Appeler')}</Text>
            </TouchableOpacity>
          )}
          {whatsappNumber && (
            <TouchableOpacity style={[styles.contactBtn, { backgroundColor: '#285b3b' }]} onPress={openWhatsApp}>
              <Text style={styles.contactIcon}>💬</Text>
              <Text style={styles.contactBtnText}>{t('WhatsApp')}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* SOCIAL MEDIA */}
        {(business.facebook || business.instagram) && (
          <>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>{t('Réseaux sociaux')}</Text>
            <View style={styles.socialRow}>
              {business.facebook && (
                <TouchableOpacity
                  style={[styles.socialBtn, { backgroundColor: '#1877F2' }]}
                  onPress={openFacebook}
                >
                  <Text style={styles.socialBtnText}>🔵 {t('Facebook')}</Text>
                </TouchableOpacity>
              )}
              {business.instagram && (
                <TouchableOpacity
                  style={[styles.socialBtn, { backgroundColor: '#E1306C' }]}
                  onPress={openInstagram}
                >
                  <Text style={styles.socialBtnText}>📸 {t('Instagram')}</Text>
                </TouchableOpacity>
              )}
            </View>
          </>
        )}

        {/* LOCATION */}
        {business.location && (business.location.address || business.location.latitude) && (
          <>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>{t('Localisation')}</Text>
            <TouchableOpacity
              style={[styles.mapsBtn, { borderColor: theme.border }]}
              onPress={openMaps}
              activeOpacity={0.8}
            >
              <View style={{ flex: 1 }}>
                {business.location.address && (
                  <Text style={[styles.mapsBtnAddress, { color: theme.text }]} numberOfLines={2}>
                    📍 {business.location.address}
                  </Text>
                )}
                {business.location.latitude && (
                  <Text style={[styles.mapsBtnCoords, { color: theme.textSecondary }]}>
                    {business.location.latitude.toFixed(4)}, {business.location.longitude?.toFixed(4)}
                  </Text>
                )}
              </View>
              <View style={styles.mapsBtnIcon}>
                <Text style={{ fontSize: 22 }}>🗺️</Text>
                <Text style={styles.mapsBtnIconText}>{t('Ouvrir')}</Text>
              </View>
            </TouchableOpacity>
          </>
        )}

        {/* CONTACT INFO */}
        <View style={[styles.infoCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          {business.phone && <InfoRow icon="📞" label={t('Téléphone')} value={business.phone} theme={theme} />}
          {business.whatsapp && <InfoRow icon="💬" label={t('WhatsApp')} value={business.whatsapp} theme={theme} />}
          {business.facebook && <InfoRow icon="🔵" label={t('Facebook')} value={business.facebook} theme={theme} />}
          {business.instagram && <InfoRow icon="📸" label={t('Instagram')} value={business.instagram} theme={theme} />}
          <InfoRow icon="📍" label={t('Ville')} value={business.city} theme={theme} />
        </View>
      </View>
    </ScrollView>
    </LinearGradient>
  );
}

function InfoRow({ icon, label, value, theme }: { icon: string; label: string; value: string; theme: any }) {
  return (
    <View style={infoStyles.row}>
      <Text style={infoStyles.icon}>{icon}</Text>
      <Text style={[infoStyles.label, { color: theme.textSecondary }]}>{label}</Text>
      <Text style={[infoStyles.value, { color: theme.text }]} numberOfLines={1}>{value}</Text>
    </View>
  );
}

const infoStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 10 },
  icon: { fontSize: 16, width: 24 },
  label: { fontSize: 13, width: 90 },
  value: { flex: 1, fontSize: 13, fontWeight: '400', textAlign: 'right' },
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  errorText: { fontSize: 16, fontWeight: '400' },
  photo: { height: 280 },
  photoPlaceholder: { height: 220, alignItems: 'center', justifyContent: 'center' },
  dotRow: { position: 'absolute', bottom: 12, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  body: { padding: 16, gap: 16 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  name: { fontSize: 22, fontWeight: '500', lineHeight: 28 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6, flexWrap: 'wrap' },
  catBadge: { borderRadius: 5, paddingHorizontal: 10, paddingVertical: 4 },
  catBadgeText: { fontSize: 12, fontWeight: '400' },
  city: { fontSize: 13 },
  likeBtn: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', borderWidth: 1, flexShrink: 0 },
  section: { borderTopWidth: 1, paddingTop: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '400', marginBottom: 10 },
  description: { fontSize: 14, lineHeight: 22 },
  contactRow: { flexDirection: 'row', gap: 10 },
  contactBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 7, gap: 6 },
  contactIcon: { fontSize: 18 },
  contactBtnText: { color: '#fff', fontSize: 15, fontWeight: '400' },
  socialRow: { flexDirection: 'row', gap: 10 },
  socialBtn: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 7 },
  socialBtnText: { color: '#fff', fontSize: 14, fontWeight: '400' },
  infoCard: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 14 },
  mapsBtn: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderRadius: 8, padding: 14, gap: 12, marginBottom: 4 },
  mapsBtnAddress: { fontSize: 14, fontWeight: '400', lineHeight: 20 },
  mapsBtnCoords: { fontSize: 11, marginTop: 2 },
  mapsBtnIcon: { alignItems: 'center', gap: 2 },
  mapsBtnIconText: { fontSize: 11, color: '#1976D2', fontWeight: '400' },
});